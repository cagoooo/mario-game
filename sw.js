// Bump CACHE_NAME on every release to invalidate old caches.
// Single source of truth: js/version.js (GAME_VERSION) — keep in sync.
const CACHE_NAME = 'mario-game-v2.26.0';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './assets/icon-192.png',
    './assets/player.png',
    './assets/enemy.png',
    './assets/tiles.png',
    './levels/world-1-1.json',
    './js/main.js',
    './js/Game.js',
    './js/version.js',
    './js/Player.js',
    './js/PlayerStates.js',
    './js/Background.js',
    './js/InputHandler.js',
    './js/utils.js',
    './js/LevelGenerator.js',
    './js/LevelLoader.js',
    './js/CollisionSystem.js',
    './js/SpatialGrid.js',
    './js/EnemyManager.js',
    './js/Enemy.js',
    './js/Boss.js',
    './js/Coin.js',
    './js/QuestionBlock.js',
    './js/Mushroom.js',
    './js/Star.js',
    './js/FireFlower.js',
    './js/Fireball.js',
    './js/IceFlower.js',
    './js/Iceball.js',
    './js/Pipe.js',
    './js/Platform.js',
    './js/Lava.js',
    './js/AudioSystem.js',
    './js/ParticleSystem.js',
    './js/ObjectPool.js',
    './js/AssetLoader.js',
    './js/Magnet.js',
    './js/MegaMushroom.js',
    './js/OneUpMushroom.js',
    './js/Cape.js',
    './js/Cannon.js',
    './js/AchievementSystem.js',
    './js/SpriteAnimator.js',
    './js/Checkpoint.js',
    './js/LightingSystem.js',
    './js/WeatherSystem.js',
    './js/Camera.js',
    './js/BonusLevelGenerator.js',
    './js/Tutorial.js',
    './js/Config.js',
    './js/UIManager.js',
    './js/TransitionManager.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching game files for', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('[SW] cache.addAll failed:', err))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request).catch(error => {
                    console.warn('[SW] Fetch failed for:', event.request.url, error);
                    throw error;
                });
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});
