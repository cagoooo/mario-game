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
import { MegaMushroom } from './MegaMushroom.js?v=1.9.32';
import { Pipe } from './Pipe.js?v=1.8.9';
import { Magnet } from './Magnet.js?v=1.9.32';
import { Lava } from './Lava.js?v=1.8.9';
import { EnhancedAudioSystem } from './AudioSystem.js?v=1.8.9';
import { ParticleSystem } from './ParticleSystem.js?v=1.8.9';
import { ObjectPool } from './ObjectPool.js?v=1.8.9';
import { Boss, createBoss } from './Boss.js?v=1.9.33';

export class Game {
    constructor(canvas, uiElements, assetLoader) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiElements;
        this.assetLoader = assetLoader;
        this.images = assetLoader.images;

        this.width = 800;
        this.height = 400;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

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

        this.scorePopups = [];
        this.scorePopupPool = [];

        this.coinPool = new ObjectPool(
            () => new Coin(0, 0),
            (c, x, y) => c.reset(x, y)
        );

        this.fireballPool = new ObjectPool(
            () => new Fireball(0, 0, 1),
            (f, x, y, direction) => f.reset(x, y, direction)
        );

        this.particleSystem = new ParticleSystem();
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.freezeFrames = 0;
        this.deathFlashTimer = 0;

        this.audioSystem = new EnhancedAudioSystem();
        this.currentBGMMode = null;

        this.input = new InputHandler(() => this.onJump());
        this.input.attachCanvas(canvas);
        this.input.attachControls(uiElements.leftBtn, uiElements.rightBtn, uiElements.jumpBtn);

        this.background = new Background(this.width, this.GROUND_Y);
        this.levelGenerator = new LevelGenerator();
        this.collisionSystem = new CollisionSystem(this);
        this.enemyManager = new EnemyManager();

        this.currentBiome = 'PLAINS';
        this.biomeDistance = 0;
        this.BIOME_LENGTH = 3000;

        this.gameState = 'OVERWORLD';
        this.savedState = null;

        this.boss = null;
        this.bossBattleActive = false;
        this.bossArenaStartX = 0;
        this.bossTriggerDistance = 5000;

        this.player = null;
        this.platforms = [];
        this.coins = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        this.fireballs = [];
        this.pipes = [];
        this.lava = [];

        this.ui.restartBtn.addEventListener('click', () => this.restart());

        this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        this.ui.score.textContent = `⭐ 0`;

