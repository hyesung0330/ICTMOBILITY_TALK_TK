// service-worker.js

const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '../build/static/js', // 필요에 따라 다른 정적 리소스도 추가
  '/logo.png'
];

// 설치 이벤트 - 초기 리소스를 캐시에 추가
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 요청 가로채기 이벤트 - 캐시 또는 네트워크에서 제공
self.addEventListener('fetch', event => {
  event.respondWith(
      caches.match(event.request)
          .then(response => {
              // 캐시에서 발견되면 제공, 없으면 네트워크 요청
              return response || fetch(event.request).catch(() => {
                  // 네트워크도 실패할 경우 오프라인 페이지 제공
                  return caches.match('/offline.html');
              });
          })
  );
});


// 활성화 이벤트 - 오래된 캐시 제거
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
              console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
              console.error('Service Worker registration failed:', error);
          });
  });
}


  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 설치 팝업을 숨기기
    e.preventDefault();
    deferredPrompt = e;
    document.querySelector('#installButton').style.display = 'block'; // 설치 버튼 보이기
  });
  
  // 사용자가 설치 버튼을 클릭했을 때 처리
  document.querySelector('#installButton').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      deferredPrompt = null;
    }
  });
  