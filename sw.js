// Keeps a copy of the app so it opens without a connection, like in a library basement.
// The page is fetched fresh when online, so updates show up right away; the saved copy is only a fallback.
const CACHE = "study-spot-finder-v1";
const APP_FILES = ["./", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Map images and fonts are left to the network, so the saved copy stays small.
  if (url.hostname.endsWith("tile.openstreetmap.org") || url.hostname.includes("fonts.")) return;
  event.respondWith(fetch(request)
    .then((response) => {
      if (response.ok && (url.origin === self.location.origin || url.hostname === "cdnjs.cloudflare.com")) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => caches.match(request, { ignoreSearch: true }).then((saved) => saved
      || (request.mode === "navigate" ? caches.match("./") : Response.error()))));
});
