import { Game, preloadImages } from './Game.js?v=1.9.12';

window.onload = async function () {
    console.log('%c Game Version: 1.9.12 (Pipe Animation Fix) ', 'background: #222; color: #00ff00; font-size: 20px; padding: 10px;');
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
        fullscreenBtn: document.getElementById('fullscreenButton')
    };

    // Preload images
    uiElements.startBtn.disabled = true;
    uiElements.startBtn.textContent = '載入中...';
    uiElements.startBtn.style.opacity = '0.5';
    uiElements.startBtn.style.cursor = 'not-allowed';

    let loadedImages = null;
    try {
        const preloadPromise = preloadImages();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Loading timed out')), 5000)
        );

        loadedImages = await Promise.race([preloadPromise, timeoutPromise]);

        uiElements.startBtn.disabled = false;
        uiElements.startBtn.textContent = '開始遊戲';
        uiElements.startBtn.style.opacity = '1';
        uiElements.startBtn.style.cursor = 'pointer';
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

    // Start button
    uiElements.startBtn.addEventListener('click', () => {
        if (!loadedImages) return;
        uiElements.startScreen.style.display = 'none';
        game = new Game(canvas, uiElements, loadedImages);
        window.game = game; // Expose for testing
    });

    // Pause button
    uiElements.pauseBtn.addEventListener('click', () => {
        if (game && game.gameRunning) {
            game.pause();
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

    // Orientation Warning
    const checkOrientation = () => {
        const warningId = 'orientationWarning';
        let warning = document.getElementById(warningId);

        if (window.innerHeight > window.innerWidth && (isTouchDevice || isSmallScreen)) {
            if (!warning) {
                warning = document.createElement('div');
                warning.id = warningId;
                warning.innerHTML = '<div class="rotate-icon">📱</div><p>請將裝置轉為橫向<br>以獲得最佳體驗</p>';
                document.body.appendChild(warning);
            }
            warning.style.display = 'flex';
            if (game && game.gameRunning && !game.isPaused) {
                game.pause();
            }
        } else {
            if (warning) {
                warning.style.display = 'none';
            }
        }
    };

    // Initial check
    checkOrientation();
};
