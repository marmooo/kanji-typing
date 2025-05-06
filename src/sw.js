const CACHE_NAME = "2025-05-06 12:35";
const urlsToCache = [
  "/kanji-typing/",
  "/kanji-typing/index.js",
  "/kanji-typing/mp3/bgm.mp3",
  "/kanji-typing/mp3/cat.mp3",
  "/kanji-typing/mp3/correct.mp3",
  "/kanji-typing/mp3/end.mp3",
  "/kanji-typing/mp3/keyboard.mp3",
  "/kanji-typing/favicon/favicon.svg",
  "https://marmooo.github.io/fonts/textar-light.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
