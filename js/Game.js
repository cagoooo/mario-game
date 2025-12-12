import { Player } from './Player.js';
import { Background } from './Background.js';
import { InputHandler } from './InputHandler.js';
import { generatePlatforms } from './Platform.js';
import { createEnemies } from './Enemy.js';
import { checkCollision } from './utils.js';
import { Coin, generateCoins } from './Coin.js';
import { QuestionBlock, generateQuestionBlocks } from './QuestionBlock.js';
import { Mushroom } from './Mushroom.js';
import { Pipe, generatePipes } from './Pipe.js';

export class Game {
    constructor(canvas, uiElements, images) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiElements;
        this.images = images;

        this.width = canvas.width;
        this.height = canvas.height;
        this.levelWidth = 4000; // Initial buffer, but effectively infinite
        this.GROUND_Y = this.height - 50;

        this.lastGeneratedX = 0;
        this.CHUNK_SIZE = 2000;
        this.renderDistance = 3000;

        this.camera = { x: 0, y: 0 };

        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.isNewHighScore = false;
        this.isPaused = false;
        this.isMuted = false;

        // Score popup system
        this.scorePopups = [];

        // Celebration particles
        this.particles = [];

        // Screen shake
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Audio
        this.audioCtx = null;
        this.bgmOscillator = null;
        this.bgmGain = null;

        this.input = new InputHandler(() => this.onJump());
        this.input.attachCanvas(canvas);
        this.input.attachControls(uiElements.leftBtn, uiElements.rightBtn, uiElements.jumpBtn);

        this.background = new Background(this.levelWidth, this.GROUND_Y);

        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.pipes = [];

        this.ui.restartBtn.addEventListener('click', () => this.restart());

        // Update high score display
        this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        this.ui.score.textContent = `⭐ 0`;

        this.handleAnyKeyRestart = this.handleAnyKeyRestart.bind(this);

