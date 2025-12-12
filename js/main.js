import { Game, preloadImages } from './Game.js?v=1.3.0';

window.onload = async function () {
    console.log('%c Game Version: 1.3.0 (Infinite Runner Mode) ', 'background: #222; color: #bada55; font-size: 20px; padding: 10px;');
    const canvas = document.getElementById('gameArea');

    // UI Elements
    const uiElements = {
        score: document.getElementById('score'),
        highScore: document.getElementById('highScore'),
        gameOver: document.getElementById('gameOver'),
        gameOverOverlay: document.getElementById('gameOverOverlay'),
        finalScore: document.getElementById('finalScore'),
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
        loadedImages = await preloadImages();
        uiElements.startBtn.disabled = false;
        uiElements.startBtn.textContent = '開始遊戲';
        uiElements.startBtn.style.opacity = '1';
        uiElements.startBtn.style.cursor = 'pointer';
    } catch (e) {
        console.error('Failed to preload images', e);
        uiElements.startBtn.textContent = '載入失敗';
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

    // Fullscreen button
    uiElements.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.body.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
            uiElements.fullscreenBtn.textContent = '⛶';
        } else {
            document.exitFullscreen();
            uiElements.fullscreenBtn.textContent = '⛶';
        }
    });

    // Touch device detection or small screen
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 850;

    // Always show controls if touch device, small screen, or for testing
    if (isTouchDevice || isSmallScreen) {
        document.getElementById('controlButtons').style.display = 'flex';
    }

    // Handle window resize to show/hide buttons
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
            document.getElementById('controlButtons').style.display = 'flex';
        } else {
            // Optional: hide if you want, but for now let's keep them if they were shown
            // or strictly follow the rule:
            // document.getElementById('controlButtons').style.display = 'none';
        }
    });
};
