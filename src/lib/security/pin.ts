import { readJson, writeJson } from '@/lib/storage';
import { DEFAULT_PARENT_SETTINGS, type ParentSettings } from '@/types/settings';

const KEY = 'lmt.parent.v1';

/**
 * The parent PIN.
 *
 * This is a convenience barrier, not security: everything it guards is already
 * on the device and readable by anyone who opens devtools. Its job is to stop a
 * 13-year-old from casually switching the tutor into "show me the answer" mode,
 * and it is sized for exactly that. Hashing it rather than storing it plainly
 * costs nothing and avoids the PIN being reused elsewhere leaking in the clear.
 */
export function getParentSettings(): ParentSettings {
  return readJson<ParentSettings>(KEY, DEFAULT_PARENT_SETTINGS);
}

export function saveParentSettings(settings: ParentSettings): void {
  writeJson(KEY, settings);
}

async function hash(pin: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function newSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const hasPin = (): boolean => getParentSettings().pinHash !== null;

export async function setPin(pin: string): Promise<void> {
  const salt = newSalt();
  saveParentSettings({ ...getParentSettings(), pinSalt: salt, pinHash: await hash(pin, salt) });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const { pinHash, pinSalt } = getParentSettings();
  if (!pinHash || !pinSalt) return false;
  return (await hash(pin, pinSalt)) === pinHash;
}

export function clearPin(): void {
  saveParentSettings({ ...getParentSettings(), pinHash: null, pinSalt: null });
}

export function markExported(at = Date.now()): void {
  saveParentSettings({ ...getParentSettings(), lastExportAt: at });
}

/** Days since the last backup, or null if there has never been one. */
export function daysSinceExport(now = Date.now()): number | null {
  const { lastExportAt } = getParentSettings();
  if (!lastExportAt) return null;
  return Math.floor((now - lastExportAt) / 86_400_000);
}
