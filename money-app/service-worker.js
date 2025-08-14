// service-worker.js

const CACHE_NAME = "money-app-cache-v1";
// GitHub Pages 같은 서브경로(host/reading-app/money-app/) 배포를 고려해 상대경로 사용
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/expense.js",
  "./js/todo.js",
  "./js/charts.js",
  "./images/icons/icon-192x192.png",
  "./images/icons/icon-512x512.png",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const responseToCache = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache));
          return res;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((name) =>
            name === CACHE_NAME ? undefined : caches.delete(name)
          )
        )
      )
  );
});
