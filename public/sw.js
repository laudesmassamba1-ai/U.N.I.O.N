const VERSION = 'union-offline-v3';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const DATA = `${VERSION}-data`;

function getBasePath() {
  try {
    const scopeUrl = new URL(self.registration.scope);
    let p = scopeUrl.pathname;
    if (!p.endsWith('/')) p += '/';
    return p;
  } catch {
    return '/';
  }
}

self.addEventListener('install', (event) => {
  const base = getBasePath();
  const shellUrls = [base, `${base}index.html`];
  const dataUrl = `${base}data/edition.json`;

  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => Promise.allSettled(shellUrls.map((u) => cache.add(u))))
      .catch(() => undefined),
  );
  event.waitUntil(
    caches
      .open(DATA)
      .then((cache) => cache.add(dataUrl))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'CACHE_EDITION' || typeof data.url !== 'string') return;
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(new Request(data.url, { cache: 'reload' })))
      .catch(() => undefined),
  );
});

async function networkFirstData(request) {
  const cache = await caches.open(DATA);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('{}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname.endsWith('/data/edition.json')) {
    event.respondWith(networkFirstData(request));
    return;
  }
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  if (url.pathname.includes('/studio')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(PAGES)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined),
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const base = getBasePath();
        const shell = (await caches.match(`${base}index.html`)) || (await caches.match(base));
        if (shell) return shell;
        return new Response(
          '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Hors ligne</title><body><h1>Page indisponible hors ligne</h1><p>Reconnectez-vous pour ouvrir cette page.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }),
  );
});
