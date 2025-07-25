// public/service-worker.js

const CACHE_NAME = "my-life-manager-cache-v1"; // 캐시 이름 변경 시 업데이트
const urlsToCache = [
  // 중요: 모든 경로는 웹사이트의 루트(http://127.0.0.1:5500/money-app/) 기준입니다.
  // 외부 CDN 링크는 여기에 포함하지 마세요!

  "/", // 웹사이트의 루트 페이지
  "/index.html", // index.html 파일

  // CSS 파일 (css 폴더 안에 있다면)
  "/css/style.css",

  // JavaScript 파일 (js 폴더 안에 있다면)
  "/js/main.js",
  "/js/expense.js",
  "/js/todo.js",
  // 이 파일이 실제로 프로젝트에 있는지 확인하세요. 없으면 제거
  "/js/charts.js",

  // PWA 관련 아이콘 및 매니페스트 파일 (있다면 주석 해제 후 경로 확인)
  // "/images/icons/icon-192x192.png",
  // "/images/icons/icon-512x512.png",
  // "/manifest.json", // index.html과 같은 위치에 있다면
];

// 서비스 워커 설치 시 캐싱할 파일들을 미리 지정
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        // 외부 CDN 링크를 제거했으므로 이제 이 부분이 정상적으로 작동해야 합니다.
        return cache.addAll(urlsToCache); // 모든 파일 캐싱
      })
      .catch((error) => {
        // 캐싱 실패 시 오류를 더 자세히 로깅 (디버깅용)
        console.error("Failed to add resources to cache:", error);
        // 어떤 URL이 문제를 일으켰는지 확인하려면, Promise.allSettled를 사용할 수 있습니다.
        // 예를 들어:
        // return Promise.allSettled(urlsToCache.map(url => cache.add(url)))
        //   .then(results => {
        //     results.forEach((result, index) => {
        //       if (result.status === 'rejected') {
        //         console.error(`Failed to cache ${urlsToCache[index]}: ${result.reason}`);
        //       }
        //     });
        //   });
      })
  );
});

// 네트워크 요청을 가로채서 캐시된 파일을 우선 반환 (Fetch 전략: Cache, then Network)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 요청이 있으면 캐시된 응답 반환
      if (response) {
        return response;
      }

      // 중요: 외부 CDN 요청도 여기서 처리할 수 있습니다.
      // 복제된 요청을 사용하여 캐시에 저장
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((res) => {
        // 유효하지 않은 응답(예: 404, 네트워크 오류)은 캐시하지 않음
        // 또한, 외부 요청 (res.type !== 'basic')은 put()으로 캐시할 때 CORS 문제가 없을 때만 가능합니다.
        // 여기서는 캐시에 저장하기 전에 'basic' 타입(동일 출처) 요청인지 확인하는 것이 안전합니다.
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