        this.handleAnyKeyRestart = this.handleAnyKeyRestart.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: false });

        this.start();
        this.startBGM();
    }

    get enemies() {
        return this.enemyManager.enemies;
    }

    start() {
        if (this.gameRunning) return;
        this.gameRunning = true;
        this.initGame();
        this.isGameOverSequence = false;
        this.isNewHighScore = false;
        this.isPaused = false;
        this.score = 0;
        this.ui.score.textContent = `⭐ 0`;
        this.ui.gameOverOverlay.style.display = 'none';
        this.ui.pauseOverlay.style.display = 'none';
        this.gameLoop();
    }

    triggerFreeze(frames) {
        this.freezeFrames = frames;
    }

    triggerDeathEffect() {
        this.triggerScreenShake(20);
        this.triggerFreeze(45);
        this.deathFlashTimer = 10;
        this.playSound('death');
    }

    initAudio() {
        if (this.audioSystem) this.audioSystem.initAudio();
    }

    playSound(type) {
        if (this.audioSystem) this.audioSystem.playSound(type);
    }

    startBGM() {
        if (this.audioSystem) {
            const bgmMode = this.currentBiome || 'PLAINS';
            if (this.currentBGMMode !== bgmMode) {
                this.audioSystem.startBGM(bgmMode);
                this.currentBGMMode = bgmMode;
            } else {
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

    initGame() {
        this.player = new Player(this, 50, this.GROUND_Y, this.images.player);
        this.player.setGroundY(this.GROUND_Y);
        this.platforms = [];
        this.enemyManager.reset();
        if (this.coins) this.coins.forEach(c => this.coinPool.release(c));
        this.coins = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        if (this.fireballs) this.fireballs.forEach(f => this.fireballPool.release(f));
        this.fireballs = [];
        this.magnets = [];
        this.megaMushrooms = [];
        this.pipes = [];
        this.lava = [];
        const biomeKeys = Object.keys(Biomes);
        this.currentBiome = biomeKeys[Math.floor(Math.random() * biomeKeys.length)];
        this.background.setBiome(this.currentBiome);
        this.biomeDistance = 0;
        this.lastGeneratedX = 0;
        this.generateChunk(0, this.CHUNK_SIZE * 2);
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
        this.particleSystem.activeParticles = [];
        this.updateScore();
        this.ui.pauseOverlay.style.display = 'none';
        this.background.setTiles(this.images.tiles);
        this.player.invincible = true;
        this.player.invincibleTime = 180;
        this.autoFireTimer = 0;
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

        if (this.gameState === 'OVERWORLD' && !this.player.isEnteringPipe && !this.player.isExitingPipe) {
            if (this.player.grounded && (this.input.keys['ArrowDown'] || this.input.keys['KeyS'])) {
                const pipe = this.pipes.find(p => p.playerOnTop && p.type === 'ENTRANCE' && !p.used);
                if (pipe) {
                    this.enterBonusLevel(pipe);
                    return;
                }
            }
        }

        if (this.gameState === 'OVERWORLD' && !this.bossBattleActive && this.player.x > this.bossTriggerDistance) {
            this.triggerBossBattle();
        }

        if (this.bossBattleActive && this.boss) {
            this.updateBossBattle();
        }

        if (this.gameState === 'BONUS' && !this.player.isEnteringPipe && !this.player.isExitingPipe) {
            if (this.player.grounded && (this.input.keys['ArrowDown'] || this.input.keys['KeyS'])) {
                const pipe = this.pipes.find(p => p.playerOnTop && p.type === 'EXIT');
                if (pipe) {
                    this.returnToOverworld();
                    return;
                }
            }
        }

        if (this.freezeFrames > 0) {
            this.freezeFrames--;
            return;
        }

        if (this.player.firePower) {
            this.autoFireTimer++;
            if (this.autoFireTimer > 45) {
                this.shootFireball();
                this.autoFireTimer = 0;
            }
        } else {
            this.autoFireTimer = 0;
        }

        if (this.player.isDead) {
            this.player.update(this.input, this.platforms, this.width, this.camera);
            if (this.player.y > this.height + 100) {
                this.showGameOverScreen();
            }
            return;
        }

        if (this.player.starPower) {
            if (this.currentBGMMode !== 'star') {
                this.audioSystem.startBGM('star');
                this.currentBGMMode = 'star';
            }
        } else {
            if (this.currentBGMMode === 'star') {
                const biomeMode = this.currentBiome || 'PLAINS';
                this.audioSystem.startBGM(biomeMode);
                this.currentBGMMode = biomeMode;
            }
        }

        this.player.update(this.input, this.platforms, this.levelWidth, this.camera);

        if (this.player.grounded && Math.abs(this.player.velX) > 0.5) {
            this.createDustParticle(this.player.x + this.player.width / 2, this.player.y + this.player.height);
        }

        let targetCamX = this.player.x - this.width / 2 + this.player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        this.camera.x = targetCamX;

        this.enemyManager.update(this.camera.x + this.width + 1000);
        this.questionBlocks.forEach(block => block.update());

        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.velocity;
            popup.life--;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }

        this.updateParticles();

        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.fireballs[i];
            fireball.update(this.platforms, this.GROUND_Y);
            if (!fireball.active) {
                this.fireballPool.release(fireball);
                this.fireballs.splice(i, 1);
                continue;
            }
        }

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update(this.player);
        }

        for (let i = this.magnets.length - 1; i >= 0; i--) {
            const magnet = this.magnets[i];
            magnet.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (magnet.collected) {
                this.magnets.splice(i, 1);
                continue;
            }
        }

        for (let i = this.megaMushrooms.length - 1; i >= 0; i--) {
            const mega = this.megaMushrooms[i];
            mega.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (mega.collected) {
                this.megaMushrooms.splice(i, 1);
                continue;
            }
        }

        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            const mushroom = this.mushrooms[i];
            mushroom.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (mushroom.collected) {
                this.mushrooms.splice(i, 1);
                continue;
            }
        }

        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (star.collected) {
                this.stars.splice(i, 1);
                continue;
            }
        }

        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            const flower = this.fireflowers[i];
            flower.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (flower.collected) {
                this.fireflowers.splice(i, 1);
                continue;
            }
        }

        this.pipes.forEach(pipe => {
            try {
                pipe.update();
            } catch (e) {
                console.error('Error updating pipe:', e);
            }
        });

        this.lava.forEach(lava => lava.update());
        this.lava.forEach(lava => lava.update());
        this.collisionSystem.update();

        // === BOUNDARY CHECKS (Bonus Level) ===
        if (this.gameState === 'BONUS') {
            // Ceiling check (Invisible wall at top)
            if (this.player.y < 50) {
                this.player.y = 50;
                if (this.player.velY < 0) this.player.velY = 0;
            }
            // Horizontal bounds (Invisible walls)
            if (this.player.x < 0) this.player.x = 0;

            // Find the exit pipe and use its right edge as the boundary
            const exitPipe = this.pipes.find(p => p.type === 'EXIT');
            const rightBoundary = exitPipe ? (exitPipe.x + exitPipe.width) : this.levelWidth;

            if (this.player.x + this.player.width > rightBoundary) {
                this.player.x = rightBoundary - this.player.width;
            }
        }

        // === AUTO-ENTER PIPE CHECK (After Collision) ===
        // We check here because collisionSystem updates 'grounded' and 'playerOnTop'
        if (!this.player.isEnteringPipe && !this.player.isExitingPipe && this.player.grounded) {
            const standingPipe = this.pipes.find(p => {
                // Use the flag set by CollisionSystem
                if (p.playerOnTop) return true;

                // Fallback geometric check (in case CollisionSystem missed it or logic differs)
                const playerCenter = this.player.x + this.player.width / 2;
                const pipeCenter = p.x + p.width / 2;
                const horizontalCheck = Math.abs(playerCenter - pipeCenter) < p.width / 2;
                const verticalCheck = Math.abs((this.player.y + this.player.height) - p.y) < 5;
                return horizontalCheck && verticalCheck;
            });

            if (standingPipe) {
                if (this.gameState === 'OVERWORLD' && standingPipe.type === 'ENTRANCE' && !standingPipe.used) {
                    this.enterBonusLevel(standingPipe);
                } else if (this.gameState === 'BONUS' && standingPipe.type === 'EXIT') {
                    this.returnToOverworld();
                }
            }
        }

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

        if (this.camera.x + this.width + this.renderDistance > this.lastGeneratedX) {
            const nextChunkEnd = this.lastGeneratedX + this.CHUNK_SIZE;
            this.generateChunk(this.lastGeneratedX, nextChunkEnd);
        }

        if (this.camera.x - this.cleanupMargin > this.lastCleanedX) {
            this.cleanupObjects(this.camera.x - this.cleanupMargin);
            this.lastCleanedX = this.camera.x - this.cleanupMargin;
        }

        this.background.update(this.score);
    }

    triggerBossBattle() {
        if (this.bossBattleActive) return;
        console.log('BOSS BATTLE START!');
        this.bossBattleActive = true;
        this.gameState = 'BOSS_BATTLE';
        const arenaStart = Math.ceil((this.player.x + 800) / 100) * 100;
        this.bossArenaStartX = arenaStart;
        const arena = this.levelGenerator.generateBossArena(arenaStart, this.GROUND_Y);
        this.platforms.push(...arena.platforms);
        this.boss = createBoss(this.currentBiome, arenaStart + 800, this.GROUND_Y - 100, this.getDifficultyMultiplier());
        this.renderDistance = 0;
    }

    updateBossBattle() {
        if (!this.boss) return;
        this.boss.update(this.player, this.platforms, this.width);
        if (!this.boss.alive && this.boss.y > this.height + 200) {
            this.bossBattleActive = false;
            this.boss = null;
            this.gameState = 'OVERWORLD';
            return;
        }
        if (this.boss.alive) {
            const minCam = this.bossArenaStartX;
            const maxCam = this.bossArenaStartX + 400;
            if (this.camera.x > maxCam) this.camera.x = maxCam;
            if (this.camera.x < minCam) this.camera.x = minCam;
        }
        this.checkBossCollisions();
    }

    checkBossCollisions() {
        if (!this.boss || !this.boss.alive || this.boss.state === 'DIE') return;
        if (checkCollision(this.player, this.boss)) {
            const hitFromAbove = this.player.velY > 0 &&
                this.player.y + this.player.height < this.boss.y + this.boss.height / 2;
            if (hitFromAbove) {
                this.boss.takeDamage();
                this.player.velY = -10;
                this.playSound('stomp');
                this.addParticles(this.boss.x + this.boss.width / 2, this.boss.y, 10, '#FFF');
                if (!this.boss.alive) {
                    this.handleBossDefeat();
                }
            } else {
                // Star Power / Invincibility Damage to Boss
                if (this.player.invincible && this.player.starPower) {
                    // We need a cooldown for continuous damage
                    if (!this.boss.invincibilityTimer || this.boss.invincibilityTimer <= 0) {
                        this.boss.takeDamage();
                        this.boss.invincibilityTimer = 30; // 0.5s cooldown
                        this.playSound('stomp'); // Use stomp sound as kick doesn't exist
                        this.addParticles(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 8, '#FFD700'); // Gold particles
                        if (!this.boss.alive) {
                            this.handleBossDefeat();
                        }
                    }
                } else if (!this.player.invincible && !this.boss.isInvincible) {
                    this.player.takeDamage();
                }
            }
        }
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            if (checkCollision(fb, this.boss)) {
                this.boss.takeDamage();
                this.fireballPool.release(fb);
                this.fireballs.splice(i, 1);
                this.addParticles(fb.x, fb.y, 5, '#FF4500');
            }
        }
    }

    handleBossDefeat() {
        console.log('BOSS DEFEATED!');
        const baseScore = 5000;
        const multiplier = 2;
        const totalScore = baseScore * multiplier;
        this.score += totalScore;
        this.updateScore();
        this.playSound('coin');
        this.addScorePopup(this.boss.x, this.boss.y, totalScore, true);
        this.addParticles(this.boss.x, this.boss.y, 50, '#FFD700');
        this.addParticles(this.boss.x, this.boss.y, 30, '#FF4500');
        this.renderDistance = 2000;
        this.bossTriggerDistance = this.player.x + 5000;
    }

    addScorePopup(x, y, value, isCritical = false) {
        this.scorePopups.push({
            x: x,
            y: y,
            value: value,
            life: 60,
            velocity: -2,
            isCritical: isCritical
        });
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);

        if (this.gameState === 'BONUS') {
            this.ctx.fillStyle = this.bonusBgColor || '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.background.draw(this.ctx, this.height, this.camera);
        }

        this.questionBlocks.forEach(block => {
            if (isEntityVisible(block, this.camera, this.width, this.height)) {
                block.draw(this.ctx, this.camera);
            }
        });

        const isAnimatingPipe = this.player && (this.player.isEnteringPipe || this.player.isExitingPipe);
        if (isAnimatingPipe) {
            this.player.draw(this.ctx, this.camera);
        }

        this.pipes.forEach(pipe => {
            if (isEntityVisible(pipe, this.camera, this.width, this.height)) {
                try {
                    pipe.draw(this.ctx, this.camera);
                } catch (e) {
                    console.error('Error drawing pipe:', e);
                }
            }
        });

        this.lava.forEach(lava => {
            if (isEntityVisible(lava, this.camera, this.width, this.height)) {
                lava.draw(this.ctx, this.camera);
            }
        });

        this.coins.forEach(coin => {
            if (isEntityVisible(coin, this.camera, this.width, this.height)) {
                coin.draw(this.ctx, this.camera);
            }
        });

        this.magnets.forEach(m => {
            if (isEntityVisible(m, this.camera, this.width, this.height)) {
                m.draw(this.ctx, this.camera);
            }
        });

        this.megaMushrooms.forEach(m => {
            if (isEntityVisible(m, this.camera, this.width, this.height)) {
                m.draw(this.ctx, this.camera);
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

        if (this.bossBattleActive && this.boss) {
            this.boss.draw(this.ctx, this.camera);
            if (this.boss.alive) {
                this.ctx.save();
                const barWidth = 300;
                const barHeight = 25;
                const barX = this.width / 2 - barWidth / 2;
                const barY = 50;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX + 4, barY + 4, barWidth, barHeight);
                this.ctx.strokeStyle = '#FFF';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                const hpPercent = this.boss.hp / this.boss.maxHp;
                const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
                gradient.addColorStop(0, '#FF4500');
                gradient.addColorStop(1, '#FF0000');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = 'bold 20px "Arial Black", Gadget, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText('☠️ BOSS ☠️', this.width / 2, barY - 10);
                this.ctx.shadowBlur = 0;
                this.ctx.restore();
            }
        }

        if (this.player && !isAnimatingPipe) {
            this.player.draw(this.ctx, this.camera);
        }

        this.scorePopups.forEach(popup => {
            if (popup.x > this.camera.x - 50 && popup.x < this.camera.x + this.width + 50) {
                const screenX = popup.x - this.camera.x;
                const alpha = popup.life / 60;
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                if (popup.isCritical) {
                    this.ctx.font = 'bold 40px "Arial Black", sans-serif';
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.strokeStyle = '#FF4500';
                    this.ctx.lineWidth = 4;
                    const shakeX = (Math.random() - 0.5) * 4;
                    const shakeY = (Math.random() - 0.5) * 4;
                    this.ctx.translate(shakeX, shakeY);
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(`+${popup.value}`, screenX, popup.y);
                    this.ctx.fillText(`+${popup.value}`, screenX, popup.y);
                } else {
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 3;
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(`+${popup.value}`, screenX, popup.y);
                    this.ctx.fillText(`+${popup.value}`, screenX, popup.y);
                }
                this.ctx.restore();
            }
        });

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

        this.particleSystem.draw(this.ctx, this.camera);

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

        this.ctx.restore();
    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = intensity;
    }

    cleanupObjects(minX) {
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            if (this.platforms[i].x + this.platforms[i].width < minX) {
                this.platforms.splice(i, 1);
            }
        }

        this.enemyManager.cleanup(minX);

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            if (c.x + c.width <= minX) {
                this.coinPool.release(c);
                this.coins.splice(i, 1);
            }
        }

        for (let i = this.questionBlocks.length - 1; i >= 0; i--) {
            if (this.questionBlocks[i].x + this.questionBlocks[i].width < minX) {
                this.questionBlocks.splice(i, 1);
            }
        }

        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            if (this.mushrooms[i].x + this.mushrooms[i].width < minX) {
                this.mushrooms.splice(i, 1);
            }
        }

        for (let i = this.stars.length - 1; i >= 0; i--) {
            if (this.stars[i].x + this.stars[i].width < minX) {
                this.stars.splice(i, 1);
            }
        }

        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            if (this.fireflowers[i].x + this.fireflowers[i].width < minX) {
                this.fireflowers.splice(i, 1);
            }
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            if (this.pipes[i].x + this.pipes[i].width < minX) {
                this.pipes.splice(i, 1);
            }
        }
    }

    enterBonusLevel(pipe) {
        if (this.gameState !== 'OVERWORLD') return;

        this.playSound('pipe');

        pipe.used = true;

        this.player.autoMovePipe = pipe;
        this.player.enterPipe();

        this.savedState = {
            cameraX: this.camera.x,
            playerX: this.player.x,
            playerY: this.player.y,
            score: this.score,
            levelWidth: this.levelWidth,
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

        this.platforms = [];
        this.coins = [];
        this.enemyManager.reset();
        this.pipes = [];
        this.questionBlocks = [];
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        this.fireballs = [];
        this.lava = [];

        const roomWidth = 1000;
        this.levelWidth = roomWidth;

        const groundY = this.height - 50;
        const ceilingY = 50;

        const layouts = ['CLASSIC', 'PYRAMID', 'SKY_STEPS'];
        const selectedLayout = layouts[Math.floor(Math.random() * layouts.length)];
        console.log('Bonus Level Layout:', selectedLayout);

        const bgColors = ['#000000', '#1a0b2e', '#001f3f', '#2c0b0e'];
        this.bonusBgColor = bgColors[Math.floor(Math.random() * bgColors.length)];

        this.platforms.push({
            x: 0, y: groundY, width: roomWidth, height: 50, draw: (ctx) => {
                ctx.fillStyle = '#0055AA';
                ctx.fillRect(0, groundY, roomWidth, 50);
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

        this.platforms.push({
            x: 0,
            y: -1000,
            width: roomWidth,
            height: 1000 + ceilingY,
            draw: (ctx) => {
                ctx.fillStyle = '#0055AA';
                ctx.fillRect(0, 0, roomWidth, ceilingY);
            }
        });

        this.platforms.push({ x: -50, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });
        this.platforms.push({ x: roomWidth, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });

        if (selectedLayout === 'CLASSIC') {
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
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 3; j++) {
                    this.coins.push(this.coinPool.get(250 + i * 60, 150 + j * 50));
                }
            }
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
            const startX = 200;
            const stepWidth = 60;
            const stepHeight = 60;
            const levels = 5;

            for (let i = 0; i < levels; i++) {
                this.platforms.push({
                    x: startX + i * stepWidth,
                    y: groundY - (i + 1) * stepHeight,
                    width: stepWidth,
                    height: (i + 1) * stepHeight,
                    draw: (ctx, camera) => {
                        const x = startX + i * stepWidth - camera.x;
                        const y = groundY - (i + 1) * stepHeight;
                        ctx.fillStyle = '#B8860B';
                        ctx.fillRect(x, y, stepWidth, (i + 1) * stepHeight);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x, y, stepWidth, (i + 1) * stepHeight);
                    }
                });
                this.coins.push(this.coinPool.get(startX + i * stepWidth + 15, groundY - (i + 1) * stepHeight - 40));

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
                this.coins.push(this.coinPool.get(rightX + 15, groundY - (i + 1) * stepHeight - 40));
            }

            const topX = startX + levels * stepWidth;
            this.platforms.push({
                x: topX,
                y: groundY - (levels + 1) * stepHeight,
                width: stepWidth * 2,
                height: (levels + 1) * stepHeight,
                draw: (ctx, camera) => {
                    const x = topX - camera.x;
                    const y = groundY - (levels + 1) * stepHeight;
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(x, y, stepWidth * 2, (levels + 1) * stepHeight);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x, y, stepWidth * 2, (levels + 1) * stepHeight);
                }
            });
            this.coins.push(this.coinPool.get(topX + 20, groundY - (levels + 1) * stepHeight - 40));
            this.coins.push(this.coinPool.get(topX + 60, groundY - (levels + 1) * stepHeight - 40));
            this.coins.push(this.coinPool.get(topX + 40, groundY - (levels + 1) * stepHeight - 80));

        } else if (selectedLayout === 'SKY_STEPS') {
            const platformCount = 6;
            for (let i = 0; i < platformCount; i++) {
                const x = 200 + i * 120;
                const y = groundY - 100 - (i % 2 === 0 ? 0 : 100);

                this.platforms.push({
                    x: x,
                    y: y,
                    width: 80,
                    height: 20,
                    draw: (ctx, camera) => {
                        const px = x - camera.x;
                        const py = y;
                        ctx.fillStyle = '#87CEEB';
                        ctx.fillRect(px, py, 80, 20);
                        ctx.strokeStyle = '#FFF';
                        ctx.strokeRect(px, py, 80, 20);
                    }
                });

                this.coins.push(this.coinPool.get(x + 25, y - 40));
                if (i % 2 !== 0) {
                    this.coins.push(this.coinPool.get(x + 25, y + 40));
                }
            }

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
            for (let k = 0; k < 5; k++) {
                this.coins.push(this.coinPool.get(200 + platformCount * 120 + 20 + k * 25, groundY - 240));
            }
        }

        const exitPipe = new Pipe(roomWidth - 100, groundY - 80, 80, false);
        exitPipe.type = 'EXIT';
        this.pipes.push(exitPipe);

        this.camera.x = 0;

        this.player.x = 100;
        this.player.y = 60;
        this.player.velX = 0;
        this.player.velY = 0;
    }

    returnToOverworld() {
        this.player.enterPipe();
    }

    unloadBonusLevel() {
        this.gameState = 'OVERWORLD';

        if (this.savedState) {
            this.camera.x = this.savedState.cameraX;
            this.player.x = this.savedState.playerX + 100;
            this.player.y = this.savedState.playerY - 50;

            if (this.savedState.levelWidth) {
                this.levelWidth = this.savedState.levelWidth;
            }

            this.platforms = this.savedState.entities.platforms;
            this.coins = this.savedState.entities.coins;
            this.pipes = this.savedState.entities.pipes;
            this.questionBlocks = this.savedState.entities.blocks;
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

    gameOver() {
        if (!this.gameRunning) return;

        this.player.die();
        this.stopBGM();
        this.playSound('death');

        this.isGameOverSequence = true;
    }

    showGameOverScreen() {
        this.gameRunning = false;
        this.isGameOverSequence = false;
        this.stopBGM();

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

        const addRestartListeners = () => {
            document.addEventListener('keydown', this.handleAnyKeyRestart);
            document.addEventListener('click', this.handleAnyKeyRestart);
            document.addEventListener('touchstart', this.handleAnyKeyRestart);
        };

        setTimeout(addRestartListeners, 500);
    }

    restart() {
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
            this.restart();
        }
    }

    handleCanvasClick(e) {
        if (!this.gameRunning || this.isPaused) return;
        if (this.gameState !== 'OVERWORLD' && this.gameState !== 'BONUS') return;

        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
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

        const targetType = this.gameState === 'OVERWORLD' ? 'ENTRANCE' : 'EXIT';

        const clickedPipe = this.pipes.find(p =>
            p.type === targetType &&
            worldX >= p.x && worldX <= p.x + p.width &&
            worldY >= p.y - 100 && worldY <= p.y + p.height // Expanded trigger area above pipe
        );

        if (clickedPipe) {
            const targetX = clickedPipe.x + clickedPipe.width / 2 - this.player.width / 2;

            const playerBottom = this.player.y + this.player.height;
            const pipeTop = clickedPipe.y;
            // Relaxed vertical check to 150 to ensure entry even when jumping high above arrow
            const verticalCheck = Math.abs(playerBottom - pipeTop) < 150;
            const playerCenter = this.player.x + this.player.width / 2;
            const pipeCenter = clickedPipe.x + clickedPipe.width / 2;
            const horizontalCheck = Math.abs(playerCenter - pipeCenter) < (clickedPipe.width / 2 + 20); // Relaxed from +10

            if (verticalCheck && horizontalCheck) {
                if (this.gameState === 'OVERWORLD') {
                    this.enterBonusLevel(clickedPipe);
                } else {
                    this.returnToOverworld();
                }
            } else {
                // If clicked but not on top, try to auto-move
                // Only if grounded to avoid weird air-walking, but allow if close enough
                if (this.player.grounded || verticalCheck) {
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
        this.ui.score.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.ui.score.style.transform = 'scale(1)';
        }, 100);
    }

    getDifficultyMultiplier() {
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
            biome: this.currentBiome
        };

        const generated = this.levelGenerator.generateChunk(startX, endX, context);

        this.platforms.push(...generated.platforms);
        this.enemyManager.addEnemies(generated.enemies);

        generated.coins.forEach(data => {
            const coin = this.coinPool.get(data.x, data.y);
            this.coins.push(coin);
        });

        this.questionBlocks.push(...generated.questionBlocks);
        this.pipes.push(...generated.pipes);

        this.lastGeneratedX = endX;
        this.levelWidth = endX;
    }
}
