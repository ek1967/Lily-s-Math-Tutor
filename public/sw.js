/*
 * Two jobs, both of which need a service worker and cannot be done without one.
 *
 * 1. Share target. Android posts the shared files to the app's start URL as
 *    multipart form data. A static host cannot answer a POST, so this
 *    intercepts it, stashes the files, and redirects into the homework screen.
 *    That is what makes "share from WhatsApp" work — the route by which most
 *    worksheets actually arrive.
 *
 * 2. Offline. The practice loop, the lessons and the scheduler all work with no
 *    network; without a cached shell they would still need one to start.
 */

const VERSION = 'v1';
const SHELL_CACHE = `lmt-shell-${VERSION}`;
const SHARE_CACHE = 'lmt-share';
const SHARE_INDEX = 'shared-index';

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('lmt-shell-') && n !== SHELL_CACHE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

async function handleShare(request, url) {
  try {
    const form = await request.formData();
    const files = form.getAll('pages').filter((f) => f && typeof f === 'object' && 'type' in f);

    const cache = await caches.open(SHARE_CACHE);
    await Promise.all(
      files.map((file, i) =>
        cache.put(
          new Request(`${url.origin}${url.pathname}__shared__/${i}`),
          new Response(file, { headers: { 'content-type': file.type || 'image/jpeg' } }),
        ),
      ),
    );
    await cache.put(
      new Request(`${url.origin}${url.pathname}${SHARE_INDEX}`),
      new Response(JSON.stringify({ count: files.length })),
    );

    return Response.redirect(`${url.origin}${url.pathname}#/homework?shared=1`, 303);
  } catch {
    return Response.redirect(`${url.origin}${url.pathname}#/homework`, 303);
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.endsWith('/')) {
    event.respondWith(handleShare(event.request.clone(), url));
    return;
  }

  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // Navigations fall back to the cached shell, so the app opens offline.
      if (event.request.mode === 'navigate') {
        try {
          const fresh = await fetch(event.request);
          const cache = await caches.open(SHELL_CACHE);
          void cache.put(event.request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(event.request);
          return cached ?? (await caches.match(`${url.origin}${url.pathname}`)) ?? Response.error();
        }
      }

      // Hashed build assets never change under the same name: cache first.
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const fresh = await fetch(event.request);
        if (fresh.ok && /\/assets\/|\.(png|woff2|webmanifest)$/.test(url.pathname)) {
          const cache = await caches.open(SHELL_CACHE);
          void cache.put(event.request, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })(),
  );
});
