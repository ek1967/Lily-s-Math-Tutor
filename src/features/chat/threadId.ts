/**
 * Thread ids for conversations that are not anchored to a topic or a worksheet.
 *
 * It lives here rather than inline at the call site because the home screen was
 * minting one inside its render — a fresh id on every re-render, so the link
 * under her finger changed as she reached for it, and each visit orphaned the
 * one before.
 */
export function newFreeThreadId(at = Date.now()): string {
  return `free-${at.toString(36)}`;
}
