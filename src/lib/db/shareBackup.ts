/**
 * Getting the backup file off the device.
 *
 * A copy that never leaves the phone is not a backup — and browsers offer no
 * way to write one out silently, so this has to be a deliberate action that is
 * as close to one tap as the platform allows.
 *
 * On a phone that means the system share sheet: from there the file goes to
 * iCloud Drive, to Files, to a WhatsApp message to yourself, or to email. On a
 * desktop it means a download. Both are handled here so nothing else has to
 * know which platform it is on.
 */

export type DeliveryResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/** iOS refuses a share whose payload carries anything besides `files`. */
function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function download(file: File): DeliveryResult {
  try {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.rel = 'noopener';
    // Appended to the document, and the URL revoked on a later tick: revoking
    // it on the line after click() races the browser's own read of the blob,
    // which is how a "successful" export can quietly produce no file at all.
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

export async function deliverBackup(json: string, filename: string): Promise<DeliveryResult> {
  const file = new File([json], filename, { type: 'application/json' });

  if (canShareFile(file)) {
    try {
      // Files only — no title, no text. Adding either makes iOS reject it.
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (err) {
      // A dismissed share sheet throws AbortError; that is a choice, not a fault,
      // and must not be recorded as a completed backup.
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      return download(file);
    }
  }

  return download(file);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} בייט`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} קילובייט`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} מגה`;
}
