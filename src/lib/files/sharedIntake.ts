/**
 * Picks up files handed over by the Android share sheet. The service worker
 * catches the POST and parks the files in a cache; this reads them out on the
 * next load and clears them, so a share is consumed exactly once.
 */
const SHARE_CACHE = 'lmt-share';

function base(): string {
  return new URL('.', window.location.href).pathname;
}

export async function takeSharedFiles(): Promise<File[]> {
  try {
    if (!('caches' in window)) return [];
    const cache = await caches.open(SHARE_CACHE);
    const index = await cache.match(`${base()}shared-index`);
    if (!index) return [];

    const { count } = (await index.json()) as { count: number };
    const files: File[] = [];

    for (let i = 0; i < count; i += 1) {
      const key = `${base()}__shared__/${i}`;
      const response = await cache.match(key);
      if (!response) continue;
      const blob = await response.blob();
      files.push(new File([blob], `shared-${i}`, { type: blob.type || 'image/jpeg' }));
      await cache.delete(key);
    }

    await cache.delete(`${base()}shared-index`);
    return files;
  } catch {
    return [];
  }
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const register = () => {
    void navigator.serviceWorker.register(`${base()}sw.js`, { scope: base() }).catch(() => {});
  };

  // Registration waits for load so it never competes with the first paint —
  // but by the time React has mounted, `load` has usually already fired, and
  // listening for it then would mean never registering at all.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
