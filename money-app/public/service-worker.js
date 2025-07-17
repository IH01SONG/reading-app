// public/service-worker.js

const CACHE_NAME = "my-life-manager-cache-v1"; // 캐시 이름 변경 시 업데이트
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/js/expense.js",
  "/js/todo.js",
  "/js/habit.js",
  "/js/charts.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  // 여기에 필요한 모든 이미지, 폰트 파일 등의 경로를 추가합니다.
  "/images/icons/icon-192x192.png", // 매니페스트에 지정한 아이콘도 캐싱
  "/images/icons/icon-512x512.png",
];

// 서비스 워커 설치 시 캐싱할 파일들을 미리 지정
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache); // 모든 파일 캐싱
    })
  );
});

// 네트워크 요청을 가로채서 캐시된 파일을 우선 반환
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 요청이 있으면 캐시된 응답 반환
      if (response) {
        return response;
      }
      // 캐시에 없으면 네트워크로 요청
      return fetch(event.request).then((res) => {
        // 유효하지 않은 응답(예: 404)은 캐시하지 않음
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        // 네트워크 응답을 캐시에 저장
        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return res;
      });
    })
  );
});

// 캐시 업데이트 (새로운 버전의 서비스 워커 활성화 시 이전 캐시 삭제)
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // 불필요한 캐시 삭제
          }
        })
      );
    })
  );
});
