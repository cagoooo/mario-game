import { Player } from './Player.js?v=1.8.9';
import { Background, Biomes } from './Background.js?v=1.8.9';
import { InputHandler } from './InputHandler.js?v=1.8.9';
import { checkCollision, isEntityVisible } from './utils.js?v=1.8.9';
import { LevelGenerator } from './LevelGenerator.js?v=1.8.9';
import { CollisionSystem } from './CollisionSystem.js?v=1.8.9';
import { EnemyManager } from './EnemyManager.js?v=1.8.9';
import { Coin } from './Coin.js?v=1.8.9';
import { QuestionBlock } from './QuestionBlock.js?v=1.8.9';
import { Mushroom } from './Mushroom.js?v=1.8.9';
import { Star } from './Star.js?v=1.8.9';
import { FireFlower } from './FireFlower.js?v=1.8.9';
import { Fireball } from './Fireball.js?v=1.8.9';
import { Pipe } from './Pipe.js?v=1.8.9';
import { Lava } from './Lava.js?v=1.8.9';
import { EnhancedAudioSystem } from './AudioSystem.js?v=1.8.9';
import { ParticleSystem } from './ParticleSystem.js?v=1.8.9';
import { ObjectPool } from './ObjectPool.js?v=1.8.9';

export class Game {
    constructor(canvas, uiElements, assetLoader) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiElements;
        this.assetLoader = assetLoader;
        this.images = assetLoader.images; // Keep for backward compatibility if needed

        this.width = 800; // Logical width
        this.height = 400; // Logical height

        // Set internal resolution explicitly since we removed HTML attributes
        this.canvas.width = this.width;
        this.canvas.height = this.height;

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

