import { Cape } from './Cape.js';
import { FixedStepLoop } from './FixedStepLoop.js';
import { AdventureCourse } from './AdventureCourse.js';
import { Player } from './Player.js';
import { Background, Biomes } from './Background.js';
import { InputHandler } from './InputHandler.js';
import { checkCollision, isEntityVisible } from './utils.js';
import { LevelGenerator } from './LevelGenerator.js';
import { CollisionSystem } from './CollisionSystem.js';
import { EnemyManager } from './EnemyManager.js';
import { Coin } from './Coin.js';
import { QuestionBlock } from './QuestionBlock.js';
import { Mushroom } from './Mushroom.js';
import { Star } from './Star.js';
import { FireFlower } from './FireFlower.js';
import { Fireball } from './Fireball.js';
import { IceFlower } from './IceFlower.js';
import { Iceball } from './Iceball.js';
import { MegaMushroom } from './MegaMushroom.js';
import { Pipe } from './Pipe.js';
import { Magnet } from './Magnet.js';
import { Lava } from './Lava.js';
import { EnhancedAudioSystem } from './AudioSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ObjectPool } from './ObjectPool.js';
import { Boss, createBoss } from './Boss.js';
import { Cannon } from './Cannon.js';
import { AchievementSystem } from './AchievementSystem.js';
import { OneUpMushroom } from './OneUpMushroom.js';
import { Checkpoint, generateCheckpoints } from './Checkpoint.js';
import { LightingSystem } from './LightingSystem.js';
import { WeatherSystem } from './WeatherSystem.js';
import { Camera } from './Camera.js';
import { BonusLevelGenerator } from './BonusLevelGenerator.js';
import { Tutorial } from './Tutorial.js';
import { CONFIG } from './Config.js';
import { UIManager } from './UIManager.js';
import { TransitionManager } from './TransitionManager.js';
import { unlockLevel, getNextLevelId } from './Levels.js';
import { buildRewardModifiers } from './Rewards.js';
import { idleSave, flushSaves } from './saveHelper.js';

