// Service Worker — strategy-split caching (v2.27.1+)
// ─────────────────────────────────────────────────────────────
// HTML / version.json → network-first (always pick up fresh entry)
// ?v=X.Y.Z assets    → cache-first (URL is the cache key)
// JSON / images      → cache-first with network fallback
// ─────────────────────────────────────────────────────────────
// Bumping rules (enforced by scripts/bump-version.js):
//   js/version.js GAME_VERSION  ←→  sw.js CACHE_VERSION  ←→  version.json
const CACHE_VERSION = '2.33.0';
const STATIC_CACHE = `mario-static-v${CACHE_VERSION}`;
const HTML_CACHE = `mario-html-v${CACHE_VERSION}`;

const PRECACHE = [
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
    './js/Levels.js',
    './js/Rewards.js',
    './js/saveHelper.js',
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
    './js/EnemyBehaviors.js',
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
        caches.open(STATIC_CACHE).then(cache => {
            console.log('[SW] Precaching for', CACHE_VERSION);
            return Promise.allSettled(
                PRECACHE.map(url => cache.add(url).catch(err => {
                    console.warn('[SW] Skip precache fail:', url, err.message);
                }))
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => !k.endsWith(`v${CACHE_VERSION}`))
                    .map(k => {
                        console.log('[SW] Deleting old cache:', k);
                        return caches.delete(k);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

function isVersionedAsset(url) {
    return url.search.includes('v=');
}

function isHtmlNavigation(req, url) {
    if (req.mode === 'navigate') return true;
    if (url.pathname === '/' || url.pathname.endsWith('/')) return true;
    if (url.pathname.endsWith('.html')) return true;
    return false;
}

function isVersionJson(url) {
    return url.pathname.endsWith('/version.json');
}

async function networkFirst(req, cacheName) {
    try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
            const cache = await caches.open(cacheName);
            cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
    } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
    }
}

async function cacheFirst(req, cacheName) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const fresh = await fetch(req);
    if (fresh && fresh.ok && fresh.type !== 'opaque') {
        const cache = await caches.open(cacheName);
        cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
}

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // version.json: always network-first, never serve stale
    if (isVersionJson(url)) {
        event.respondWith(networkFirst(req, HTML_CACHE));
        return;
    }

    // HTML / navigation: network-first so users get fresh entry point
    if (isHtmlNavigation(req, url)) {
        event.respondWith(networkFirst(req, HTML_CACHE));
        return;
    }

    // Versioned assets (?v=X.Y.Z): cache-first (URL is unique per version)
    if (isVersionedAsset(url)) {
        event.respondWith(cacheFirst(req, STATIC_CACHE));
        return;
    }

    // Everything else (precached files, images, level JSON): cache-first
    event.respondWith(cacheFirst(req, STATIC_CACHE));
});

// Allow page to ping SW to skip waiting (used by update banner)
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
