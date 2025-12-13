import { Player } from './Player.js?v=1.5.13';
import { Background } from './Background.js?v=1.5.13';
import { InputHandler } from './InputHandler.js?v=1.5.13';
import { generatePlatforms } from './Platform.js?v=1.5.13';
import { createEnemies } from './Enemy.js?v=1.5.13';
import { checkCollision } from './utils.js?v=1.5.13';
import { Coin, generateCoins } from './Coin.js?v=1.5.13';
import { QuestionBlock, generateQuestionBlocks } from './QuestionBlock.js?v=1.5.13';
import { Mushroom } from './Mushroom.js?v=1.5.13';
import { Star } from './Star.js?v=1.5.13';
import { FireFlower } from './FireFlower.js?v=1.5.13';
import { Fireball } from './Fireball.js?v=1.5.13';
import { Pipe, generatePipes } from './Pipe.js?v=1.5.13';
import { Lava } from './Lava.js?v=1.5.13';

export class Game {
    constructor(canvas, uiElements, images) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiElements;
        this.images = images;

        this.width = 800; // Logical width
        this.height = 400; // Logical height

        // High DPI Support
        this.dpr = window.devicePixelRatio || 1;
        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;
        // Removed inline styles to allow CSS aspect-ratio to work
        // Removed inline styles to allow CSS aspect-ratio to work
        this.ctx.scale(this.dpr, this.dpr);
        // this.levelWidth = 4000; // No longer used for bounds
        this.GROUND_Y = this.height - 50;

        this.lastGeneratedX = 0;
        this.CHUNK_SIZE = 1000; // Smaller chunks for smoother generation
        this.renderDistance = 2000;
        this.cleanupMargin = 2000; // Distance behind camera to cleanup
        this.lastCleanedX = 0;

        this.camera = { x: 0, y: 0 };

        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.isNewHighScore = false;
        this.gameRunning = false;
        this.isGameOverSequence = false;
        this.isNewHighScore = false;
        this.isPaused = false;
        this.isPaused = false;
        this.isMuted = localStorage.getItem('marioMuted') === 'true';

        // Score popup system
        this.scorePopups = [];
        this.scorePopupPool = []; // Object pool

        // Celebration particles
        this.particles = [];
        this.particlePool = []; // Object pool

        // Screen shake
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Audio
        this.audioCtx = null;
        this.bgmOscillator = null;
        this.bgmGain = null;

        this.input = new InputHandler(() => this.onJump());
        this.input.attachCanvas(canvas);
        this.input.attachControls(uiElements.leftBtn, uiElements.rightBtn, uiElements.jumpBtn);