export class Game {
    constructor(canvas, uiElements, assetLoader, levelConfig = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiElements;
        this.assetLoader = assetLoader;
        this.images = assetLoader.images;

        // Level mode: { id, biome, name, ... } from Levels.js, or null for Endless Mode
        this.levelConfig = levelConfig;
        this.levelMode = !!levelConfig;
        this.levelCleared = false;

        this.width = 800;
        this.height = 400;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.dpr = Math.min(2, window.devicePixelRatio || 1);
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

        // Screen shake effect
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;

        this.score = 0;
        this.highScore = this.loadHighScore();
        this.totalCoins = this.loadTotalCoins(); // Persistent total coins
        this.sessionCoins = 0; // Coins collected this session
        this.gameRunning = false;
        this.isNewHighScore = false;
        this.isGameOverSequence = false;
        this.isPaused = false;
        this.isMuted = false;
        this.timers = [];
        this.loop = new FixedStepLoop(() => this.update(), () => this.draw(), () => this.gameRunning && !this.isPaused);

        this.scorePopups = [];
        this.scorePopupPool = new ObjectPool(
            () => ({ x: 0, y: 0, value: 0, life: 0, velocity: 0, isCritical: false }),
            (p, x, y, value, isCritical = false) => {
                p.x = x; p.y = y; p.value = value;
                p.life = 60; p.velocity = -2; p.isCritical = isCritical;
            }
        );

        this.coinPool = new ObjectPool(
            () => new Coin(0, 0),
            (c, x, y) => c.reset(x, y)
        );

        this.fireballPool = new ObjectPool(
            () => new Fireball(0, 0, 1),
            (f, x, y, direction) => f.reset(x, y, direction)
        );

        this.iceballPool = new ObjectPool(
            () => new Iceball(0, 0, 1),
            (i, x, y, direction) => i.reset(x, y, direction)
        );

        // Power-up pools (v2.30.1) — block hits get from pool, pickup releases back
        this.mushroomPool = new ObjectPool(() => new Mushroom(0, 0), (o, x, y) => o.reset(x, y));
        this.starPool = new ObjectPool(() => new Star(0, 0), (o, x, y) => o.reset(x, y));
        this.fireFlowerPool = new ObjectPool(() => new FireFlower(0, 0), (o, x, y) => o.reset(x, y));
        this.iceFlowerPool = new ObjectPool(() => new IceFlower(0, 0), (o, x, y) => o.reset(x, y));
        this.capePool = new ObjectPool(() => new Cape(0, 0), (o, x, y) => o.reset(x, y));
        this.magnetPool = new ObjectPool(() => new Magnet(0, 0), (o, x, y) => o.reset(x, y));
        this.megaMushroomPool = new ObjectPool(() => new MegaMushroom(0, 0), (o, x, y) => o.reset(x, y));
        this.oneUpMushroomPool = new ObjectPool(() => new OneUpMushroom(0, 0), (o, x, y) => o.reset(x, y));

        this.particleSystem = new ParticleSystem();
        this.lightingSystem = new LightingSystem(this);
        this.weatherSystem = new WeatherSystem(this);
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.freezeFrames = 0;
        this.deathFlashTimer = 0;

        // FPS Tracking for performance monitoring
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.showFps = false; // Hidden by default (set to true for debugging)

        this.audioSystem = new EnhancedAudioSystem();
        this.isMuted = this.audioSystem.isMuted;
        this.currentBGMMode = null;

        this.input = new InputHandler(() => this.onJump(), () => this.gameRunning && !this.isPaused && !this.levelCleared);
        this.input.attachCanvas(canvas, this.width);
        this.input.attachControls(uiElements.leftBtn, uiElements.rightBtn, uiElements.jumpBtn, document.getElementById('downButton'), document.getElementById('sprintButton'));

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

        // Life System
        this.lives = 3;
        this.maxLives = 99;
        this.lastCheckpointX = 0;
        this.checkpoints = [];
        this.isProcessingDeath = false; // Flag to prevent multiple loseLife calls
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
        this.capes = [];

        this.ui.restartBtn.addEventListener('click', () => this.restart());

        this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        this.ui.score.textContent = `⭐ 0`;

        this.handleAnyKeyRestart = this.handleAnyKeyRestart.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: false });

        this.achievementSystem = new AchievementSystem(this);

        // Phase 3 Systems
        this.uiManager = new UIManager(this);
        this.transitionManager = new TransitionManager(this);

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
        this.isProcessingDeath = false; // Reset death flag for new game
        this.isNewHighScore = false;
        this.isPaused = false;
        this.ui.score.textContent = `⭐ ${this.score}`;
        this.ui.gameOverOverlay.style.display = 'none';
        this.ui.pauseOverlay.style.display = 'none';
        this.gameLoop();
    }

    triggerFreeze(frames) {
        this.freezeFrames = frames;
    }

    /**
     * Show a hint only the first time a player picks up a given power-up type.
     * Persisted in localStorage so it never repeats — call freely from CollisionSystem.
     * @param {string} type - power-up identifier (e.g. 'cape', 'fire', 'ice', 'star', 'mega')
     * @param {string} text - hint message to display
     */
    firstTimePickupHint(type, text) {
        // Always track the pickup for achievements (regardless of first-time state)
        if (this.achievementSystem) this.achievementSystem.trackPowerUp();

        const key = `marioPowerUpSeen_${type}`;
        try {
            if (localStorage.getItem(key)) return;
            localStorage.setItem(key, '1');
        } catch (e) { /* storage blocked → just show the hint anyway */ }
        this.showPowerUpHint(text);
    }

    /**
     * Show a power-up hint message on screen
     * @param {string} text - Hint message to display
     */
    showPowerUpHint(text) {
        this.powerUpHint = {
            text: text,
            timer: 180, // 3 seconds at 60fps
            alpha: 1.0
        };
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

    /**
     * Trigger screen shake effect
     * @param {number} intensity - Shake amplitude in pixels (default 5)
     * @param {number} duration - Shake duration in frames (default 15)
     */
    shake(intensity = 5, duration = 15) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    /**
     * Update screen shake effect
     */
    updateShake() {
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
        }
    }

    /**
     * Get current shake offset for rendering
     */
    getShakeOffset() {
        if (this.shakeTimer > 0) {
            const progress = this.shakeTimer / this.shakeDuration;
            const intensity = this.shakeIntensity * progress;
            return {
                x: (Math.random() - 0.5) * 2 * intensity,
                y: (Math.random() - 0.5) * 2 * intensity
            };
        }
        return { x: 0, y: 0 };
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
        this.loop.stop();
        this.timers = [];
        this.input.reset();
        if (this.savedState) this.unloadBonusLevel();
        this.gameState = 'OVERWORLD';
        this.savedState = null;
        this.sessionCoins = 0;
        this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        this.simulationTicks = 0;
        this.achievementSystem._coinTimestamps = [];
        this.achievementSystem.trackLanding();
        this.lastCleanedX = 0;
        this.isProcessingDeath = false;
        this.isGameOverSequence = false;
        this.freezeFrames = 0;
        this.deathFlashTimer = 0;
        this.powerUpHint = null;
        this.transitionManager.cancel();
        this.course = this.levelConfig?.mode === 'trail' ? new AdventureCourse(this, this.levelConfig) : null;
        this.player = new Player(this, 50, this.GROUND_Y, this.images.player);
        this.player.setGroundY(this.GROUND_Y);

        // Initialize Tutorial System
        this.tutorial = new Tutorial(this);

        this.platforms = [];
        this.enemyManager.reset();
        if (this.coins) this.coins.forEach(c => this.coinPool.release(c));
        this.coins = [];
        this.questionBlocks = [];
        // Release pooled power-ups before clearing arrays (v2.30.1)
        if (this.mushrooms) this.mushrooms.forEach(o => this.mushroomPool.release(o));
        if (this.stars) this.stars.forEach(o => this.starPool.release(o));
        if (this.fireflowers) this.fireflowers.forEach(o => this.fireFlowerPool.release(o));
        if (this.iceflowers) this.iceflowers.forEach(o => this.iceFlowerPool.release(o));
        if (this.magnets) this.magnets.forEach(o => this.magnetPool.release(o));
        if (this.megaMushrooms) this.megaMushrooms.forEach(o => this.megaMushroomPool.release(o));
        if (this.oneUpMushrooms) this.oneUpMushrooms.forEach(o => this.oneUpMushroomPool.release(o));
        if (this.capes) this.capes.forEach(o => this.capePool.release(o));
        this.mushrooms = [];
        this.stars = [];
        this.fireflowers = [];
        this.iceflowers = [];
        if (this.fireballs) this.fireballs.forEach(f => this.fireballPool.release(f));
        this.fireballs = [];
        if (this.iceballs) this.iceballs.forEach(i => this.iceballPool.release(i));
        this.iceballs = [];
        this.magnets = [];
        this.megaMushrooms = [];
        this.pipes = [];
        this.lava = [];
        this.cannons = [];
        this.oneUpMushrooms = [];
        this.capes = [];
        this.checkpoints = [];
        this.lives = 3;
        this.lastCheckpointX = 0;
        if (this.levelMode && this.levelConfig && Biomes[this.levelConfig.biome]) {
            this.currentBiome = this.levelConfig.biome;
        } else {
            const biomeKeys = Object.keys(Biomes);
            this.currentBiome = biomeKeys[Math.floor(Math.random() * biomeKeys.length)];
        }
        this.background.setBiome(this.currentBiome);
        this.levelCleared = false;
        this._levelClearedDispatched = false;
        this._diedThisRun = false;
        // Reset boss trigger to default distance for fresh level/restart
        this.bossTriggerDistance = 5000;
        this.boss = null;
        this.bossBattleActive = false;
        this.biomeDistance = 0;
        this.lastGeneratedX = 0;
        if (this.course) this.course.build();
        else this.generateChunk(0, this.CHUNK_SIZE * 2);
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        this.lastTime = 0;
        this.gameRunning = true;
        this.isPaused = false;
        // v2.31.0 — apply achievement-unlocked rewards
        this.rewards = buildRewardModifiers(this.achievementSystem);
        this.score = this.rewards.startingScoreBonus || 0;
        if (this.player) {
            // Apply glide-speed reward (multiplier <= 1 → slower fall)
            this.player.glideFallSpeed = 1.5 * this.rewards.glideFallSpeedMultiplier;
        }
        this.isNewHighScore = false;
        this.camera = { x: 0, y: 0 };
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        if (this.scorePopups) this.scorePopups.forEach(p => this.scorePopupPool.release(p));
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
        idleSave('marioHighScore', this.highScore.toString());
    }

    loadTotalCoins() {
        try {
            return parseInt(localStorage.getItem('marioTotalCoins')) || 0;
        } catch (e) {
            return 0;
        }
    }

    saveTotalCoins() {
        idleSave('marioTotalCoins', this.totalCoins.toString());
    }

    /**
     * Save game progress to localStorage
     * Includes: current level distance, biome, lives, unlocked levels, stats
     */
    saveProgress() {
        const progress = {
            version: '2.17.0',
            timestamp: Date.now(),
            highScore: this.highScore,
            totalCoins: this.totalCoins,
            lives: this.lives,
            currentBiome: this.currentBiome,
            lastCheckpointX: this.lastCheckpointX,
            maxDistanceReached: Math.max(this.player?.x || 0, this.maxDistanceReached || 0),
            unlockedBiomes: this.unlockedBiomes || ['PLAINS'],
            bossesDefeated: this.bossesDefeated || 0,
            achievementStats: this.achievementSystem?.stats || {}
        };
        idleSave('marioProgress', progress);
    }

    /**
     * Load game progress from localStorage
     * @returns {Object|null} Saved progress or null if none exists
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('marioProgress');
            if (saved) {
                const progress = JSON.parse(saved);
                console.log('Progress loaded:', progress);
                return progress;
            }
        } catch (e) {
            console.warn('Could not load progress:', e);
        }
        return null;
    }

    /**
     * Apply loaded progress to game state
     * @param {Object} progress - Progress object from loadProgress()
     */
    applyProgress(progress) {
        if (!progress) return;

        // Apply saved values
        if (progress.highScore) this.highScore = progress.highScore;
        if (progress.totalCoins) this.totalCoins = progress.totalCoins;
        if (progress.lives) this.lives = Math.min(progress.lives, this.maxLives);
        if (progress.unlockedBiomes) this.unlockedBiomes = progress.unlockedBiomes;
        if (progress.bossesDefeated) this.bossesDefeated = progress.bossesDefeated;
        if (progress.maxDistanceReached) this.maxDistanceReached = progress.maxDistanceReached;

        // Update UI
        this.ui.highScore.textContent = `🏆 ${this.highScore}`;
    }

    /**
     * Clear saved progress (for new game)
     */
    clearProgress() {
        try {
            localStorage.removeItem('marioProgress');
            this.unlockedBiomes = ['PLAINS'];
            this.bossesDefeated = 0;
            this.maxDistanceReached = 0;
            console.log('Progress cleared');
        } catch (e) {
            console.warn('Could not clear progress:', e);
        }
    }

    onJump() {
        this.initAudio();
        if (!this.gameRunning || this.isPaused) return;
        if (this.player && !this.player.isDead && !this.player.isEnteringPipe && !this.player.isExitingPipe && this.player.jump()) {
            this.player.setState(2);
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

    shootIceball() {
        if (!this.gameRunning || !this.player || !this.player.icePower) return;
        const x = this.player.direction === 1 ? this.player.x + this.player.width : this.player.x;
        const y = this.player.y + 10;
        const iceball = this.iceballPool.get(x, y, this.player.direction);
        this.iceballs.push(iceball);
        this.playSound('iceball'); // Dedicated ice sound
    }

    update() {
        if (!this.gameRunning || this.isPaused || !this.player) return;
        this.simulationTicks++;
        if (this.course && !this.course.finished) this.course.ticks++;
        this.advanceTimers();
        if (!this.gameRunning || this.isPaused) return;
        this.lightingSystem.update();
        this.weatherSystem.update();
        this.achievementSystem.update();
        if (this.powerUpHint?.timer > 0) this.powerUpHint.timer--;

        // Update Tutorial System
        if (this.tutorial && !this.tutorial.isCompleted()) {
            this.tutorial.update();
        }

        // Update scene transitions
        if (this.transitionManager.update()) {
            // If transition is active, skip most game logic
            return;
        }

        // Prevent bonus level entry during boss battle or death
        if (this.gameState === 'OVERWORLD' && !this.bossBattleActive && !this.player.isEnteringPipe && !this.player.isExitingPipe && !this.player.isDead && !this.isProcessingDeath) {
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
            if (this.isPaused) return;
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
        } else if (this.player.icePower) {
            this.autoFireTimer++;
            if (this.autoFireTimer > 50) { // Slightly slower than fire
                this.shootIceball();
                this.autoFireTimer = 0;
            }
        } else {
            this.autoFireTimer = 0;
        }

        if (this.player.isDead) {
            // Continue death animation
            this.player.update(this.input, this.platforms, this.width, this.camera);
            // loseLife() is called via setTimeout in gameOver()
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

        this.course?.beforePlayerUpdate();
        this.player.update(this.input, this.platforms, this.levelWidth, this.camera);

        if (this.player.grounded && Math.abs(this.player.velX) > 0.5) {
            this.createDustParticle(this.player.x + this.player.width / 2, this.player.y + this.player.height);
        }

        let targetCamX = this.player.x - this.width / 2 + this.player.width / 2;
        if (targetCamX < 0) targetCamX = 0;
        this.camera.x = targetCamX;

        this.enemyManager.update(this.levelWidth, this.player);
        this.questionBlocks.forEach(block => block.update());

        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.velocity;
            popup.life--;
            if (popup.life <= 0) {
                this.scorePopupPool.release(popup);
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

        // Update ice balls and check enemy collision
        for (let i = this.iceballs.length - 1; i >= 0; i--) {
            const iceball = this.iceballs[i];
            iceball.update(this.platforms, this.GROUND_Y);
            if (!iceball.active) {
                this.iceballPool.release(iceball);
                this.iceballs.splice(i, 1);
                continue;
            }

            // Check collision with enemies
            for (const enemy of this.enemies) {
                if (!enemy.frozen && checkCollision(iceball, enemy)) {
                    iceball.freezeEnemy(enemy);
                    // v2.31.0 reward: FREEZE_MASTER → +30% freeze duration
                    if (this.rewards && this.rewards.freezeDurationMultiplier !== 1) {
                        enemy.frozenTimer = Math.floor(enemy.frozenTimer * this.rewards.freezeDurationMultiplier);
                    }
                    if (this.achievementSystem) this.achievementSystem.trackFreeze();
                    this.addParticles(enemy.x + enemy.width / 2, enemy.y, 8, '#00BFFF');
                    this.addScorePopup(enemy.x, enemy.y, 100);
                    this.score += 100;
                    this.updateScore();
                    this.playSound('freeze');
                    iceball.active = false;
                    break;
                }
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

        // Update ice flowers
        for (let i = this.iceflowers.length - 1; i >= 0; i--) {
            const flower = this.iceflowers[i];
            flower.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (flower.collected) {
                this.iceflowers.splice(i, 1);
                continue;
            }
        }

        // Update capes
        for (let i = this.capes.length - 1; i >= 0; i--) {
            const cape = this.capes[i];
            cape.update(this.platforms, this.GROUND_Y, this.levelWidth);
            if (cape.collected) {
                this.capes.splice(i, 1);
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

        // Update Cannons
        this.cannons.forEach(cannon => {
            cannon.update(this.player, this.width, this.camera.x);
        });

        // Check HammerBro hammer collisions and BulletBill collisions
        this.checkProjectileCollisions();

        this.collisionSystem.update();
        if (this.player.grounded) this.achievementSystem.trackLanding();
        this.course?.update();
        if (this.isPaused) return;

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
        if (!this.player.isEnteringPipe && !this.player.isExitingPipe && this.player.grounded && (this.input.keys['ArrowDown'] || this.input.keys['KeyS'])) {
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

        if (!this.course && this.gameState === 'OVERWORLD' && this.camera.x + this.width + this.renderDistance > this.lastGeneratedX) {
            const nextChunkEnd = this.lastGeneratedX + this.CHUNK_SIZE;
            this.generateChunk(this.lastGeneratedX, nextChunkEnd);
        }

        if (!this.course && this.gameState === 'OVERWORLD' && this.camera.x - this.cleanupMargin > this.lastCleanedX) {
            this.cleanupObjects(this.camera.x - this.cleanupMargin);
            this.lastCleanedX = this.camera.x - this.cleanupMargin;
        }

        // Update checkpoints
        for (const checkpoint of this.checkpoints) {
            checkpoint.update();
        }

        // Update 1UP mushrooms
        for (const oneUp of this.oneUpMushrooms) {
            oneUp.update(this.platforms, this.GROUND_Y);
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
        this.levelWidth = Math.max(this.levelWidth, arena.endX);
        this.boss = createBoss(this.currentBiome, arenaStart + 800, this.GROUND_Y - 100, this.getDifficultyMultiplier());
        this.renderDistance = 0;
    }

    updateBossBattle() {
        if (!this.boss) return;

        // If player is dead or in death sequence, don't update boss battle normally
        // But DO NOT lock the camera - allow respawn to work
        if (this.player.isDead || this.isGameOverSequence || this.isProcessingDeath) {
            // Still update boss for visual continuity, but don't lock camera
            this.boss.update(this.player, this.platforms, this.width);
            return;
        }

        this.boss.update(this.player, this.platforms, this.width);
        if (!this.boss.alive && this.boss.y > this.height + 200) {
            this.bossBattleActive = false;
            this.boss = null;
            this.gameState = 'OVERWORLD';
            if (this.levelMode && this.levelCleared && !this._levelClearedDispatched) {
                this._levelClearedDispatched = true;
                this.canvas.dispatchEvent(new CustomEvent('marioLevelCleared', {
                    detail: {
                        current: this.levelConfig.id,
                        next: getNextLevelId(this.levelConfig.id),
                        score: this.score
                    }
                }));
                this.pause();
                this.ui.pauseOverlay.style.display = 'none';
            }
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

        // Stop all boss interactions if player is dead
        if (this.player.isDead || this.isGameOverSequence || this.isProcessingDeath) return;

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
                    // Use player.hit() and properly handle death
                    const result = this.player.hit();
                    if (result === 'dead') {
                        this.triggerDeathEffect();
                        this.gameOver();
                        return; // Stop processing
                    } else if (result === 'shrink') {
                        this.triggerScreenShake(5);
                        this.triggerFreeze(20);
                        this.playSound('shrink');
                    }
                }
            }
        }

        // Also stop fireball damage if player is dead
        if (this.player.isDead) return;

        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            if (checkCollision(fb, this.boss)) {
                this.boss.takeDamage();
                this.fireballPool.release(fb);
                this.fireballs.splice(i, 1);
                this.addParticles(fb.x, fb.y, 5, '#FF4500');
                if (!this.boss.alive) {
                    this.handleBossDefeat();
                }
            }
        }
    }

    checkProjectileCollisions() {
        // Check HammerBro hammers
        for (const enemy of this.enemies) {
            if (enemy.type === 'hammerbro' && enemy.hammers) {
                for (let i = enemy.hammers.length - 1; i >= 0; i--) {
                    const hammer = enemy.hammers[i];
                    if (checkCollision(this.player, hammer)) {
                        // Mega Mario destroys hammers
                        if (this.player.isMega) {
                            this.addParticles(hammer.x, hammer.y, 5, '#8B4513');
                            enemy.hammers.splice(i, 1);
                            continue;
                        }
                        // Star invincibility destroys hammers
                        if (this.player.starPower) {
                            this.addParticles(hammer.x, hammer.y, 5, '#8B4513');
                            enemy.hammers.splice(i, 1);
                            continue;
                        }
                        // Player takes damage
                        if (!this.player.invincible) {
                            const result = this.player.hit();
                            if (result === 'dead') {
                                this.triggerDeathEffect();
                                this.gameOver();
                            } else if (result === 'shrink') {
                                this.triggerScreenShake(5);
                                this.triggerFreeze(20);
                                this.playSound('shrink');
                            }
                            enemy.hammers.splice(i, 1);
                        }
                    }
                }
            }
        }

        // Check Cannon BulletBills
        for (const cannon of this.cannons) {
            const bulletHitboxes = cannon.getBulletHitboxes(this.camera.x, this.width);
            for (const hitbox of bulletHitboxes) {
                if (checkCollision(this.player, hitbox)) {
                    // Mega Mario destroys bullets
                    if (this.player.isMega) {
                        this.addParticles(hitbox.x, hitbox.y, 8, '#1a1a1a');
                        this.addScorePopup(hitbox.x, hitbox.y, 100);
                        this.score += 100;
                        this.updateScore();
                        hitbox.bullet.alive = false;
                        continue;
                    }
                    // Star power destroys bullets
                    if (this.player.starPower) {
                        this.addParticles(hitbox.x, hitbox.y, 8, '#1a1a1a');
                        this.addScorePopup(hitbox.x, hitbox.y, 100);
                        this.score += 100;
                        this.updateScore();
                        hitbox.bullet.alive = false;
                        continue;
                    }
                    // Player jumping on top kills bullet
                    if (this.player.velY > 0 && this.player.y + this.player.height < hitbox.y + hitbox.height / 2) {
                        this.addParticles(hitbox.x, hitbox.y, 8, '#1a1a1a');
                        this.addScorePopup(hitbox.x, hitbox.y, 200);
                        this.score += 200;
                        this.updateScore();
                        this.player.velY = -10;
                        this.playSound('stomp');
                        hitbox.bullet.alive = false;
                        continue;
                    }
                    // Player takes damage
                    if (!this.player.invincible) {
                        const result = this.player.hit();
                        if (result === 'dead') {
                            this.triggerDeathEffect();
                            this.gameOver();
                        } else if (result === 'shrink') {
                            this.triggerScreenShake(5);
                            this.triggerFreeze(20);
                            this.playSound('shrink');
                        }
                    }
                }
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
        this.achievementSystem.trackBossKill();

        if (this.levelMode && this.levelConfig && !this.levelCleared) {
            // Level Mode: first boss defeat = level cleared. Don't queue more bosses.
            this.levelCleared = true;
            const nextId = getNextLevelId(this.levelConfig.id);
            unlockLevel(this.levelConfig.id);  // Mark current as cleared/replayable
            if (nextId) unlockLevel(nextId);   // Unlock the next level
            this.onLevelCleared = { current: this.levelConfig.id, next: nextId };
            // Track for achievements (worldsCleared / noDeathRuns)
            const noDeath = !this._diedThisRun;
            if (this.achievementSystem) this.achievementSystem.trackWorldClear(noDeath, this.levelConfig.id);
        } else {
            // Endless Mode: queue another boss further ahead
            this.bossTriggerDistance = this.player.x + 5000;
        }
    }

    addScorePopup(x, y, value, isCritical = false) {
        this.scorePopups.push(this.scorePopupPool.get(x, y, value, isCritical));
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

        this.course?.draw(this.ctx, this.camera);
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

        // Draw Cannons and their bullets
        this.cannons.forEach(cannon => {
            // Always draw bullets regardless of cannon visibility
            // This is because bullets can travel far from the cannon
            cannon.bullets.forEach(bullet => {
                if (bullet.alive) {
                    bullet.draw(this.ctx, this.camera);
                }
            });

            // Only draw cannon itself if visible
            if (isEntityVisible(cannon, this.camera, this.width, this.height)) {
                // Draw cannon (without bullets, since we already drew them)
                this.ctx.save();
                const drawX = cannon.x - this.camera.x + cannon.width / 2;
                const drawY = cannon.y + cannon.height / 2;
                this.ctx.translate(drawX, drawY);

                if (cannon.firingAnimation > 0) {
                    this.ctx.translate((Math.random() - 0.5) * 4, 0);
                }

                // Base
                this.ctx.fillStyle = '#2d2d2d';
                this.ctx.fillRect(-25, 10, 50, 25);

                // Cannon body
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.beginPath();
                this.ctx.ellipse(0, -5, 22, 18, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Cannon opening
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.beginPath();
                this.ctx.ellipse(0, -5, 14, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Skull
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(0, -5, 8, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(-3, -6, 2, 0, Math.PI * 2);
                this.ctx.arc(3, -6, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillRect(-4, -2, 8, 3);

                this.ctx.restore();
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

        // Draw 1UP Mushrooms
        this.oneUpMushrooms.forEach(m => {
            if (isEntityVisible(m, this.camera, this.width, this.height)) {
                m.draw(this.ctx, this.camera);
            }
        });

        // Draw Checkpoints
        this.checkpoints.forEach(cp => {
            if (isEntityVisible(cp, this.camera, this.width, this.height)) {
                cp.draw(this.ctx, this.camera);
            }
        });

        // Draw Capes
        this.capes.forEach(cape => {
            if (isEntityVisible(cape, this.camera, this.width, this.height)) {
                cape.draw(this.ctx, this.camera);
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
            // Boss health bar is now drawn by UIManager
        }

        if (this.player && !isAnimatingPipe) {
            this.player.draw(this.ctx, this.camera);
        }

        // Draw fireballs and iceballs
        for (const fb of this.fireballs) {
            if (isEntityVisible(fb, this.camera, this.width, this.height)) {
                fb.draw(this.ctx, this.camera);
            }
        }
        for (const ib of this.iceballs) {
            if (isEntityVisible(ib, this.camera, this.width, this.height)) {
                ib.draw(this.ctx, this.camera);
            }
        }

        // Draw power-up flowers
        for (const ff of this.fireflowers) {
            if (isEntityVisible(ff, this.camera, this.width, this.height)) {
                ff.draw(this.ctx, this.camera);
            }
        }
        for (const ice of this.iceflowers) {
            if (isEntityVisible(ice, this.camera, this.width, this.height)) {
                ice.draw(this.ctx, this.camera);
            }
        }

        // Score popups: update happens once in update() loop (was duplicated here pre-v2.30.0).
        // UIManager draws them; we no longer mutate them in draw().

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

        // Lighting effects (draw before particles for proper layering)
        this.lightingSystem.draw(this.ctx, this.camera);

        this.particleSystem.draw(this.ctx, this.camera);

        // Draw achievement notifications (always on top)
        this.achievementSystem.draw(this.ctx, this.width);

        // Weather effects (draw on top of everything except UI)
        this.weatherSystem.draw(this.ctx, this.camera);

        // Draw UI elements via UIManager (Phase 3)
        this.uiManager.draw();

        // Draw Power-Up Hint (e.g., Cape glide instructions)
        if (this.powerUpHint && this.powerUpHint.timer > 0) {
            this.powerUpHint.alpha = Math.min(1, this.powerUpHint.timer / 30); // Fade out

            this.ctx.save();
            this.ctx.globalAlpha = this.powerUpHint.alpha;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(this.powerUpHint.text, this.width / 2, 100);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(this.powerUpHint.text, this.width / 2, 100);
            this.ctx.restore();
        }

        // Draw Tutorial Overlay (on top of everything)
        if (this.tutorial && !this.tutorial.isCompleted()) {
            this.tutorial.draw(this.ctx, this.width, this.height);
        }

        // Draw scene transition overlay (topmost layer)
        this.transitionManager.draw();

        this.course?.drawHUD(this.ctx);

        // FPS Counter and Performance Monitor
        if (this.showFps) {
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastFpsUpdate >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }

            // Draw FPS (color-coded: green=good, yellow=ok, red=bad)
            let fpsColor = '#00ff00';
            if (this.fps < 30) fpsColor = '#ff0000';
            else if (this.fps < 50) fpsColor = '#ffff00';

            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(this.width - 95, 5, 90, 50);
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = fpsColor;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`FPS: ${this.fps}`, this.width - 10, 22);

            // Object count
            const objCount = this.enemies.length + this.coins.length +
                this.particleSystem.activeParticles.length +
                this.weatherSystem.particles.length;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`OBJ: ${objCount}`, this.width - 10, 38);
            this.ctx.fillText(`P: ${this.particleSystem.activeParticles.length}`, this.width - 10, 50);
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

        // Offscreen cleanup of power-ups: release back to pool (v2.30.1)
        for (let i = this.mushrooms.length - 1; i >= 0; i--) {
            const m = this.mushrooms[i];
            if (m.x + m.width < minX) {
                this.mushroomPool.release(m);
                this.mushrooms.splice(i, 1);
            }
        }

        for (let i = this.stars.length - 1; i >= 0; i--) {
            const s = this.stars[i];
            if (s.x + s.width < minX) {
                this.starPool.release(s);
                this.stars.splice(i, 1);
            }
        }

        for (let i = this.fireflowers.length - 1; i >= 0; i--) {
            const f = this.fireflowers[i];
            if (f.x + f.width < minX) {
                this.fireFlowerPool.release(f);
                this.fireflowers.splice(i, 1);
            }
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            if (this.pipes[i].x + this.pipes[i].width < minX) {
                this.pipes.splice(i, 1);
            }
        }

        for (let i = this.iceflowers.length - 1; i >= 0; i--) {
            const f = this.iceflowers[i];
            if (f.x + f.width < minX) {
                this.iceFlowerPool.release(f);
                this.iceflowers.splice(i, 1);
            }
        }

        for (let i = this.magnets.length - 1; i >= 0; i--) {
            const m = this.magnets[i];
            if (m.x + m.width < minX) {
                this.magnetPool.release(m);
                this.magnets.splice(i, 1);
            }
        }

        for (let i = this.megaMushrooms.length - 1; i >= 0; i--) {
            const m = this.megaMushrooms[i];
            if (m.x + m.width < minX) {
                this.megaMushroomPool.release(m);
                this.megaMushrooms.splice(i, 1);
            }
        }

        for (let i = this.oneUpMushrooms.length - 1; i >= 0; i--) {
            const m = this.oneUpMushrooms[i];
            if (m.x + m.width < minX) {
                this.oneUpMushroomPool.release(m);
                this.oneUpMushrooms.splice(i, 1);
            }
        }

        for (let i = this.capes.length - 1; i >= 0; i--) {
            const c = this.capes[i];
            if (c.x + c.width < minX) {
                this.capePool.release(c);
                this.capes.splice(i, 1);
            }
        }

        for (let i = this.cannons.length - 1; i >= 0; i--) {
            if (this.cannons[i].x + this.cannons[i].width < minX) {
                this.cannons.splice(i, 1);
            }
        }

        for (let i = this.checkpoints.length - 1; i >= 0; i--) {
            if (this.checkpoints[i].x + this.checkpoints[i].width < minX) {
                this.checkpoints.splice(i, 1);
            }
        }

        // Clean up projectiles
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            if (this.fireballs[i].x < minX || !this.fireballs[i].active) {
                this.fireballPool.release(this.fireballs[i]);
                this.fireballs.splice(i, 1);
            }
        }

        for (let i = this.iceballs.length - 1; i >= 0; i--) {
            if (this.iceballs[i].x < minX || !this.iceballs[i].active) {
                this.iceballPool.release(this.iceballs[i]);
                this.iceballs.splice(i, 1);
            }
        }

        // Clean up particles behind camera
        this.particleSystem.cleanup(minX);
    }

    enterBonusLevel(pipe) {
        if (this.gameState !== 'OVERWORLD') return;

        this.playSound('pipe');

        pipe.used = true;

        this.player.autoMovePipe = pipe;
        this.player.enterPipe();
        this.achievementSystem.trackBonusLevel();
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
                blocks: [...this.questionBlocks],
                ...Object.fromEntries(['mushrooms', 'stars', 'fireflowers', 'iceflowers', 'fireballs', 'iceballs', 'magnets', 'megaMushrooms', 'oneUpMushrooms', 'capes', 'cannons', 'lava', 'checkpoints'].map(key => [key, this[key]]))
            }
        };
    }

    loadBonusLevel() {
        this.gameState = 'BONUS';

        for (const key of ['mushrooms', 'stars', 'fireflowers', 'iceflowers', 'fireballs', 'iceballs', 'magnets', 'megaMushrooms', 'oneUpMushrooms', 'capes', 'cannons', 'lava', 'checkpoints']) this[key] = [];
        this.platforms = [];
        this.coins = [];
        this.enemyManager.enemies = []; // Detach saved overworld enemies without returning them to pools.
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

        // Use the new bonus level generator
        const generator = new BonusLevelGenerator(roomWidth, this.height, groundY, this.coinPool);
        const generated = generator.generate();

        this.bonusBgColor = generated.bgColor;
        this.platforms = generated.platforms;
        this.coins = generated.coins;

        // Add exit pipe
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
        const leavingBonus = this.gameState === 'BONUS';
        this.gameState = 'OVERWORLD';

        if (this.savedState) {
            const pools = { coins: 'coinPool', mushrooms: 'mushroomPool', stars: 'starPool', fireflowers: 'fireFlowerPool', iceflowers: 'iceFlowerPool', fireballs: 'fireballPool', iceballs: 'iceballPool', magnets: 'magnetPool', megaMushrooms: 'megaMushroomPool', oneUpMushrooms: 'oneUpMushroomPool', capes: 'capePool' };
            for (const [key, pool] of Object.entries(pools)) {
                if (leavingBonus) this[key].forEach(item => this[pool].release(item));
            }
            this.enemyManager.reset();
            this.enemyManager.enemies = this.savedState.entities.enemies;
            for (const key of ['mushrooms', 'stars', 'fireflowers', 'iceflowers', 'fireballs', 'iceballs', 'magnets', 'megaMushrooms', 'oneUpMushrooms', 'capes', 'cannons', 'lava', 'checkpoints']) this[key] = this.savedState.entities[key];
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
        this.collisionSystem.rebuildSpatialGrid();
    }

    gameLoop() { this.loop.start(); }

    schedule(callback, milliseconds) {
        this.timers.push({ callback, ticks: Math.ceil(milliseconds * 60 / 1000) });
    }

    advanceTimers() {
        const due = [];
        this.timers = this.timers.filter(timer => {
            if (--timer.ticks <= 0) { due.push(timer.callback); return false; }
            return true;
        });
        due.forEach(callback => callback());
    }

    stop() {
        this.gameRunning = false;
        this.isPaused = false;
        this.loop.stop();
        this.timers = [];
        this.input.reset();
        this.stopBGM();
        this.achievementSystem.save();
        flushSaves();
    }

    pause() {
        if (!this.gameRunning || this.isPaused) return;
        this.isPaused = true;
        this.loop.stop();
        this.input.reset();
        this.canvas.dispatchEvent(new CustomEvent('marioPaused'));
        this.ui.pauseOverlay.style.display = 'flex';
        this.stopBGM();
        // v2.32.0: persist achievement stats on pause (was only saved on unlock)
        if (this.achievementSystem) this.achievementSystem.save();
        flushSaves();
    }

    resume() {
        if (!this.isPaused || this.levelCleared) return;
        this.isPaused = false;
        document.activeElement?.blur();
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
        if (this.isProcessingDeath) return; // Prevent double calls

        this.isProcessingDeath = true;
        this.player.die();
        this.screenShake.intensity = 8; // Screen shake on death
        this.stopBGM();
        this.playSound('death');

        this.isGameOverSequence = true;

        // Wait for death animation, then process life loss
        this.schedule(() => {
            this.loseLife();
        }, 2000);
    }

    loseLife() {
        // Mark this run as having a death (for "no_death_run" achievement)
        this._diedThisRun = true;
        if (this.lives > 0) {
            this.lives--;
            // Show lives remaining briefly then respawn or game over
            if (this.lives > 0) {
                this.showLivesScreen();
                this.schedule(() => {
                    this.respawn();
                }, 1500);
            } else {
                // No lives left - real game over
                this.schedule(() => {
                    this.showGameOverScreen();
                }, 500);
            }
        } else {
            // Already at 0 lives
            this.showGameOverScreen();
        }
    }

    respawn() {
        if (this.gameState === 'BONUS') this.unloadBonusLevel();
        // Reset player at checkpoint or nearby death location
        // If we have a checkpoint, use it. Otherwise respawn near where they were.
        let respawnX;

        // If dying during boss battle, respawn before boss arena
        if (this.bossBattleActive || this.gameState === 'BOSS_BATTLE') {
            // Reset boss battle state so player can retry
            this.bossBattleActive = false;
            this.boss = null;
            this.gameState = 'OVERWORLD';
            this.renderDistance = 2000; // Restore normal render distance

            // Respawn before the boss arena
            if (this.bossArenaStartX > 0) {
                respawnX = Math.max(this.lastCheckpointX, this.bossArenaStartX - 500);
            } else if (this.lastCheckpointX > 0) {
                respawnX = this.lastCheckpointX;
            } else {
                respawnX = Math.max(50, this.camera.x - 200);
            }

            // Reset boss trigger distance so boss can spawn again
            this.bossTriggerDistance = respawnX + 2000;
        } else if (this.lastCheckpointX > 0) {
            respawnX = this.lastCheckpointX;
        } else {
            // Respawn a bit behind the death location but keep progress
            respawnX = Math.max(50, this.camera.x + 100);
        }

        this.player = new Player(this, respawnX, this.GROUND_Y - 50, this.images.player);
        this.player.setGroundY(this.GROUND_Y);
        this.player.glideFallSpeed = 1.5 * (this.rewards?.glideFallSpeedMultiplier || 1);
        this.player.x = respawnX;
        this.player.y = this.GROUND_Y - this.player.height;
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.isDead = false;
        this.player.grounded = true;
        this.player.setState(0); // Idle
        this.player.width = this.player.baseWidth;
        this.player.height = this.player.baseHeight;

        // Reset power-ups but keep score
        this.player.isPowered = false;
        this.player.powerScale = 1.0;
        this.player.firePower = false;
        this.player.icePower = false;
        this.player.starPower = false;
        this.player.starTimer = 0;
        this.player.isMega = false;
        this.player.megaTimer = 0;
        this.player.magnetPower = false;
        this.player.magnetTimer = 0;
        this.player.invincible = true;
        this.player.invincibleTime = 120; // Brief invincibility

        // Reset camera to follow player
        this.camera.x = Math.max(0, respawnX - 200);

        // Resume game - keep score and progress!
        this.isGameOverSequence = false;
        this.isProcessingDeath = false; // Reset so player can die again
        this.gameRunning = true;
        this.startBGM();

        // Fade in after respawn
        this.transitionManager.fadeIn();
    }

    showLivesScreen() {
        // Brief screen showing lives remaining
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`× ${this.lives}`, this.width / 2 + 30, this.height / 2);

        // Draw Mario icon
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2 - 40, this.height / 2 - 10, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    addLife() {
        if (this.lives < this.maxLives) {
            this.lives++;
            this.updateLivesUI();
            this.playSound('powerup_mushroom');
            this.addScorePopup(this.player.x, this.player.y - 30, '1UP', true);
        }
    }

    updateLivesUI() {
        // Update the UI to show lives
        if (this.ui.score) {
            // We'll add lives display alongside score
        }
    }

    showGameOverScreen() {
        this.gameRunning = false;
        this.isGameOverSequence = false;
        this.isProcessingDeath = false; // Reset death flag for new game
        this.stopBGM();

        // Reset boss battle state completely
        this.bossBattleActive = false;
        this.boss = null;
        this.gameState = 'OVERWORLD';
        this.renderDistance = 2000;

        // Save total coins to localStorage
        this.saveTotalCoins();

        this.ui.gameOverOverlay.style.display = 'flex';
        this.ui.finalScore.textContent = `最終分數: ${this.score}`;

        if (this.isNewHighScore || this.score > this.highScore) {
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

        this.loop.stop();
        this.input.reset();
        this.achievementSystem.save();
        flushSaves();
    }

    restart() {
        document.activeElement?.blur();
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
        // Skip tutorial on click
        if (this.tutorial && !this.tutorial.isCompleted()) {
            this.tutorial.skip();
            return;
        }

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

        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;

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
        this.achievementSystem?.trackHighScore(this.score);
        this.collisionSystem.checkNewHighScore();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.ui.highScore.textContent = `🏆 ${this.highScore}`;
        }
        this.ui.score.textContent = `⭐ ${this.score}`;
        this.ui.score.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.ui.score.style.transform = 'scale(1)';
        }, 100);
    }

    getDifficultyMultiplier() {
        // Gradual difficulty curve - starts easier, increases over time
        // Based on both score and distance traveled

        // Distance-based difficulty (main factor)
        const playerDistance = this.player ? this.player.x : 0;
        const distanceFactor = Math.min(1.0, playerDistance / 5000); // 0 to 1 over first 5000 pixels

        // Score-based difficulty (secondary factor)
        const scoreFactor = Math.min(0.5, this.score / 2000); // 0 to 0.5 based on score

        // Combine: starts at 0.5 (easy), max 2.5 (hard)
        const baseDifficulty = 0.5;
        const multiplier = baseDifficulty + (distanceFactor * 1.5) + scoreFactor;

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
        this.cannons.push(...generated.cannons);

        // Generate checkpoints
        const newCheckpoints = generateCheckpoints(startX, endX, this.GROUND_Y, this.checkpoints);
        this.checkpoints.push(...newCheckpoints);

        this.lastGeneratedX = endX;
        this.levelWidth = endX;
    }
}
