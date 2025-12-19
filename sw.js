const CACHE_NAME = 'mario-game-v2.14.0-sprint';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/Game.js',
    './js/Player.js',
    './js/Background.js',
    './js/InputHandler.js',
    './js/utils.js',
    './js/LevelGenerator.js',
    './js/CollisionSystem.js',
    './js/EnemyManager.js',
    './js/Enemy.js',
    './js/Coin.js',
    './js/QuestionBlock.js',
    './js/Mushroom.js',
    './js/Star.js',
    './js/FireFlower.js',
    './js/Fireball.js',
    './js/Pipe.js',
    './js/Lava.js',
    './js/Boss.js',
    './js/AudioSystem.js',
    './js/ParticleSystem.js',
    './js/ObjectPool.js',
    './js/PlayerStates.js',
    './js/AssetLoader.js',
    './js/Magnet.js',
    './js/MegaMushroom.js',
    './js/Cannon.js',
    './js/AchievementSystem.js',
    './js/SpriteAnimator.js',
    './js/OneUpMushroom.js',
    './js/Checkpoint.js',
    './js/LightingSystem.js',
    './js/WeatherSystem.js',
    './js/Camera.js',
    './js/BonusLevelGenerator.js',
    './js/Tutorial.js',
    './js/Config.js',
    './js/UIManager.js',
    './js/TransitionManager.js',
    './js/SpatialGrid.js',
    './js/LevelLoader.js',
    './js/IceFlower.js',
    './js/Iceball.js',
    './levels/world-1-1.json',
    './assets/player.png',
    './assets/enemy.png',
    './assets/tiles.png',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
    self.skipWaiting(); // Force activation
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
                    console.warn('Fetch failed for:', event.request.url, error);
                    throw error;
                });
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
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
        }).then(() => self.clients.claim()) // Take control immediately
    );
});
