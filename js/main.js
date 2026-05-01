import { Game } from './Game.js';
import { AssetLoader } from './AssetLoader.js';
import { GAME_VERSION } from './version.js';
import { LEVELS, getUnlockedLevels, getLevelById } from './Levels.js';

window.onload = async function () {
    console.log('%c Game Version: ' + GAME_VERSION + ' (Level Select + 4 Worlds) ', 'background: #222; color: #00ff00; font-size: 20px; padding: 10px;');
    const canvas = document.getElementById('gameArea');

    // UI Elements
    const uiElements = {
        score: document.getElementById('score'),
        highScore: document.getElementById('highScore'),
        gameOver: document.getElementById('gameOver'),
        gameOverOverlay: document.getElementById('gameOverOverlay'),
        finalScore: document.getElementById('finalScore'),
        finalHighScore: document.getElementById('finalHighScore'),
        restartBtn: document.getElementById('restartButton'),
        leftBtn: document.getElementById('leftButton'),
        rightBtn: document.getElementById('rightButton'),
        jumpBtn: document.getElementById('jumpButton'),
        startScreen: document.getElementById('startScreen'),
        startBtn: document.getElementById('startButton'),
        pauseOverlay: document.getElementById('pauseOverlay'),
        pauseBtn: document.getElementById('pauseButton'),
        resumeBtn: document.getElementById('resumeButton'),
        muteBtn: document.getElementById('muteButton'),
        fullscreenBtn: document.getElementById('fullscreenButton'),
        settingsBtn: document.getElementById('settingsButton'),
        audioModal: document.getElementById('audioSettingsModal'),
        musicSlider: document.getElementById('musicVolumeSlider'),
        sfxSlider: document.getElementById('sfxVolumeSlider'),
        musicValue: document.getElementById('musicVolumeValue'),
        sfxValue: document.getElementById('sfxVolumeValue'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn')
    };

    // Preload images
    uiElements.startBtn.disabled = true;
    uiElements.startBtn.textContent = '載入中...';
    uiElements.startBtn.style.opacity = '0.5';
    uiElements.startBtn.style.cursor = 'not-allowed';

    const assetLoader = new AssetLoader();
    const imagePaths = {
        player: 'assets/player.png',
        enemy: 'assets/enemy.png',
        tiles: 'assets/tiles.png'
    };

    let loadedImages = null;
    try {
        const preloadPromise = assetLoader.loadImages(imagePaths);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Loading timed out')), 5000)
        );

        loadedImages = await Promise.race([preloadPromise, timeoutPromise]);

        uiElements.startBtn.disabled = false;
        uiElements.startBtn.textContent = '開始遊戲';
        uiElements.startBtn.style.opacity = '1';
        uiElements.startBtn.style.cursor = 'pointer';

        // Define Sprites (Example/Placeholder)
        // Assuming player.png is a 32x32 sprite sheet or single image for now
        // We will define a default 'idle' sprite using the whole image or a part of it
        // assetLoader.defineSprite('mario_idle', 'player', 0, 0, 32, 32);
        // assetLoader.defineSprite('mario_run_1', 'player', 32, 0, 32, 32); // Assuming sprite sheet layout
        // assetLoader.defineSprite('mario_run_2', 'player', 64, 0, 32, 32);
        // assetLoader.defineSprite('mario_jump', 'player', 96, 0, 32, 32);

        // Define Animations
        // assetLoader.defineAnimation('idle', ['mario_idle'], 10);
        // assetLoader.defineAnimation('run', ['mario_run_1', 'mario_run_2'], 8);
        // assetLoader.defineAnimation('jump', ['mario_jump'], 1);

    } catch (e) {
        console.error('Failed to preload images or timed out', e);
        uiElements.startBtn.textContent = '載入逾時 - 點擊重新整理';
        uiElements.startBtn.disabled = false;
        uiElements.startBtn.style.opacity = '1';
        uiElements.startBtn.style.cursor = 'pointer';
        uiElements.startBtn.onclick = () => window.location.reload();
        return; // Stop execution so we don't attach the game start listener
    }

    let game = null;

    // ========== Level Select (v2.27.0) ==========
    const levelSelectScreen = document.getElementById('levelSelectScreen');
    const levelSelectList = document.getElementById('levelSelectList');
    const levelSelectBack = document.getElementById('levelSelectBack');
    const levelClearedOverlay = document.getElementById('levelClearedOverlay');
    const lcLevelName = document.getElementById('lcLevelName');
    const lcScore = document.getElementById('lcScore');
    const lcUnlockMessage = document.getElementById('lcUnlockMessage');
    const lcNextLevelBtn = document.getElementById('lcNextLevelBtn');
    const lcMenuBtn = document.getElementById('lcMenuBtn');

    // Defensive: if any level-select DOM element is missing (e.g. stale cached HTML),
    // skip wiring up the level-select feature and fall back to direct Endless start.
    const levelSelectDomReady = !!(levelSelectScreen && levelSelectList && levelSelectBack
        && levelClearedOverlay && lcNextLevelBtn && lcMenuBtn);
    if (!levelSelectDomReady) {
        console.warn('[v2.27.0] Level-select DOM not found — likely stale cached index.html. ' +
            'Hard-refresh (Ctrl+Shift+R) or clear Service Worker to load the new menu.');
    }

    let selectedIndex = 0;
    let menuItems = [];

    function buildMenuItems() {
        const unlocked = getUnlockedLevels();
        const items = LEVELS.map(lvl => ({
            type: 'level',
            level: lvl,
            unlocked: unlocked.includes(lvl.id)
        }));
        items.push({ type: 'endless' });
        return items;
    }

    function renderLevelSelect() {
        menuItems = buildMenuItems();
        levelSelectList.innerHTML = '';
        if (selectedIndex >= menuItems.length) selectedIndex = 0;
        // Default selection: highest unlocked level (or Endless if all cleared)
        if (selectedIndex === 0) {
            for (let i = 0; i < menuItems.length; i++) {
                if (menuItems[i].type === 'level' && menuItems[i].unlocked) {
                    selectedIndex = i;
                }
            }
        }
        menuItems.forEach((item, i) => {
            const li = document.createElement('li');
            if (item.type === 'level') {
                li.className = item.unlocked ? 'unlocked' : 'locked';
                li.innerHTML = `
                    <span class="lsEmoji">${item.level.emoji}</span>
                    <span class="lsName">${item.level.name}</span>
                    <span class="lsSub">${item.level.subtitle}</span>
                    ${item.unlocked ? '' : '<span class="lsLock">🔒</span>'}
                `;
                if (item.unlocked) {
                    li.addEventListener('click', () => startGame(i));
                }
            } else {
                li.className = 'endless unlocked';
                li.innerHTML = `
                    <span class="lsEmoji">∞</span>
                    <span class="lsName">Endless Mode</span>
                    <span class="lsSub">無限挑戰</span>
                `;
                li.addEventListener('click', () => startGame(i));
            }
            if (i === selectedIndex) li.classList.add('selected');
            levelSelectList.appendChild(li);
        });
    }

    function moveSelection(dir) {
        const start = selectedIndex;
        do {
            selectedIndex = (selectedIndex + dir + menuItems.length) % menuItems.length;
        } while (
            menuItems[selectedIndex].type === 'level' &&
            !menuItems[selectedIndex].unlocked &&
            selectedIndex !== start
        );
        renderLevelSelect();
    }

    function startGame(index) {
        const item = menuItems[index];
        if (!item) return;
        if (item.type === 'level' && !item.unlocked) return;

        levelSelectScreen.classList.remove('active');
        levelClearedOverlay.classList.remove('active');
        uiElements.gameOverOverlay.style.display = 'none';
        uiElements.pauseOverlay.style.display = 'none';

        const levelConfig = (item.type === 'level') ? item.level : null;

        if (game) {
            // Reuse existing instance to avoid listener accumulation on canvas
            game.levelConfig = levelConfig;
            game.levelMode = !!levelConfig;
            game.levelCleared = false;
            game._levelClearedDispatched = false;
            game.restart();
        } else {
            game = new Game(canvas, uiElements, assetLoader, levelConfig);
            window.game = game;
        }

        canvas.addEventListener('marioLevelCleared', onLevelCleared, { once: true });
    }

    function onLevelCleared(e) {
        const { current, next, score } = e.detail;
        const cleared = getLevelById(current);
        lcLevelName.textContent = cleared ? `${cleared.name} ${cleared.emoji}` : current;
        lcScore.textContent = `SCORE: ${score}`;
        if (next) {
            const nextLvl = getLevelById(next);
            lcUnlockMessage.textContent = `🎉 已解鎖 ${nextLvl.name} ${nextLvl.subtitle}！`;
            lcNextLevelBtn.disabled = false;
            lcNextLevelBtn.dataset.nextId = next;
        } else {
            lcUnlockMessage.textContent = '🏆 全部關卡通關！恭喜大師！';
            lcNextLevelBtn.disabled = true;
            lcNextLevelBtn.dataset.nextId = '';
        }
        levelClearedOverlay.classList.add('active');
    }

    function showLevelSelect() {
        if (game) {
            game.gameRunning = false;
            game = null;
        }
        uiElements.startScreen.style.display = 'none';
        uiElements.gameOverOverlay.style.display = 'none';
        uiElements.pauseOverlay.style.display = 'none';
        levelClearedOverlay.classList.remove('active');
        selectedIndex = 0;
        renderLevelSelect();
        levelSelectScreen.classList.add('active');
    }

    if (levelSelectDomReady) {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!levelSelectScreen.classList.contains('active')) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(selectedIndex); }
            else if (e.key === 'Escape') { e.preventDefault(); levelSelectBack.click(); }
        });

        levelSelectBack.addEventListener('click', () => {
            levelSelectScreen.classList.remove('active');
            uiElements.startScreen.style.display = 'flex';
        });

        lcNextLevelBtn.addEventListener('click', () => {
            const nextId = lcNextLevelBtn.dataset.nextId;
            if (!nextId) return;
            const idx = menuItems.findIndex(it => it.type === 'level' && it.level.id === nextId);
            if (idx >= 0) {
                selectedIndex = idx;
                startGame(idx);
            }
        });

        lcMenuBtn.addEventListener('click', () => {
            showLevelSelect();
        });
    }

    // Start button → open level select (or fallback to direct Endless if menu unavailable)
    uiElements.startBtn.addEventListener('click', () => {
        if (!loadedImages) return;
        if (levelSelectDomReady) {
            showLevelSelect();
        } else {
            uiElements.startScreen.style.display = 'none';
            game = new Game(canvas, uiElements, assetLoader, null);
            window.game = game;
        }
    });

    // ========== PWA Update Banner (v2.27.1) ==========
    // Two redundant signals trigger the banner:
    //   (1) Service Worker fires `marioNewVersionReady` event (from index.html)
    //   (2) version.json polling detects a different version
    const updateBanner = document.getElementById('updateBanner');
    const updateBannerText = document.getElementById('updateBannerText');
    const updateBannerBtn = document.getElementById('updateBannerBtn');
    const updateBannerDismiss = document.getElementById('updateBannerDismiss');

    let bannerShownThisSession = false;
    function showUpdateBanner(detail = {}) {
        if (!updateBanner || bannerShownThisSession) return;
        bannerShownThisSession = true;
        if (detail.version && updateBannerText) {
            updateBannerText.textContent = `🎉 新版本 v${detail.version} 已就緒`;
        }
        updateBanner.classList.add('active');
    }

    if (updateBanner && updateBannerBtn && updateBannerDismiss) {
        updateBannerBtn.addEventListener('click', async () => {
            // Tell waiting SW to take over, then reload (controllerchange handler in index.html)
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                try {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg && reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        return; // controllerchange listener will trigger reload
                    }
                } catch (e) { /* fall through to manual reload */ }
            }
            window.location.reload();
        });

        updateBannerDismiss.addEventListener('click', () => {
            updateBanner.classList.remove('active');
        });

        window.addEventListener('marioNewVersionReady', (e) => {
            showUpdateBanner(e.detail || {});
        });

        // version.json polling — every 5 min + once on load (after 30s grace)
        let knownVersion = GAME_VERSION;
        async function checkVersion() {
            try {
                const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (data.version && data.version !== knownVersion) {
                    knownVersion = data.version;
                    showUpdateBanner({ version: data.version, notes: data.notes });
                }
            } catch (e) { /* offline — silent */ }
        }
        setTimeout(checkVersion, 30 * 1000);
        setInterval(checkVersion, 5 * 60 * 1000);
    }

    // Pause button
    uiElements.pauseBtn.addEventListener('click', () => {
        if (game && game.gameRunning) {
            game.pause();
            // Update pause stats
            if (game.achievementSystem) {
                const stats = game.achievementSystem.stats;
                document.getElementById('pauseKills').textContent = stats.enemiesKilled;
                document.getElementById('pauseCoins').textContent = stats.totalCoins;
                document.getElementById('pauseScore').textContent = game.score;
                document.getElementById('pauseAchievements').textContent =
                    `${game.achievementSystem.getUnlockedCount()}/${game.achievementSystem.getTotalCount()}`;
            }
        }
    });

    // Resume button
    uiElements.resumeBtn.addEventListener('click', () => {
        if (game) {
            game.resume();
        }
    });

    // ESC key for pause
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && game) {
            if (game.gameRunning) {
                game.pause();
            } else if (game.isPaused) {
                game.resume();
            }
        }
    });

    // Mute button
    uiElements.muteBtn.addEventListener('click', () => {
        if (game) {
            game.toggleMute();
            uiElements.muteBtn.textContent = game.isMuted ? '🔇' : '🔊';
        }
    });

    // Initialize mute button state
    if (localStorage.getItem('marioMuted') === 'true') {
        uiElements.muteBtn.textContent = '🔇';
    } else {
        uiElements.muteBtn.textContent = '🔊';
    }

    // Fullscreen button
    uiElements.fullscreenBtn.addEventListener('click', () => {
        try {
            if (!document.fullscreenElement &&
                !document.webkitFullscreenElement &&
                !document.mozFullScreenElement &&
                !document.msFullscreenElement) {

                const docEl = document.documentElement;
                if (docEl.requestFullscreen) {
                    docEl.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
                } else if (docEl.webkitRequestFullscreen) {
                    docEl.webkitRequestFullscreen();
                } else if (docEl.mozRequestFullScreen) {
                    docEl.mozRequestFullScreen();
                } else if (docEl.msRequestFullscreen) {
                    docEl.msRequestFullscreen();
                } else {
                    console.log('Fullscreen API not supported');
                }
                uiElements.fullscreenBtn.textContent = '⛶';
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                uiElements.fullscreenBtn.textContent = '⛶';
            }
        } catch (error) {
            console.warn('Fullscreen toggle failed:', error);
        }
    });

    // Touch device detection or small screen
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 850;

    // Handle window resize to show/hide buttons
    window.addEventListener('resize', () => {
        checkOrientation();
    });

    // Orientation Check (不阻擋直立遊玩，僅移除此功能)
    const checkOrientation = () => {
        // 直立模式現已開放遊玩，無需顯示旋轉警告
        const warning = document.getElementById('orientationWarning');
        if (warning) {
            warning.style.display = 'none';
        }
    };

    // Initial check
    checkOrientation();

    // ========== Audio Settings Modal ==========
    if (uiElements.settingsBtn && uiElements.audioModal) {
        // Open settings modal
        uiElements.settingsBtn.addEventListener('click', () => {
            uiElements.audioModal.classList.add('active');
            // Load current values from game audio system
            if (game && game.audioSystem && typeof game.audioSystem.getMusicVolume === 'function') {
                const musicVol = Math.round(game.audioSystem.getMusicVolume() * 100);
                const sfxVol = Math.round(game.audioSystem.getSFXVolume() * 100);
                uiElements.musicSlider.value = musicVol;
                uiElements.sfxSlider.value = sfxVol;
                uiElements.musicValue.textContent = musicVol + '%';
                uiElements.sfxValue.textContent = sfxVol + '%';
            }
        });

        // Music volume slider
        uiElements.musicSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            uiElements.musicValue.textContent = value + '%';
            if (game && game.audioSystem && typeof game.audioSystem.setMusicVolume === 'function') {
                game.audioSystem.setMusicVolume(value / 100);
            }
        });

        // SFX volume slider
        uiElements.sfxSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            uiElements.sfxValue.textContent = value + '%';
            if (game && game.audioSystem && typeof game.audioSystem.setSFXVolume === 'function') {
                game.audioSystem.setSFXVolume(value / 100);
                // Play test sound
                game.audioSystem.playSound('coin', 1, 0.5);
            }
        });

        // Close modal
        uiElements.closeSettingsBtn.addEventListener('click', () => {
            uiElements.audioModal.classList.remove('active');
        });

        // Close modal on background click
        uiElements.audioModal.addEventListener('click', (e) => {
            if (e.target === uiElements.audioModal) {
                uiElements.audioModal.classList.remove('active');
            }
        });
    }
};
