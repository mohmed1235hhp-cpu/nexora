// Service-worker skeleton compatible with the pwa skill. The pwa skill owns
// the actual runtime SW registration; this file is the source template only.
export const swSource = `
self.addEventListener("install", (event) => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
`;
