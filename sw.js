// Service Worker for 懐中電灯 PWA
const CACHE_NAME = 'flashlight-pwa-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-192x192.png',
  './icon-384x384.png',
  './icon-512x512.png',
  './favicon.ico'
];

// Service Worker インストール時のキャッシュ
self.addEventListener('install', event => {
  console.log('Service Worker: インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: ファイルをキャッシュ中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: インストール完了');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: インストール中にエラー発生', error);
      })
  );
});

// Service Worker 有効化時の処理
self.addEventListener('activate', event => {
  console.log('Service Worker: 有効化中...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: 古いキャッシュを削除中...', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: 有効化完了');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Service Worker: 有効化中にエラー発生', error);
      })
  );
});

// fetch イベントのハンドリング（Cache First戦略）
self.addEventListener('fetch', event => {
  // HTTPSリクエストのみ処理
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // キャッシュにある場合はそれを返す
          if (response) {
            console.log('Service Worker: キャッシュから返却', event.request.url);
            return response;
          }
          
          // キャッシュにない場合はネットワークから取得
          console.log('Service Worker: ネットワークから取得', event.request.url);
          return fetch(event.request)
            .then(response => {
              // レスポンスが有効でない場合はそのまま返す
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // レスポンスをクローンしてキャッシュに保存
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(error => {
              console.error('Service Worker: ネットワークエラー', error);
              
              // オフライン時のフォールバック対応
              if (event.request.destination === 'document') {
                return caches.match('./index.html');
              }
              
              // その他のリソースのエラー対応
              throw error;
            });
        })
    );
  }
});

// プッシュ通知の処理（将来の拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './icon-192x192.png',
      badge: './icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'flashlight-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification('懐中電灯', options)
    );
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: 通知がクリックされました');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// メッセージ受信の処理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// バックグラウンド同期の処理（将来の拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: バックグラウンド同期実行');
    // バックグラウンドでの処理をここに実装
  }
});

// エラーハンドリング
self.addEventListener('error', event => {
  console.error('Service Worker: エラーが発生しました', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: 未処理のPromise拒否が発生しました', event.reason);
});

console.log('Service Worker: 懐中電灯PWA Service Worker読み込み完了');