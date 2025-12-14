import { Player } from './Player.js?v=1.6.22';
import { Background, Biomes } from './Background.js?v=1.6.22';
import { InputHandler } from './InputHandler.js?v=1.6.22';
import { checkCollision } from './utils.js?v=1.6.22';
import { LevelGenerator } from './LevelGenerator.js?v=1.7.5';
import { CollisionSystem } from './CollisionSystem.js?v=1.7.6';
import { EnemyManager } from './EnemyManager.js?v=1.7.7';
import { Coin } from './Coin.js?v=1.6.22';
import { QuestionBlock } from './QuestionBlock.js?v=1.6.22';
import { Mushroom } from './Mushroom.js?v=1.6.22';
import { Star } from './Star.js?v=1.6.22';
import { FireFlower } from './FireFlower.js?v=1.6.22';
import { Fireball } from './Fireball.js?v=1.6.22';
import { Pipe } from './Pipe.js?v=1.6.22';
import { Lava } from './Lava.js?v=1.6.22';
import { EnhancedAudioSystem } from './AudioSystem.js?v=1.6.22';
import { ParticleSystem } from './ParticleSystem.js?v=1.8.0';
import { ObjectPool } from './ObjectPool.js?v=1.8.0';

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
        this.ctx.scale(this.dpr, this.dpr);
        this.GROUND_Y = this.height - 50;

        this.lastGeneratedX = 0;
        this.CHUNK_SIZE = 1000;
        this.renderDistance = 2000;
        this.cleanupMargin = 2000;
        this.lastCleanedX = 0;

        this.camera = { x: 0, y: 0 };

        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameRunning = false;
        this.isNewHighScore = false;
        this.isGameOverSequence = false;
        this.isPaused = false;
        this.isMuted = localStorage.getItem('marioMuted') === 'true';

        // Score popup system
        this.scorePopups = [];
        this.scorePopupPool = []; // Existing simple array pool, could upgrade later

        // Object Pools
        this.coinPool = new ObjectPool(
            () => new Coin(0, 0),
            (c, x, y) => c.reset(x, y)
        );

        this.fireballPool = new ObjectPool(
            () => new Fireball(0, 0, 1),
            (f, x, y, direction) => f.reset(x, y, direction)
        );

        // Celebration particles
        // Celebration particles
        this.particleSystem = new ParticleSystem();

        // Screen shake
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Freeze frame (Hit stop)
        this.freezeFrames = 0;

        // Death Flash
        this.deathFlashTimer = 0;

        // Audio
        this.audioSystem = new EnhancedAudioSystem();
        this.currentBGMMode = null;

        this.input = new InputHandler(() => this.onJump());
        this.input.attachCanvas(canvas);
        this.input.attachControls(uiElements.leftBtn, uiElements.rightBtn, uiElements.jumpBtn);

        this.background = new Background(this.width, this.GROUND_Y);
        this.levelGenerator = new LevelGenerator();
        this.collisionSystem = new CollisionSystem(this);
        this.enemyManager = new EnemyManager();

        // Biome Management
        this.currentBiome = 'PLAINS';
        this.biomeDistance = 0;
        this.BIOME_LENGTH = 3000; // Change biome every 3000px

        // Biome Management
        this.currentBiome = 'PLAINS';
        this.biomeDistance = 0;
        this.BIOME_LENGTH = 3000; // Change biome every 3000px

        this.player = null;
        this.platforms = [];
        // this.enemies is now managed by EnemyManager, accessed via getter
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
        this.startBGM();
    }

    get enemies() {
        return this.enemyManager.enemies;
    }

    start() {
        if (this.gameRunning) return;
        this.gameRunning = true;
        this.isGameOverSequence = false;
        this.isNewHighScore = false;
        this.isPaused = false;
        this.score = 0;
        this.ui.score.textContent = `⭐ 0`;
        this.ui.gameOverOverlay.style.display = 'none';
        this.ui.pauseOverlay.style.display = 'none';

        const isNight = cycle >= 3500;

        if (isSpooky || isNight) {
            this.ctx.save();
            // Create dark overlay
            this.ctx.fillStyle = isSpooky ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Cut out holes for lights
            this.ctx.globalCompositeOperation = 'destination-out';

            // Player light (larger if Star or FireFlower)
            let playerRadius = 100;
            if (this.player.isInvincible) playerRadius = 200;
            if (this.player.hasFireFlower) playerRadius = 150;

            this.drawLightGradient(this.player.x - this.camera.x + this.player.width / 2,
                this.player.y - this.camera.y + this.player.height / 2,
                playerRadius);

            // Fireballs light
            this.fireballs.forEach(f => {
                this.drawLightGradient(f.x - this.camera.x + f.width / 2, f.y - this.camera.y + f.height / 2, 80);
            });

            // Lava light
            this.lava.forEach(l => {
                // Draw multiple lights along the lava
                for (let x = l.x; x < l.x + l.width; x += 50) {
                    if (x + 50 > this.camera.x && x < this.camera.x + this.width) {
                        this.drawLightGradient(x - this.camera.x + 25, l.y - this.camera.y, 100);
                    }
                }
            });

            // Star powerup light
            this.stars.forEach(s => {
                this.drawLightGradient(s.x - this.camera.x + s.width / 2, s.y - this.camera.y + s.height / 2, 120);
            });

            // FireFlower powerup light
            this.fireflowers.forEach(f => {
                this.drawLightGradient(f.x - this.camera.x + f.width / 2, f.y - this.camera.y + f.height / 2, 120);
            });

            this.ctx.restore();
        }
    }

    drawLightGradient(x, y, radius) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    triggerFreeze(frames) {
        this.freezeFrames = frames;
    }

    // ... rest of the methods (generateChunk, cleanupChunk, etc.) need to be preserved or updated if they rely on biome
    // Since I'm replacing the whole file content in this tool, I need to make sure I include the rest of the file.
    // Wait, I should use replace_file_content with range if possible, but the file is large and I'm changing the constructor, update, and draw.
    // Let's check the rest of the file first to ensure I don't delete important methods.

    // Actually, I'll use the previous view_file output to reconstruct the file, but I only saw the first 100 lines.
    // I need to read the rest of Game.js before I can safely replace it.
    // ABORTING REPLACE to read the file first.


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

    triggerDeathEffect() {
        this.triggerScreenShake(20); // Strong shake
        this.triggerFreeze(45); // Long freeze (~0.75s)
        this.deathFlashTimer = 10; // Flash for 10 frames
        this.playSound('death');
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
        if (this.audioSystem) {
            this.audioSystem.initAudio();
        }
    }

    // ...


    playSound(type) {
        if (this.audioSystem) {
            this.audioSystem.playSound(type);
        }
    }

    startBGM() {
        if (this.audioSystem) {
            // Use current biome for BGM, fallback to PLAINS
            const bgmMode = this.currentBiome || 'PLAINS';

            if (this.currentBGMMode !== bgmMode) {
                this.audioSystem.startBGM(bgmMode);
                this.currentBGMMode = bgmMode;
            } else {
                // Force restart if it's the first run or if audio context was suspended
                this.audioSystem.startBGM(bgmMode);
            }
        }
    }

    toggleMute() {
        if (this.audioSystem) {
            this.isMuted = this.audioSystem.toggleMute();
            return this.isMuted;
        }
        return false;
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
        this.player = new Player(this, 50, this.GROUND_Y, this.images.player);
        this.player.setGroundY(this.GROUND_Y);

        this.platforms = [];
        this.enemyManager.reset();

        // Reset Coins
        if (this.coins) this.coins.forEach(c => this.coinPool.release(c));
        this.coins = [];

        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];

        // Reset Fireballs
        if (this.fireballs) this.fireballs.forEach(f => this.fireballPool.release(f));
        this.fireballs = [];

        this.pipes = [];
        this.lava = [];

        // Randomize Starting Biome
        const biomeKeys = Object.keys(Biomes);
        this.currentBiome = biomeKeys[Math.floor(Math.random() * biomeKeys.length)];
        this.background.setBiome(this.currentBiome);
        this.biomeDistance = 0; // Reset distance for next transition

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
        this.particleSystem.activeParticles = []; // Or add a reset method to ParticleSystem
        this.updateScore();

        this.ui.pauseOverlay.style.display = 'none';
        this.background.setTiles(this.images.tiles);

        // Initial invincibility (3 seconds)
        this.player.invincible = true;
        this.player.invincibleTime = 180;

        // Auto-fireball timer
        this.autoFireTimer = 0;
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

        const x = this.player.direction === 1 ? this.player.x + this.player.width : this.player.x;
        const y = this.player.y + 10;

        const fireball = this.fireballPool.get(x, y, this.player.direction);
        this.fireballs.push(fireball);

        this.playSound('fireball');
    }



    update() {
        if (!this.gameRunning || !this.player) return;

        // Freeze frame logic
        if (this.freezeFrames > 0) {
            this.freezeFrames--;
            return;
        }

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

        // BGM Logic for Star Power
        if (this.player.starPower) {
            if (this.currentBGMMode !== 'star') {
                this.audioSystem.startBGM('star');
                this.currentBGMMode = 'star';
            }
        } else {
            // If we were in star mode and now we are not, revert to biome music
            if (this.currentBGMMode === 'star') {
                const biomeMode = this.currentBiome || 'PLAINS';
                this.audioSystem.startBGM(biomeMode);
                this.currentBGMMode = biomeMode;
            }
        }

        this.player.update(this.input, this.platforms, this.levelWidth, this.camera);

        // Dust particles when running
        if (this.player.grounded && Math.abs(this.player.velX) > 0.5) {
            this.createDustParticle(this.player.x + this.player.width / 2, this.player.y + this.player.height);
        }

        // Camera logic - update BEFORE player so mouse position calculation is accurate
        let targetCamX = this.player.x - this.width / 2 + this.player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        // Infinite scrolling: no max limit
        this.camera.x = targetCamX;

        // Update enemies
        this.enemyManager.update(this.camera.x + this.width + 1000);

        // Update question blocks
        this.questionBlocks.forEach(block => {
            block.update();
        });

        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.velocity;
            popup.life--;
            if (popup.life <= 0) {
                // this.scorePopupPool.push(popup); // Return to pool if implemented
                this.scorePopups.splice(i, 1);
            }
        }

        // Update particles
        this.updateParticles();

        // Update Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.fireballs[i];
            fireball.update(this.platforms, this.GROUND_Y);

            if (!fireball.active) {
                this.fireballPool.release(fireball);
                this.fireballs.splice(i, 1);
                continue;
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update();
        }

        // Update mushrooms
        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            const mushroom = this.mushrooms[i];
            mushroom.update(this.platforms, this.GROUND_Y, this.levelWidth);

            if (mushroom.collected) {
                this.mushrooms.splice(i, 1);
                continue;
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
        }

        // Update FireFlowers
        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            const flower = this.fireflowers[i];
            flower.update(this.platforms, this.GROUND_Y, this.levelWidth);

            if (flower.collected) {
                this.fireflowers.splice(i, 1);
                continue;
            }
        }

        // Update Pipes (Piranha Plants)
        this.pipes.forEach(pipe => {
            try {
                pipe.update();
            } catch (e) {
                console.error('Error updating pipe:', e);
            }
        });

        // Update Lava
        this.lava.forEach(lava => {
            lava.update();
        });

        // Handle Collisions
        this.collisionSystem.update();

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
        this.particleSystem.draw(this.ctx, this.camera);

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

    cleanupObjects(minX) {
        // Cleanup Platforms
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            if (this.platforms[i].x + this.platforms[i].width < minX) {
                this.platforms.splice(i, 1);
            }
        }

        // Cleanup Enemies
        this.enemyManager.cleanup(minX);

        // Cleanup Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.x + c.width <= minX) {
                this.coinPool.release(c);
                this.coins.splice(i, 1);
            }
        }

        // Cleanup Question Blocks
        for (let i = this.questionBlocks.length - 1; i >= 0; i--) {
            if (this.questionBlocks[i].x + this.questionBlocks[i].width < minX) {
                this.questionBlocks.splice(i, 1);
            }
        }

        // Cleanup Mushrooms
        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            if (this.mushrooms[i].x + this.mushrooms[i].width < minX) {
                this.mushrooms.splice(i, 1);
            }
        }

        // Cleanup Stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            if (this.stars[i].x + this.stars[i].width < minX) {
                this.stars.splice(i, 1);
            }
        }

        // Cleanup FireFlowers
        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            if (this.fireflowers[i].x + this.fireflowers[i].width < minX) {
                this.fireflowers.splice(i, 1);
            }
        }

        // Cleanup Pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            if (this.pipes[i].x + this.pipes[i].width < minX) {
                this.pipes.splice(i, 1);
            }
        }

        // Cleanup Lava
        for (let i = this.lava.length - 1; i >= 0; i--) {
            if (this.lava[i].x + this.lava[i].width < minX) {
                this.lava.splice(i, 1);
            }
        }

        // Cleanup Fireballs (off-screen or inactive)
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const f = this.fireballs[i];
            if (f.x + f.width <= minX || !f.active) {
                this.fireballPool.release(f);
                this.fireballs.splice(i, 1);
            }
        }
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

    stopBGM() {
        if (this.audioSystem) {
            this.audioSystem.stopBGM();
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

    addParticles(x, y, count, color, type = 'normal') {
        this.particleSystem.emit(x, y, count, color, type);
    }

    createDustParticle(x, y) {
        this.particleSystem.createDust(x, y);
    }

    updateParticles() {
        this.particleSystem.update();
    }

    updateScore() {
        this.ui.score.textContent = `⭐ ${this.score}`;

        // Animate score update
        this.ui.score.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.ui.score.style.transform = 'scale(1)';
        }, 100);
    }
    getDifficultyMultiplier() {
        // Base difficulty is 1.0
        // Increases by 0.1 every 500 points
        // Cap at 2.5x speed/density
        const multiplier = 1 + (this.score / 500) * 0.1;
        return Math.min(2.5, multiplier);
    }

    generateChunk(startX, endX) {
        const difficulty = this.getDifficultyMultiplier();
        const context = {
            height: this.height,
            groundY: this.GROUND_Y,
            images: this.images,
            difficulty: difficulty
        };

        const generated = this.levelGenerator.generateChunk(startX, endX, context);

        this.platforms.push(...generated.platforms);
        this.enemyManager.addEnemies(generated.enemies);

        // Instantiate coins from pool
        generated.coins.forEach(data => {
            const coin = this.coinPool.get(data.x, data.y);
            this.coins.push(coin);
        });

        this.questionBlocks.push(...generated.questionBlocks);
        this.pipes.push(...generated.pipes);

        this.lastGeneratedX = endX;
        this.levelWidth = endX; // Keep levelWidth updated for boundary checks if any remain
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
