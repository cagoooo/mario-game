const CACHE_NAME = 'mario-game-v1.7.4';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './js/main.js',
    './js/Game.js',
    './js/Player.js',
    './js/Enemy.js',
    './js/Platform.js',
    './js/Lava.js',
    './js/Background.js',
    './js/InputHandler.js',
    './js/Coin.js',
    './js/QuestionBlock.js',
    './js/Mushroom.js',
    './js/Star.js',
    './js/FireFlower.js',
    './js/Fireball.js',
    './js/Pipe.js',
    './js/utils.js',
    './manifest.json',
    './assets/player.png',
    './assets/enemy.png',
    './assets/tiles.png',
    './assets/tiles.png',
    './assets/icon-192.png',
    './favicon.ico'
];

// Install event - cache files
self.addEventListener('install', event => {
    // Force immediate activation
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching game files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request).catch(error => {
                    console.error('Fetch failed:', event.request.url, error);
                    // Return a 404 response or offline image if needed
                    // return new Response('Offline', { status: 404, statusText: 'Offline' });
                });
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    // Claim clients immediately
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