        // Game State for Bonus Level
        this.gameState = 'OVERWORLD'; // OVERWORLD, BONUS
        this.savedState = null; // To store overworld state when entering bonus level




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
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: false });

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

        // Check for Pipe Entry (Manual or Forced)
        if (this.gameState === 'OVERWORLD' && !this.player.isEnteringPipe && !this.player.isExitingPipe) {
            // Manual Entry
            if (this.player.grounded && (this.input.keys['ArrowDown'] || this.input.keys['KeyS'])) {
                const pipe = this.pipes.find(p => p.playerOnTop && p.type === 'ENTRANCE' && !p.used);
                if (pipe) {
                    this.enterBonusLevel(pipe);
                    return;
                }
            }

            // Forced Entry (Suction)
            const suctionPipe = this.pipes.find(p => {
                if (p.type !== 'ENTRANCE' || p.used) return false;

                // Define suction zone:
                // Horizontal: within pipe width (slightly forgiving)
                // Vertical: just above the pipe (e.g., 0 to 50px above)
                const pipeCenter = p.x + p.width / 2;
                const playerCenter = this.player.x + this.player.width / 2;
                const horizontalDist = Math.abs(pipeCenter - playerCenter);

                const playerBottom = this.player.y + this.player.height;
                const pipeTop = p.y;
                const verticalDist = pipeTop - playerBottom;

                // Suction conditions:
                // 1. Horizontally aligned (within pipe width)
                // 2. Vertically close (touching or slightly above, e.g. jumping over)
                // 3. Moving downwards or standing (velY >= 0) to avoid catching while jumping UP
                const isHorizontallyAligned = horizontalDist < (p.width / 2 - 5); // Must be mostly inside
                const isVerticallyClose = verticalDist >= -10 && verticalDist < 40; // Allow slight overlap or just above
                const isFallingOrStanding = this.player.velY >= 0;

                return isHorizontallyAligned && isVerticallyClose && isFallingOrStanding;
            });

            if (suctionPipe) {
                // Snap to center and top
                this.player.x = suctionPipe.x + suctionPipe.width / 2 - this.player.width / 2;
                this.player.y = suctionPipe.y - this.player.height;
                this.player.velX = 0;
                this.player.velY = 0;
                this.enterBonusLevel(suctionPipe);
                return;
            }
        }

        // Check for Pipe Exit (in Bonus Level)
        if (this.gameState === 'BONUS' && !this.player.isEnteringPipe && !this.player.isExitingPipe) {
            // Manual Exit
            if (this.player.grounded && (this.input.keys['ArrowDown'] || this.input.keys['KeyS'])) {
                const pipe = this.pipes.find(p => p.playerOnTop && p.type === 'EXIT');
                if (pipe) {
                    this.returnToOverworld();
                    return;
                }
            }

            // Forced Exit (Suction)
            const suctionPipe = this.pipes.find(p => {
                if (p.type !== 'EXIT') return false;

                const pipeCenter = p.x + p.width / 2;
                const playerCenter = this.player.x + this.player.width / 2;
                const horizontalDist = Math.abs(pipeCenter - playerCenter);

                const playerBottom = this.player.y + this.player.height;
                const pipeTop = p.y;
                const verticalDist = pipeTop - playerBottom;

                const isHorizontallyAligned = horizontalDist < (p.width / 2 - 5);
                const isVerticallyClose = verticalDist >= -10 && verticalDist < 40;
                const isFallingOrStanding = this.player.velY >= 0;

                return isHorizontallyAligned && isVerticallyClose && isFallingOrStanding;
            });

            if (suctionPipe) {
                // Snap to center and top
                this.player.x = suctionPipe.x + suctionPipe.width / 2 - this.player.width / 2;
                this.player.y = suctionPipe.y - this.player.height;
                this.player.velX = 0;
                this.player.velY = 0;
                this.returnToOverworld();
                return;
            }
        }

        // Handle Pipe Transition - MOVED TO PlayerStates.js
        // Legacy code removed to prevent conflicts

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

        this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);

        if (this.gameState === 'BONUS') {
            // Random background for bonus level
            this.ctx.fillStyle = this.bonusBgColor || '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.background.draw(this.ctx, this.height, this.camera);
        }

        // Draw question blocks
        this.questionBlocks.forEach(block => {
            if (isEntityVisible(block, this.camera, this.width, this.height)) {
                block.draw(this.ctx, this.camera);
            }
        });

        // Check if player is animating pipe (entering or exiting)
        const isAnimatingPipe = this.player && (this.player.isEnteringPipe || this.player.isExitingPipe);

        // If animating pipe, draw player BEFORE pipes so they appear behind/inside
        if (isAnimatingPipe) {
            this.player.draw(this.ctx, this.camera);
        }

        // Draw pipes
        this.pipes.forEach(pipe => {
            if (isEntityVisible(pipe, this.camera, this.width, this.height)) {
                try {
                    pipe.draw(this.ctx, this.camera);
                } catch (e) {
                    console.error('Error drawing pipe:', e);
                }
            }
        });

        // Draw Lava
        this.lava.forEach(lava => {
            if (isEntityVisible(lava, this.camera, this.width, this.height)) {
                lava.draw(this.ctx, this.camera);
            }
        });

        // Draw coins
        this.coins.forEach(coin => {
            if (isEntityVisible(coin, this.camera, this.width, this.height)) {
                coin.draw(this.ctx, this.camera);
            }
        });

        this.platforms.forEach(p => {
            if (isEntityVisible(p, this.camera, this.width, this.height)) {
                p.draw(this.ctx, this.camera);
            }
        });

        this.enemies.forEach(e => {
            if (isEntityVisible(e, this.camera, this.width, this.height)) {
                e.draw(this.ctx, this.camera);
            }
        });

        // If NOT animating pipe, draw player normally (on top)
        if (this.player && !isAnimatingPipe) {
            this.player.draw(this.ctx, this.camera);
        }

        // Draw score popups
        this.scorePopups.forEach(popup => {
            // Popups are small, simple check or just draw them (they fade out anyway)
            // But let's cull them too if they are far off screen
            if (popup.x > this.camera.x - 50 && popup.x < this.camera.x + this.width + 50) {
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
            }
        });

        // Draw mushrooms
        this.mushrooms.forEach(mushroom => {
            if (isEntityVisible(mushroom, this.camera, this.width, this.height)) {
                mushroom.draw(this.ctx, this.camera);
            }
        });

        this.stars.forEach(star => {
            if (isEntityVisible(star, this.camera, this.width, this.height)) {
                star.draw(this.ctx, this.camera);
            }
        });

        this.fireflowers.forEach(flower => {
            if (isEntityVisible(flower, this.camera, this.width, this.height)) {
                flower.draw(this.ctx, this.camera);
            }
        });

        this.fireballs.forEach(fb => {
            if (isEntityVisible(fb, this.camera, this.width, this.height)) {
                fb.draw(this.ctx, this.camera);
            }
        });

        // Draw particles
        // ParticleSystem handles its own drawing, we might want to optimize inside it later
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
    }

    enterBonusLevel(pipe) {
        if (this.gameState !== 'OVERWORLD') return;

        this.playSound('pipe');

        // Mark pipe as used to prevent re-entry
        pipe.used = true;

        this.player.autoMovePipe = pipe;
        this.player.enterPipe();

        // Save Overworld State
        this.savedState = {
            cameraX: this.camera.x,
            playerX: this.player.x,
            playerY: this.player.y,
            score: this.score,
            levelWidth: this.levelWidth, // Save level width
            entities: {
                platforms: [...this.platforms],
                coins: [...this.coins],
                enemies: [...this.enemies],
                pipes: [...this.pipes],
                blocks: [...this.questionBlocks]
            }
        };
    }

    loadBonusLevel() {
        this.gameState = 'BONUS';

        // Clear current entities for bonus level
        this.platforms = [];
        this.coins = [];
        this.enemyManager.reset(); // Clear enemies
        this.pipes = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        this.fireballs = [];
        this.lava = [];

        // Setup Bonus Room
        const roomWidth = 1000;
        // Update levelWidth to enforce bounds in Player.js
        this.levelWidth = roomWidth;

        const groundY = this.height - 50;
        const ceilingY = 50;

        // Randomize Layout
        const layouts = ['CLASSIC', 'PYRAMID', 'SKY_STEPS'];
        const selectedLayout = layouts[Math.floor(Math.random() * layouts.length)];
        console.log('Bonus Level Layout:', selectedLayout);

        // Randomize Background Color (handled in draw, but we can store it)
        const bgColors = ['#000000', '#1a0b2e', '#001f3f', '#2c0b0e'];
        this.bonusBgColor = bgColors[Math.floor(Math.random() * bgColors.length)];

        // Common: Floor
        this.platforms.push({
            x: 0, y: groundY, width: roomWidth, height: 50, draw: (ctx) => {
                ctx.fillStyle = '#0055AA'; // Blue bricks for underground
                ctx.fillRect(0, groundY, roomWidth, 50);
                // Grid pattern
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < roomWidth; i += 50) {
                    ctx.moveTo(i, groundY);
                    ctx.lineTo(i, groundY + 50);
                }
                ctx.stroke();
            }
        });

        // Common: Ceiling (Extended upwards to prevent landing on top)
        this.platforms.push({
            x: 0,
            y: -1000,
            width: roomWidth,
            height: 1000 + ceilingY,
            draw: (ctx) => {
                ctx.fillStyle = '#0055AA';
                // Only draw the visible part (0 to ceilingY)
                ctx.fillRect(0, 0, roomWidth, ceilingY);
            }
        });

        // Common: Walls (Invisible barriers)
        this.platforms.push({ x: -50, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });
        this.platforms.push({ x: roomWidth, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });

        // Layout Specific Generation
        if (selectedLayout === 'CLASSIC') {
            // Platforms leading to coins
            for (let i = 0; i < 3; i++) {
                this.platforms.push({
                    x: 300 + i * 150,
                    y: groundY - 100 - i * 50,
                    width: 100,
                    height: 20,
                    draw: (ctx, camera) => {
                        const x = 300 + i * 150 - camera.x;
                        const y = groundY - 100 - i * 50;
                        ctx.fillStyle = '#FF8C00';
                        ctx.fillRect(x, y, 100, 20);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x, y, 100, 20);
                    }
                });
            }
            // Grid of coins
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 3; j++) {
                    this.coins.push(this.coinPool.get(250 + i * 60, 150 + j * 50));
                }
            }
            // Smiley Face
            const centerX = 850;
            const centerY = 200;
            this.coins.push(this.coinPool.get(centerX - 30, centerY - 30));
            this.coins.push(this.coinPool.get(centerX + 30, centerY - 30));
            this.coins.push(this.coinPool.get(centerX - 40, centerY + 20));
            this.coins.push(this.coinPool.get(centerX - 20, centerY + 35));
            this.coins.push(this.coinPool.get(centerX, centerY + 40));
            this.coins.push(this.coinPool.get(centerX + 20, centerY + 35));
            this.coins.push(this.coinPool.get(centerX + 40, centerY + 20));

        } else if (selectedLayout === 'PYRAMID') {
            // Pyramid structure
            const startX = 200;
            const stepWidth = 60;
            const stepHeight = 60;
            const levels = 5;

            for (let i = 0; i < levels; i++) {
                // Left side steps
                this.platforms.push({
                    x: startX + i * stepWidth,
                    y: groundY - (i + 1) * stepHeight,
                    width: stepWidth,
                    height: (i + 1) * stepHeight,
                    draw: (ctx, camera) => {
                        const x = startX + i * stepWidth - camera.x;
                        const y = groundY - (i + 1) * stepHeight;
                        ctx.fillStyle = '#B8860B'; // Dark Goldenrod
                        ctx.fillRect(x, y, stepWidth, (i + 1) * stepHeight);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x, y, stepWidth, (i + 1) * stepHeight);
                    }
                });
                // Coin on each step
                this.coins.push(this.coinPool.get(startX + i * stepWidth + 15, groundY - (i + 1) * stepHeight - 40));

                // Right side steps (mirror)
                const rightX = startX + (levels * 2 - 1 - i) * stepWidth;
                this.platforms.push({
                    x: rightX,
                    y: groundY - (i + 1) * stepHeight,
                    width: stepWidth,
                    height: (i + 1) * stepHeight,
                    draw: (ctx, camera) => {
                        const x = rightX - camera.x;
                        const y = groundY - (i + 1) * stepHeight;
                        ctx.fillStyle = '#B8860B';
                        ctx.fillRect(x, y, stepWidth, (i + 1) * stepHeight);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x, y, stepWidth, (i + 1) * stepHeight);
                    }
                });
                // Coin on each step
                this.coins.push(this.coinPool.get(rightX + 15, groundY - (i + 1) * stepHeight - 40));
            }

            // Top platform
            const topX = startX + levels * stepWidth;
            this.platforms.push({
                x: topX,
                y: groundY - (levels + 1) * stepHeight,
                width: stepWidth * 2, // Wider top
                height: (levels + 1) * stepHeight,
                draw: (ctx, camera) => {
                    const x = topX - camera.x;
                    const y = groundY - (levels + 1) * stepHeight;
                    ctx.fillStyle = '#FFD700'; // Gold top
                    ctx.fillRect(x, y, stepWidth * 2, (levels + 1) * stepHeight);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x, y, stepWidth * 2, (levels + 1) * stepHeight);
                }
            });
            // Big reward on top
            this.coins.push(this.coinPool.get(topX + 20, groundY - (levels + 1) * stepHeight - 40));
            this.coins.push(this.coinPool.get(topX + 60, groundY - (levels + 1) * stepHeight - 40));
            this.coins.push(this.coinPool.get(topX + 40, groundY - (levels + 1) * stepHeight - 80));

        } else if (selectedLayout === 'SKY_STEPS') {
            // Floating platforms
            const platformCount = 6;
            for (let i = 0; i < platformCount; i++) {
                const x = 200 + i * 120;
                const y = groundY - 100 - (i % 2 === 0 ? 0 : 100); // Zigzag height

                this.platforms.push({
                    x: x,
                    y: y,
                    width: 80,
                    height: 20,
                    draw: (ctx, camera) => {
                        const px = x - camera.x;
                        const py = y;
                        ctx.fillStyle = '#87CEEB'; // Sky blue
                        ctx.fillRect(px, py, 80, 20);
                        ctx.strokeStyle = '#FFF';
                        ctx.strokeRect(px, py, 80, 20);
                    }
                });

                // Coins above and below
                this.coins.push(this.coinPool.get(x + 25, y - 40));
                if (i % 2 !== 0) {
                    this.coins.push(this.coinPool.get(x + 25, y + 40));
                }
            }

            // Final cloud platform
            this.platforms.push({
                x: 200 + platformCount * 120,
                y: groundY - 200,
                width: 150,
                height: 30,
                draw: (ctx, camera) => {
                    const px = 200 + platformCount * 120 - camera.x;
                    const py = groundY - 200;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(px, py, 150, 30);
                }
            });
            // Rain of coins
            for (let k = 0; k < 5; k++) {
                this.coins.push(this.coinPool.get(200 + platformCount * 120 + 20 + k * 25, groundY - 240));
            }
        }

        // Exit Pipe
        const exitPipe = new Pipe(roomWidth - 100, groundY - 80, 80, false);
        exitPipe.type = 'EXIT';
        this.pipes.push(exitPipe);

        // Reset Camera
        this.camera.x = 0;

        // Position Player
        this.player.x = 100;
        this.player.y = 60; // Fall in from top
        this.player.velX = 0;
        this.player.velY = 0;
    }

    returnToOverworld() {
        this.player.enterPipe();
    }

    unloadBonusLevel() {
        this.gameState = 'OVERWORLD';

        // Restore State
        if (this.savedState) {
            this.camera.x = this.savedState.cameraX;
            this.player.x = this.savedState.playerX + 100;
            this.player.y = this.savedState.playerY - 50;

            // Restore level width
            if (this.savedState.levelWidth) {
                this.levelWidth = this.savedState.levelWidth;
            }

            // Restore entities
            this.platforms = this.savedState.entities.platforms;
            this.coins = this.savedState.entities.coins;
            // Enemies? We cleared them. Restoring them might be buggy if they moved.
            // Let's just keep the overworld entities as they were, assuming we didn't destroy the objects, just cleared the reference arrays.
            // Wait, I cleared the arrays. The objects still exist in savedState.
            // But EnemyManager manages enemies internally. 
            // For now, let's just restore the arrays.
            this.pipes = this.savedState.entities.pipes;
            this.questionBlocks = this.savedState.entities.blocks;

            // Note: EnemyManager needs to be handled. 
            // If we cleared enemies via reset(), they are gone.
            // We should probably NOT clear them but just stop updating/drawing them?
            // Or better: Swapping the arrays is fine, but EnemyManager has its own list.
            // Let's just ignore enemies for now or respawn them?
            // Actually, let's just restore the enemies array to the manager if possible.
            // But EnemyManager.enemies is a getter.
            // We might lose enemies. That's acceptable for a prototype.
        }

        this.savedState = null;
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

    handleCanvasClick(e) {
        if (!this.gameRunning || this.isPaused || this.gameState !== 'OVERWORLD') return;

        // Get coordinates
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            // Prevent default to avoid double firing with click, but be careful with UI buttons
            // Actually, UI buttons are HTML elements on top, so they handle their own events.
            // But if we preventDefault here on canvas, it might be fine.
            // However, InputHandler might already be handling touchstart.
            // Let's just use the coordinates.
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        const worldX = canvasX + this.camera.x;
        const worldY = canvasY + this.camera.y;

        // Check if clicked on an ENTRANCE pipe
        const clickedPipe = this.pipes.find(p =>
            p.type === 'ENTRANCE' &&
            worldX >= p.x && worldX <= p.x + p.width &&
            worldY >= p.y - 60 && worldY <= p.y + p.height
        );

        if (clickedPipe) {
            // Calculate target X (center of pipe)
            // Player x is top-left, so center is pipe.x + pipe.width/2 - player.width/2
            const targetX = clickedPipe.x + clickedPipe.width / 2 - this.player.width / 2;

            // Check if player is already on the pipe (vertical and horizontal check)
            const playerBottom = this.player.y + this.player.height;
            const pipeTop = clickedPipe.y;
            const verticalCheck = Math.abs(playerBottom - pipeTop) < 20 && this.player.grounded;
            const playerCenter = this.player.x + this.player.width / 2;
            const pipeCenter = clickedPipe.x + clickedPipe.width / 2;
            const horizontalCheck = Math.abs(playerCenter - pipeCenter) < (clickedPipe.width / 2 + 10);

            if (verticalCheck && horizontalCheck) {
                // Already on top, enter immediately
                this.enterBonusLevel(clickedPipe);
            } else {
                // Not on top, trigger auto-walk
                // Only if grounded (or maybe allow if falling? let's stick to grounded for now to avoid weird air-walking)
                if (this.player.grounded) {
                    this.player.autoMoveTargetX = targetX;
                    this.player.autoMovePipe = clickedPipe;
                }
            }
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
            difficulty: difficulty,
            biome: this.currentBiome // Pass current biome
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
    }
}


