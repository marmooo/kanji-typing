var CACHE_NAME = '2021-10-30 20:15';
var urlsToCache = [
  "/kanji-typing/",
  "/kanji-typing/index.js",
  "/kanji-typing/bgm.mp3",
  "/kanji-typing/cat.mp3",
  "/kanji-typing/correct.mp3",
  "/kanji-typing/end.mp3",
  "/kanji-typing/index.js",
  "/kanji-typing/keyboard.mp3",
  "/kanji-typing/favicon/original.svg",
  "https://marmooo.github.io/fonts/textar-light.woff2",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/index.js",
  "https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/css/index.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