        this.background = new Background(this.width, this.GROUND_Y);

        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        this.fireballs = [];
        this.pipes = [];
        this.lava = [];

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
        let popup;
        if (this.scorePopupPool.length > 0) {
            popup = this.scorePopupPool.pop();
            popup.x = x;
            popup.y = y;
            popup.value = value;
            popup.life = 60;
            popup.velocity = -2;
        } else {
            popup = {
                x: x,
                y: y,
                value: value,
                life: 60, // frames
                velocity: -2
            };
        }
        this.scorePopups.push(popup);
    }

    addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            let p;
            if (this.particlePool.length > 0) {
                p = this.particlePool.pop();
                p.x = x;
                p.y = y;
                p.vx = (Math.random() - 0.5) * 8;
                p.vy = (Math.random() - 0.5) * 8 - 3;
                p.life = 60 + Math.random() * 30;
                p.color = color;
                p.size = 3 + Math.random() * 4;
            } else {
                p = {
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8 - 3,
                    life: 60 + Math.random() * 30,
                    color: color,
                    size: 3 + Math.random() * 4
                };
            }
            this.particles.push(p);
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
            case 'fireball':
                // Fireball shoot sound
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.1);
                break;
            case 'powerup':
                // Powerup collect sound
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);
                oscillator.frequency.linearRampToValueAtTime(1200, this.audioCtx.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.3);
                break;
            case 'death':
                // Classic death sound (approximate)
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(300, this.audioCtx.currentTime + 0.1);
                oscillator.frequency.linearRampToValueAtTime(200, this.audioCtx.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.4);
                break;
        }

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
    start() {
        this.initAudio();
        this.initGame();
        this.startBGM();

        // Bind F key for shooting
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyF') {
                this.shootFireball();
            }
        });

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
        this.stars = [];
        this.fireflowers = [];
        this.fireballs = [];
        this.pipes = [];
        this.lava = [];

        this.lastGeneratedX = 0;
        this.generateChunk(0, this.CHUNK_SIZE * 2); // Generate initial buffer

        // FPS Control
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        this.lastTime = 0;

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

        // Initial invincibility (3 seconds)
        this.player.invincible = true;
        this.player.invincibleTime = 180;

        // Auto-fireball timer
        this.autoFireTimer = 0;
    }

    generateChunk(startX, endX) {
        // Generate platforms
        const newPlatforms = generatePlatforms(startX, endX, this.GROUND_Y);
        this.platforms.push(...newPlatforms);

        // Generate enemies
        const newEnemies = createEnemies(startX, endX, this.platforms, this.GROUND_Y);
        this.enemies.push(...newEnemies);

        // Generate coins
        const newCoins = generateCoins(startX, endX, this.platforms);
        this.coins.push(...newCoins);

        // Generate question blocks
        const newBlocks = generateQuestionBlocks(startX, endX, this.platforms, this.GROUND_Y);
        this.questionBlocks.push(...newBlocks);

        // Generate pipes
        const newPipes = generatePipes(startX, endX, this.platforms, this.GROUND_Y);
        this.pipes.push(...newPipes);

        // Generate Lava (Dangerous Areas)
        // 30% chance per chunk to have a lava pool
        if (Math.random() < 0.3) {
            const lavaWidth = 100 + Math.random() * 150;
            const lavaX = startX + Math.random() * (this.CHUNK_SIZE - lavaWidth);

            // Safe zone check: Don't spawn lava in the first 800 pixels
            if (lavaX > 800) {
                this.lava.push(new Lava(lavaX, this.GROUND_Y, lavaWidth, 40));
            }
        }

        this.lastGeneratedX = endX;
    }

    // ...

    gameLoop(timestamp = 0) {
        if (!this.gameRunning || this.isPaused) return;

        // Calculate elapsed time
        const deltaTime = timestamp - this.lastTime;

        if (deltaTime >= this.fpsInterval) {
            // Adjust for refresh rates that aren't multiples of 60
            this.lastTime = timestamp - (deltaTime % this.fpsInterval);

            try {
                this.update();
                this.draw();
            } catch (e) {
                console.error('Error in game loop:', e);
                this.gameRunning = false;
            }
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    onJump() {
        this.initAudio();
        if (!this.gameRunning) return;
        if (this.player && this.player.jump()) {
            this.playSound('jump');
        }
    }

    shootFireball() {
        if (!this.gameRunning || !this.player || !this.player.firePower) return;

        // Limit fireballs on screen
        if (this.fireballs.length >= 2) return;

        const x = this.player.direction === 1 ? this.player.x + this.player.width : this.player.x - 16;
        const y = this.player.y + 20;
        this.fireballs.push(new Fireball(x, y, this.player.direction));
        this.playSound('fireball'); // Need to add sound
    }

    update() {
        if (!this.gameRunning || !this.player) return;

        // Auto-fireball for mobile/ease of use
        if (this.player.firePower) {
            this.autoFireTimer++;
            if (this.autoFireTimer > 45) { // Fire every ~0.75 seconds
                this.shootFireball();
                this.autoFireTimer = 0;
            }
        } else {
            this.autoFireTimer = 0;
        }

        // Check for death animation completion
        if (this.player.isDead) {
            this.player.update(this.input, this.platforms, this.width, this.camera);
            if (this.player.y > this.height + 100) {
                this.showGameOverScreen();
            }
            return; // Stop other game updates
        }

        this.player.update(this.input, this.platforms, this.levelWidth, this.camera);

        // Camera logic - update BEFORE player so mouse position calculation is accurate
        let targetCamX = this.player.x - this.width / 2 + this.player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        // Infinite scrolling: no max limit
        this.camera.x = targetCamX;

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.camera.x + this.width + 1000); // Active area

            if (checkCollision(this.player, enemy)) {
                // Relaxed stomp check: falling and player bottom is above enemy's bottom 20%
                if (this.player.velY > 0 && this.player.y + this.player.height < enemy.y + enemy.height * 0.8) {
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
                    // Handle player hit
                    const result = this.player.hit();

                    if (result === 'kill') {
                        // Star power instant kill
                        this.addScorePopup(enemy.x, enemy.y, 100);
                        this.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                        this.enemies.splice(i, 1);
                        this.score += 100;
                        this.updateScore();
                        this.playSound('stomp'); // Use stomp sound for now

                        // Check for new high score during game
                        if (this.score > this.highScore && !this.isNewHighScore) {
                            this.isNewHighScore = true;
                            this.addParticles(this.player.x, this.player.y, 20, '#FF0000');
                            this.addParticles(this.player.x, this.player.y, 20, '#FFD700');
                            this.playSound('newHighScore');
                        }
                    } else if (result === 'dead') {
                        this.gameOver();
                    } else if (result === 'shrink') {
                        this.triggerScreenShake(5);
                        this.playSound('block');
                    }
                    // If 'invincible', do nothing (ignore collision)
                }
            }
        }

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.velocity;
            popup.life--;
            if (popup.life <= 0) {
                this.scorePopupPool.push(popup); // Return to pool
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
                this.particlePool.push(p); // Return to pool
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
                        const mushroom = new Mushroom(block.x, block.y);
                        mushroom.spawn();
                        this.mushrooms.push(mushroom);
                        this.playSound('block');
                    } else if (result.type === 'star') {
                        const star = new Star(block.x, block.y);
                        star.spawn();
                        this.stars.push(star);
                        this.playSound('block');
                    } else if (result.type === 'fireflower') {
                        const flower = new FireFlower(block.x, block.y);
                        flower.spawn();
                        this.fireflowers.push(flower);
                        this.playSound('block');
                    }
                    this.triggerScreenShake(3);
                }
            }
        });

        // Update Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.fireballs[i];
            fireball.update(this.platforms, this.GROUND_Y);

            if (!fireball.active) {
                this.fireballs.splice(i, 1);
                continue;
            }

            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (checkCollision(fireball, enemy)) {
                    // Kill enemy
                    this.addScorePopup(enemy.x, enemy.y, 100);
                    this.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    this.enemies.splice(j, 1);
                    this.score += 100;
                    this.updateScore();
                    this.playSound('stomp'); // Or kick sound

                    // Destroy fireball
                    fireball.active = false;
                    this.addParticles(fireball.x, fireball.y, 4, '#FF4500');
                    break; // One fireball kills one enemy
                }
            }
        }

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
                    // Powered up!
                    this.playSound('powerup');
                } else {
                    // Already big, just add points
                    this.playSound('coin'); // Or powerup sound
                }
                mushroom.collected = true;
                this.score += 1000;
                this.addScorePopup(mushroom.x, mushroom.y, 1000);
                this.updateScore();
            }
        }

        // Update Stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.update(this.platforms, this.GROUND_Y, this.levelWidth);

            if (star.collected) {
                this.stars.splice(i, 1);
                continue;
            }

            if (checkCollision(this.player, star) && star.active && !star.spawning) {
                star.collected = true;
                this.score += 1000;
                this.addScorePopup(star.x, star.y, 1000);
                this.updateScore();
                this.playSound('powerup');

                // Always refresh star power
                if (this.player.getStarPower) this.player.getStarPower();
            }
        }

        // Update FireFlowers
        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            const flower = this.fireflowers[i];
            flower.update(this.platforms, this.GROUND_Y, this.levelWidth);

            if (flower.collected) {
                this.fireflowers.splice(i, 1);
                continue;
            }

            if (checkCollision(this.player, flower) && flower.active && !flower.spawning) {
                flower.collected = true;
                this.score += 1000;
                this.addScorePopup(flower.x, flower.y, 1000);
                this.updateScore();
                this.playSound('powerup');
                if (this.player.getFirePower) this.player.getFirePower();
            }
        }

        // Update Pipes (Piranha Plants)
        this.pipes.forEach(pipe => {
            try {
                pipe.update();
            } catch (e) {
                console.error('Error updating pipe:', e);
            }

            // Check collision with Piranha Plant
            // Check collision with Piranha Plant
            const hitbox = pipe.getPiranhaHitbox();
            if (hitbox && checkCollision(this.player, hitbox)) {
                // Check for stomp (falling and above the plant)
                if (this.player.velY > 0 && this.player.y + this.player.height < hitbox.y + hitbox.height / 2) {
                    // Stomp success
                    pipe.killPiranha();
                    this.player.velY = -12; // Bounce
                    this.score += 200;
                    this.addScorePopup(hitbox.x, hitbox.y, 200);
                    this.addParticles(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, 8, '#228B22'); // Green particles
                    this.updateScore();
                    this.playSound('stomp');
                } else {
                    const result = this.player.hit();
                    if (result === 'dead') {
                        this.gameOver();
                    } else if (result === 'shrink') {
                        this.triggerScreenShake(5);
                        this.playSound('block'); // Damage sound
                    } else if (result === 'kill') {
                        // Star power kills piranha plant
                        pipe.killPiranha();
                        this.score += 200;
                        this.addScorePopup(hitbox.x, hitbox.y, 200);
                        this.updateScore();
                        this.playSound('stomp');
                    }
                }
            }
        });

        // Update Lava
        this.lava.forEach(lava => {
            lava.update();
            if (checkCollision(this.player, lava)) {
                // Instant death
                if (!this.player.isDead) { // Check if already dead to avoid loop
                    this.playSound('death');
                    this.player.die();
                    this.gameOver();
                }
            }
        });

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

        // Dynamic Chunk Generation
        if (this.camera.x + this.width + this.renderDistance > this.lastGeneratedX) {
            const nextChunkEnd = this.lastGeneratedX + this.CHUNK_SIZE;
            this.generateChunk(this.lastGeneratedX, nextChunkEnd);
        }

        // Object Cleanup
        if (this.camera.x - this.cleanupMargin > this.lastCleanedX) {
            this.cleanupObjects(this.camera.x - this.cleanupMargin);
            this.lastCleanedX = this.camera.x - this.cleanupMargin;
        }

        this.background.update(this.score);
    }

    draw() {
        this.ctx.save();

        // Apply screen shake offset
        this.ctx.translate(this.screenShake.x, this.screenShake.y);

        this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);

        this.background.draw(this.ctx, this.height, this.camera);

        // Draw question blocks
        this.questionBlocks.forEach(block => block.draw(this.ctx, this.camera));

        // Draw pipes
        this.pipes.forEach(pipe => {
            try {
                pipe.draw(this.ctx, this.camera);
            } catch (e) {
                console.error('Error drawing pipe:', e);
            }
        });

        // Draw Lava
        this.lava.forEach(lava => lava.draw(this.ctx, this.camera));

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
        this.stars.forEach(star => star.draw(this.ctx, this.camera));
        this.fireflowers.forEach(flower => flower.draw(this.ctx, this.camera));
        this.fireballs.forEach(fb => fb.draw(this.ctx, this.camera));

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

        try {
            this.update();
            this.draw();
        } catch (e) {
            console.error('Error in game loop:', e);
            this.gameRunning = false;
        }

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
        localStorage.setItem('marioMuted', this.isMuted);
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.isMuted ? 0 : 0.05;
        }
        if (this.isMuted) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
    }

    startBGM() {
        if (this.isMuted || !this.audioCtx) return;
        if (this.bgmOscillator) return; // Already playing

        // Simple looping melody
        this.bgmOscillator = this.audioCtx.createOscillator();
        this.bgmGain = this.audioCtx.createGain();

        this.bgmOscillator.type = 'square';

        // Determine frequency and tempo based on state
        let isStarPower = this.player && this.player.starPower;

        this.bgmGain.gain.value = 0.03;

        this.bgmOscillator.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);

        // Simple melody pattern
        const notes = [262, 294, 330, 349, 392, 349, 330, 294];
        let noteIndex = 0;

        const playNote = () => {
            if (!this.bgmOscillator || this.isPaused || !this.gameRunning) return;

            // Check if state changed (e.g. star power ended or started)
            // We can't easily restart here without recursion issues or complex state management
            // So we'll just adjust on the fly if possible, or check if we need to restart

            if (this.player) {
                const currentStarPower = this.player.starPower;
                if (currentStarPower !== isStarPower) {
                    // State changed, restart BGM to pick up new settings
                    this.stopBGM();
                    this.startBGM();
                    return;
                }
            }

            // Calculate tempo based on difficulty and star power
            let tempoMultiplier = this.getDifficultyMultiplier();
            let pitchMultiplier = 1;

            if (isStarPower) {
                tempoMultiplier *= 1.5; // 50% faster
                pitchMultiplier = 1.5; // Higher pitch
            }

            // Base note duration is 300ms
            const noteDuration = 300 / tempoMultiplier;

            const note = notes[noteIndex] * pitchMultiplier;
            this.bgmOscillator.frequency.setValueAtTime(note, this.audioCtx.currentTime);

            noteIndex = (noteIndex + 1) % notes.length;

            setTimeout(playNote, noteDuration);
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



    // ... (skipping to gameOver method)

    gameOver() {
        if (!this.gameRunning) return;

        // Trigger death animation
        this.player.die();
        this.stopBGM();
        this.playSound('death');

        // We don't set gameRunning = false yet, we wait for the animation
        // But we want to stop scrolling and enemy updates.
        // Actually, setting gameRunning = false stops the loop in gameLoop().
        // So we need to keep gameRunning = true but have a special state or check in update().

        // Let's use a flag isGameOverSequence
        this.isGameOverSequence = true;
    }

    showGameOverScreen() {
        this.gameRunning = false;
        this.isGameOverSequence = false;
        this.stopBGM();

        // Show game over overlay
        this.ui.gameOverOverlay.style.display = 'flex';
        this.ui.finalScore.textContent = `最終分數: ${this.score}`;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.ui.highScore.innerHTML = `🏆 <span style="color: #FFD700;">新紀錄!</span> ${this.highScore}`;
            this.ui.finalHighScore.innerHTML = `🏆 <span style="color: #FFD700; text-shadow: 0 0 10px #FFD700;">新最高分!</span> ${this.highScore}`;
            this.ui.finalHighScore.style.transform = 'scale(1.2)';
            this.saveHighScore();
            this.playSound('newHighScore');
        } else {
            this.ui.highScore.textContent = `🏆 ${this.highScore}`;
            this.ui.finalHighScore.textContent = `最高紀錄: ${this.highScore}`;
            this.ui.finalHighScore.style.transform = 'scale(1)';
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

        const difficulty = this.getDifficultyMultiplier();
        const newEnemies = createEnemies(startX, endX, this.height, this.images.enemy, difficulty);
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
        this.stars = this.stars.filter(s => s.x + s.width > minX);
        this.fireflowers = this.fireflowers.filter(f => f.x + f.width > minX);
        this.fireballs = this.fireballs.filter(f => f.x + f.width > minX);
        this.particles = this.particles.filter(p => p.x > minX);
        this.scorePopups = this.scorePopups.filter(p => p.x > minX);
    }
    getDifficultyMultiplier() {
        // Base difficulty is 1.0
        // Increases by 0.1 every 500 points
        // Cap at 2.5x speed/density
        const multiplier = 1 + (this.score / 500) * 0.1;
        return Math.min(2.5, multiplier);
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
