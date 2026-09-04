import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deliverBackup, formatBytes } from '@/lib/db/shareBackup';

const original = {
  canShare: navigator.canShare,
  share: navigator.share,
  createObjectURL: URL.createObjectURL,
  revokeObjectURL: URL.revokeObjectURL,
};

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  Object.assign(navigator, { canShare: original.canShare, share: original.share });
  URL.createObjectURL = original.createObjectURL;
  URL.revokeObjectURL = original.revokeObjectURL;
  vi.restoreAllMocks();
});

function withShare(impl: (data: ShareData) => Promise<void>, canShare = true) {
  Object.assign(navigator, {
    canShare: vi.fn(() => canShare),
    share: vi.fn(impl),
  });
}

/**
 * A copy that never leaves the phone is not a backup, and this is the only path
 * that gets one off the device — so its failure modes matter more than most.
 */
describe('delivering a backup', () => {
  it('uses the share sheet when the platform offers one', async () => {
    withShare(async () => {});
    expect(await deliverBackup('{}', 'b.json')).toBe('shared');
  });

  it('sends only the files field, because iOS rejects anything else', async () => {
    const seen: ShareData[] = [];
    withShare(async (data) => {
      seen.push(data);
    });
    await deliverBackup('{}', 'b.json');
    expect(Object.keys(seen[0]!)).toEqual(['files']);
  });

  it('falls back to a download when sharing is unavailable', async () => {
    Object.assign(navigator, { canShare: undefined, share: undefined });
    expect(await deliverBackup('{}', 'b.json')).toBe('downloaded');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('falls back when the platform declines this payload', async () => {
    withShare(async () => {}, false);
    expect(await deliverBackup('{}', 'b.json')).toBe('downloaded');
  });

  it('reports a dismissed share sheet as cancelled, not as a backup', async () => {
    // Recording a cancelled share as a completed backup would tell a parent
    // they are protected when they are not — the worst possible lie here.
    withShare(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    expect(await deliverBackup('{}', 'b.json')).toBe('cancelled');
  });

  it('falls back to a download if sharing fails for any other reason', async () => {
    withShare(async () => {
      throw new Error('no target');
    });
    expect(await deliverBackup('{}', 'b.json')).toBe('downloaded');
  });

  it('does not revoke the object URL before the browser has read it', async () => {
    Object.assign(navigator, { canShare: undefined, share: undefined });
    await deliverBackup('{}', 'b.json');
    // Revoking on the next line after click() races the browser's own read,
    // which is how an export can "succeed" and produce no file.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('leaves no anchor behind in the document', async () => {
    Object.assign(navigator, { canShare: undefined, share: undefined });
    await deliverBackup('{}', 'b.json');
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  });
});

describe('formatBytes', () => {
  it('reads naturally at each scale', () => {
    expect(formatBytes(512)).toBe('512 בייט');
    expect(formatBytes(650 * 1024)).toBe('650 קילובייט');
    expect(formatBytes(53 * 1024 * 1024)).toBe('53.0 מגה');
  });
});