        // Start immediately since images are preloaded
        this.start();
    }

    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('marioHighScore')) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('marioHighScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score');
        }
    }

    addScorePopup(x, y, value) {
        this.scorePopups.push({
            x: x,
            y: y,
            value: value,
            life: 60, // frames
            velocity: -2
        });
    }

    addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                life: 60 + Math.random() * 30,
                color: color,
                size: 3 + Math.random() * 4
            });
        }
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // ...


    playSound(type) {
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);

        switch (type) {
            case 'jump':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.2);
                break;
            case 'stomp':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.15);
                break;
            case 'gameOver':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(330, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.5);
                break;
            case 'newHighScore':
                // Celebratory jingle
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(523, this.audioCtx.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, this.audioCtx.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, this.audioCtx.currentTime + 0.2); // G5
                oscillator.frequency.setValueAtTime(1047, this.audioCtx.currentTime + 0.3); // C6
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.5);
                break;
            case 'coin':
                // Short coin pickup sound
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(988, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(1319, this.audioCtx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.15);
                break;
            case 'land':
                // Soft landing thud
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(80, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.1);
                break;
            case 'block':
                // Block hit sound
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(200, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.1);
                break;
        }

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
    start() {
        this.initAudio();
        this.initGame();
        this.startBGM();
        this.gameLoop();
    }

    initGame() {
        this.player = new Player(50, this.GROUND_Y, this.images.player);
        this.player.setGroundY(this.GROUND_Y);

        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.pipes = [];

        this.lastGeneratedX = 0;
        this.generateChunk(0, this.levelWidth);

        this.gameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.isNewHighScore = false;
        this.camera = { x: 0, y: 0 };
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.scorePopups = [];
        this.particles = [];
        this.updateScore();

        this.ui.pauseOverlay.style.display = 'none';
        this.background.setTiles(this.images.tiles);
    }

    onJump() {
        this.initAudio();
        if (!this.gameRunning) return;
        if (this.player && this.player.jump()) {
            this.playSound('jump');
        }
    }

    update() {
        if (!this.gameRunning || !this.player) return;

        // Camera logic - update BEFORE player so mouse position calculation is accurate
        let targetCamX = this.player.x - this.width / 2 + this.player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        // Removed max level width constraint for infinite scrolling
        // if (targetCamX > this.levelWidth - this.width) targetCamX = this.levelWidth - this.width;
        this.camera.x = targetCamX;

        // Infinite generation logic
        if (this.player.x + this.renderDistance > this.lastGeneratedX) {
            this.generateChunk(this.lastGeneratedX, this.lastGeneratedX + this.CHUNK_SIZE);
        }

        // Cleanup logic (remove objects far behind camera)
        const cleanupX = this.camera.x - 1000;
        this.cleanupObjects(cleanupX);

        // Pass camera to player for mouse position calculation
        this.player.camera = this.camera;
        this.player.update(this.input, this.platforms, this.levelWidth);

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.levelWidth);

            if (checkCollision(this.player, enemy)) {
                if (this.player.velY > 0 && this.player.y + this.player.height < enemy.y + enemy.height / 2) {
                    // Add score popup at enemy position
                    this.addScorePopup(enemy.x, enemy.y, 100);
                    // Add particles
                    this.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');

                    this.enemies.splice(i, 1);
                    this.player.velY = -12 * 0.7;
                    this.score += 100;
                    this.updateScore();
                    this.playSound('stomp');

                    // Check for new high score during game
                    if (this.score > this.highScore && !this.isNewHighScore) {
                        this.isNewHighScore = true;
                        this.addParticles(this.player.x, this.player.y, 20, '#FF0000');
                        this.addParticles(this.player.x, this.player.y, 20, '#FFD700');
                        this.playSound('newHighScore');
                    }
                } else {
                    this.gameOver();
                }
            }
        }

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.velocity;
            popup.life--;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update();

            if (!coin.collected && checkCollision(this.player, coin)) {
                coin.collected = true;
                this.coins.splice(i, 1);
                this.score += 10;
                this.addScorePopup(coin.x, coin.y, 10);
                this.addParticles(coin.x + 10, coin.y + 12, 5, '#FFD700');
                this.updateScore();
                this.playSound('coin');

                if (this.score > this.highScore && !this.isNewHighScore) {
                    this.isNewHighScore = true;
                    this.playSound('newHighScore');
                }
            }
        }

        // Update question blocks
        this.questionBlocks.forEach(block => {
            block.update();

            // Check if player hits from below
            if (this.player.velY < 0 &&
                this.player.x + this.player.width > block.x &&
                this.player.x < block.x + block.width &&
                this.player.y < block.y + block.height &&
                this.player.y + this.player.height > block.y + block.height - 10) {

                const result = block.hit();
                if (result) {
                    if (result.type === 'coin') {
                        this.score += result.value;
                        this.addScorePopup(block.x + 16, block.y - 20, result.value);
                        this.updateScore();
                        this.playSound('coin');
                    } else if (result.type === 'mushroom') {
                        this.mushrooms.push(new Mushroom(block.x, block.y));
                        this.playSound('block'); // Different sound for item spawn?
                    }
                    this.triggerScreenShake(3);
                }
            }
        });

        // Update mushrooms
        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            const mushroom = this.mushrooms[i];
            mushroom.update(this.platforms, this.GROUND_Y, this.levelWidth);

            if (mushroom.collected) {
                this.mushrooms.splice(i, 1);
                continue;
            }

            // Check collision with player
            if (checkCollision(this.player, mushroom) && mushroom.active && !mushroom.spawning) {
                if (this.player.powerUp()) {
                    mushroom.collected = true;
                    this.score += 1000;
                    this.addScorePopup(mushroom.x, mushroom.y, 1000);
                    this.updateScore();
                    this.playSound('powerup'); // Need to add this sound
                }
            }
        }

        // Update screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.intensity *= 0.9;
            if (this.screenShake.intensity < 0.1) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }

        this.background.update();
    }

    draw() {
        this.ctx.save();

        // Apply screen shake offset
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);

        this.background.draw(this.ctx, this.height, this.camera);

        // Draw question blocks
        this.questionBlocks.forEach(block => block.draw(this.ctx, this.camera));

        // Draw coins
        this.coins.forEach(coin => coin.draw(this.ctx, this.camera));

        this.platforms.forEach(p => p.draw(this.ctx, this.camera));
        this.enemies.forEach(e => e.draw(this.ctx, this.camera));

        if (this.player) this.player.draw(this.ctx, this.camera);

        // Draw score popups
        this.scorePopups.forEach(popup => {
            const screenX = popup.x - this.camera.x;
            const alpha = popup.life / 60;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(`+${popup.value}`, screenX, popup.y);
            this.ctx.fillText(`+${popup.value}`, screenX, popup.y);
            this.ctx.restore();
        });

        // Draw mushrooms
        this.mushrooms.forEach(mushroom => {
            mushroom.draw(this.ctx, this.camera);
        });

        // Draw particles
        this.particles.forEach(p => {
            const screenX = p.x - this.camera.x;
            const alpha = p.life / 90;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw new high score indicator
        if (this.isNewHighScore && this.gameRunning) {
            this.ctx.save();
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
            this.ctx.globalAlpha = pulse;
            this.ctx.strokeText('🎉 新紀錄！', this.width / 2, 100);
            this.ctx.fillText('🎉 新紀錄！', this.width / 2, 100);
            this.ctx.restore();
        }

        this.ctx.restore(); // Restore from screen shake


    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = intensity;
    }

    gameLoop() {
        if (!this.gameRunning || this.isPaused) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    pause() {
        if (!this.gameRunning) return;
        this.isPaused = true;
        this.ui.pauseOverlay.style.display = 'flex';
        this.stopBGM();
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.ui.pauseOverlay.style.display = 'none';
        this.startBGM();
        this.gameLoop();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.isMuted ? 0 : 0.05;
        }
    }

    startBGM() {
        if (this.isMuted || !this.audioCtx) return;
        if (this.bgmOscillator) return; // Already playing

        // Simple looping melody
        this.bgmOscillator = this.audioCtx.createOscillator();
        this.bgmGain = this.audioCtx.createGain();

        this.bgmOscillator.type = 'square';
        this.bgmOscillator.frequency.value = 220;
        this.bgmGain.gain.value = 0.03;

        this.bgmOscillator.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);

        // Simple melody pattern
        const notes = [262, 294, 330, 349, 392, 349, 330, 294];
        let noteIndex = 0;

        const playNote = () => {
            if (!this.bgmOscillator || this.isPaused || !this.gameRunning) return;
            this.bgmOscillator.frequency.setValueAtTime(notes[noteIndex], this.audioCtx.currentTime);
            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNote, 300);
        };

        this.bgmOscillator.start();
        playNote();
    }

    stopBGM() {
        if (this.bgmOscillator) {
            this.bgmOscillator.stop();
            this.bgmOscillator.disconnect();
            this.bgmOscillator = null;
            this.bgmGain = null;
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.stopBGM();

        // Show game over overlay
        this.ui.gameOverOverlay.style.display = 'flex';
        this.ui.finalScore.textContent = `最終分數: ${this.score}`;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.ui.highScore.innerHTML = `🏆 <span style="color: #FFD700;">新紀錄!</span> ${this.highScore}`;
            this.saveHighScore();
            this.playSound('newHighScore');
        } else {
            this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        }

        this.playSound('gameOver');

        // Add any key restart listener
        // Use document to ensure we catch events bubbling up
        const addRestartListeners = () => {
            document.addEventListener('keydown', this.handleAnyKeyRestart);
            document.addEventListener('click', this.handleAnyKeyRestart);
            document.addEventListener('touchstart', this.handleAnyKeyRestart);
        };

        // Small delay to prevent accidental restarts, but ensure it runs
        setTimeout(addRestartListeners, 500);
    }

    restart() {
        // Remove restart listeners
        document.removeEventListener('keydown', this.handleAnyKeyRestart);
        document.removeEventListener('click', this.handleAnyKeyRestart);
        document.removeEventListener('touchstart', this.handleAnyKeyRestart);

        this.ui.gameOverOverlay.style.display = 'none';
        this.initGame();
        this.startBGM();
        this.gameLoop();
    }

    handleAnyKeyRestart(e) {
        if (!this.gameRunning) {
            // Prevent default behavior for some keys if needed, but generally let it pass
            this.restart();
        }
    }

    updateScore() {
        this.ui.score.textContent = `⭐ ${this.score}`;

        // Animate score update
        this.ui.score.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.ui.score.style.transform = 'scale(1)';
        }, 100);
    }
    generateChunk(startX, endX) {
        const newPlatforms = generatePlatforms(startX, endX, this.height, this.images.tiles);
        this.platforms.push(...newPlatforms);

        const newEnemies = createEnemies(startX, endX, this.height, this.images.enemy);
        this.enemies.push(...newEnemies);

        const newCoins = generateCoins(startX, endX, newPlatforms); // Pass only new platforms for optimization? Or all? 
        // generateCoins currently iterates all platforms passed. Passing only new ones is safer for performance 
        // but might miss coins bridging chunks. For now, passing newPlatforms is good.
        this.coins.push(...newCoins);

        const newBlocks = generateQuestionBlocks(startX, endX, this.GROUND_Y);
        this.questionBlocks.push(...newBlocks);

        const newPipes = generatePipes(startX, endX, this.GROUND_Y);
        this.pipes.push(...newPipes);

        this.lastGeneratedX = endX;
        this.levelWidth = endX; // Keep levelWidth updated for boundary checks if any remain
    }

    cleanupObjects(minX) {
        this.platforms = this.platforms.filter(p => p.x + p.width > minX);
        this.enemies = this.enemies.filter(e => e.x + e.width > minX);
        this.coins = this.coins.filter(c => c.x + c.width > minX);
        this.questionBlocks = this.questionBlocks.filter(b => b.x + b.width > minX);
        this.pipes = this.pipes.filter(p => p.x + p.width > minX);
        this.mushrooms = this.mushrooms.filter(m => m.x + m.width > minX);
        this.particles = this.particles.filter(p => p.x > minX);
        this.scorePopups = this.scorePopups.filter(p => p.x > minX);
    }
}

export async function preloadImages() {
    console.log('Starting to preload images...');
    const imagePaths = {
        player: 'assets/player.png',
        enemy: 'assets/enemy.png',
        tiles: 'assets/tiles.png'
    };

    const promises = Object.entries(imagePaths).map(([key, src]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                console.log(`Loaded image: ${key}`);
                resolve([key, img]);
            };
            img.onerror = (e) => {
                console.error(`Failed to load image: ${key}`, e);
                resolve([key, null]);
            };
        });
    });

    const images = {};
    try {
        const results = await Promise.all(promises);
        results.forEach(([key, img]) => {
            if (img) {
                images[key] = img;
            }
        });
        console.log('All images preloaded.');
        return images;
    } catch (error) {
        console.error('Error preloading images:', error);
        return images;
    }
}
