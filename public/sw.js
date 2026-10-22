// Offline support. Registered as sw.js?v=<build id>, so every deploy installs a fresh worker
// with its own cache, and the old cache is deleted on activate.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const CACHE = `sec-${VERSION}`
const scope = self.registration.scope // e.g. https://user.github.io/smart-exam-coach/

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // precache.json is written by the build and lists every built file (JS chunks, CSS, icons, templates).
      const files = await fetch(new URL('precache.json', scope), { cache: 'no-store' }).then((r) => r.json())
      await cache.addAll([scope, ...files.map((f) => new URL(f, scope).href)])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('sec-') && key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin || !req.url.startsWith(scope)) return

  if (req.mode === 'navigate') {
    // Network first so a new deploy is picked up; the cached page is the offline fallback.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(scope, copy))
          return res
        })
        .catch(() => caches.match(scope)),
    )
    return
  }
  // Built files have content hashes, so the cached copy is always correct.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
