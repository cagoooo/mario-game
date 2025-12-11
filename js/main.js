import { Game } from './Game.js?v=1.1.3';

window.onload = function () {
    console.log('Game Version: 1.1.4 (Restart Fix)');
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

    let game = null;

    // Start button
    uiElements.startBtn.addEventListener('click', () => {
        uiElements.startScreen.style.display = 'none';
        game = new Game(canvas, uiElements);
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
