// Developer-only deterministic scenarios. Run on localhost after entering a game.
// Does not ship in the PWA. Restores this origin's saved progress in finally.
import { AchievementSystem } from '../js/AchievementSystem.js';
import { COURSES, getCourseRecord } from '../js/AdventureCourse.js';
import { LEVELS, getUnlockedLevels } from '../js/Levels.js';
import { Pipe } from '../js/Pipe.js';
import { Enemy, Koopa, FlyingEnemy, Cactus, Yeti, Ghost, HammerBro, Lakitu, Thwomp } from '../js/Enemy.js';
import { QuestionBlock } from '../js/QuestionBlock.js';
import { flushSaves } from '../js/saveHelper.js';

export async function runSuite(g) {
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Local test only');
    flushSaves();
    const saved = Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]));
    const results = [];
    const check = (value, message) => { if (!value) throw new Error(message); };
    const run = (name, fn) => { try { fn(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } };
    const originalConfig = g.levelConfig;
    const originalCounts = { highScore:g.highScore, totalCoins:g.totalCoins };
    const originalSound = g.playSound;
    g.playSound = () => {};
    const reset = (config = COURSES[0]) => {
        g.levelConfig = config; g.levelMode = !!config;
        g.initGame(); g.loop.stop(); g.stopBGM();
        g.tutorial.skip(); g.player.y = g.GROUND_Y - g.player.height;
        g.player.grounded = true;
        document.getElementById('levelClearedOverlay').classList.remove('active');
    };
    try {
        run('pause freezes physics and timers; resume schedules one loop', () => {
            reset(); let fired = false; g.schedule(() => fired = true, 100);
            g.pause(); const y = g.player.y; for (let i = 0; i < 60; i++) g.update();
            check(g.player.y === y && !fired, 'paused simulation moved');
            g.resume(); const id = g.loop.id; g.resume(); check(id === g.loop.id, 'duplicate animation loop');
            g.loop.stop(); for (let i = 0; i < 6; i++) g.update(); check(fired, 'timer did not resume');
        });
        run('restart clears death callbacks, coins, cleanup and bonus state', () => {
            reset(); g.gameOver(); g.sessionCoins = 77; g.lastCleanedX = 10000;
            reset(); for (let i = 0; i < 240; i++) g.update();
            check(g.lives === 3 && !g.isProcessingDeath && g.sessionCoins === 0 && g.lastCleanedX === 0 && g.gameState === 'OVERWORLD', 'stale run state');
        });
        run('keyboard movement and double jump', () => {
            reset(); const x = g.player.x; g.input.handleKeyDown({ code:'KeyD', preventDefault() {} });
            for (let i = 0; i < 30; i++) g.update();
            check(g.player.x > x + 30, 'D key failed'); g.input.reset();
            g.input.keys.Space = true; g.onJump(); for (let i = 0; i < 5; i++) g.update(); check(g.player.velY < 0 && g.player.jumpCount === 1, 'held jump consumed second jump');
            g.onJump(); check(g.player.jumpCount === 2, 'double jump failed');
            check(!g.player.jump(), 'third jump allowed');
        });
        run('sprint exceeds walking speed and crouch keeps feet planted', () => {
            reset(); g.input.keys.ArrowRight = true; g.input.keys.ShiftLeft = true;
            for (let i = 0; i < 25; i++) g.update(); check(g.player.velX > 3.5, 'sprint failed');
            g.input.reset(); const feet = g.player.y + g.player.height; g.input.keys.ArrowDown = true; g.update();
            check(g.player.isCrouching && Math.abs(g.player.y + g.player.height - feet) < 1, 'crouch moved feet');
        });
        run('100 coins grant one life and do not duplicate pickup', () => {
            reset(); g.sessionCoins = 99;
            const coin = g.coinPool.get(g.player.x, g.player.y); g.coins.push(coin);
            g.collisionSystem.rebuildSpatialGrid(); g.collisionSystem.handleItemCollisions();
            g.collisionSystem.handleItemCollisions();
            check(g.lives === 4 && g.sessionCoins === 100, 'coin picked twice or life missing');
        });
        const items = [
            ['mushrooms', 'mushroomPool', p => p.isPowered], ['stars', 'starPool', p => p.starPower],
            ['fireflowers', 'fireFlowerPool', p => p.firePower], ['iceflowers', 'iceFlowerPool', p => p.icePower],
            ['magnets', 'magnetPool', p => p.magnetPower], ['megaMushrooms', 'megaMushroomPool', p => p.isMega],
            ['capes', 'capePool', p => p.hasCape], ['oneUpMushrooms', 'oneUpMushroomPool', () => g.lives === 4]
        ];
        for (const [array, pool, effect] of items) run(`power-up ${array}: spawn, pickup, effect, pool reuse`, () => {
            reset(); const item = g[pool].get(g.player.x, g.player.y);
            item.active = true; item.spawning = false; g[array].push(item);
            g.collisionSystem.handleItemCollisions();
            check(effect(g.player) && g[array].length === 0, 'pickup effect missing');
            check(g[pool].get(900, 200) === item, 'item not returned to pool');
            g[pool].release(item);
        });
        for (const content of ['coin','mushroom','star','fireflower','iceflower','magnet','mega_mushroom','oneup','cape']) run(`question block ${content}`, () => {
            reset(); const block = new QuestionBlock(100, 220, content);
            g.questionBlocks = [block]; g.player.x = 100; g.player.y = 245; g.player.velY = -10;
            g.collisionSystem.rebuildSpatialGrid(); g.collisionSystem.handleBlockCollisions();
            check(block.used, 'block not activated');
        });
        run('cape glide slows falling; wall jump pushes away', () => {
            reset(); g.player.hasCape = true; g.player.setState(3); g.player.y = 100; g.player.velY = 8; g.player.grounded = false; g.input.keys.Space = true;
            g.player.jumpHeld = true; g.player.update(g.input, [], g.levelWidth, g.camera);
            check(g.player.isGliding && g.player.velY <= 1.5, 'glide failed');
            g.player.wallSliding = true; g.player.wallDirection = -1; g.player.jump();
            check(g.player.velX > 0 && g.player.velY < 0, 'wall jump failed');
        });
        run('fire/ice automatic projectiles and expiry', () => {
            reset(); g.player.getFirePower(); for (let i = 0; i < 46; i++) g.update(); check(g.fireballs.length > 0, 'no fireball');
            g.player.getIcePower(); for (let i = 0; i < 55; i++) g.update(); check(g.iceballs.length > 0, 'no iceball');
            g.player.getStarPower(); g.player.starTimer = 1; g.update(); check(!g.player.starPower, 'star did not expire');
        });
        for (const Type of [Enemy, Koopa, FlyingEnemy, Cactus, Yeti, Ghost, HammerBro, Lakitu, Thwomp]) run(`enemy ${Type.name}: AI, freeze, draw`, () => {
            reset(); const enemy = new Type(300, 300, 1, -1, null);
            for (let i = 0; i < 120; i++) enemy.update(4000, g.player);
            enemy.freeze(); enemy.update(4000, g.player); enemy.draw(g.ctx, g.camera);
            check(Number.isFinite(enemy.x) && Number.isFinite(enemy.y) && enemy.frozen, 'invalid enemy state');
        });
        run('stomp defeats enemy and awards score', () => {
            reset(); const e = new Enemy(200, 320, 0, 1, null); g.enemies.push(e);
            g.player.x = 200; g.player.y = 279; g.player.velY = 5;
            const score = g.score; g.collisionSystem.update();
            check(!g.enemies.includes(e) && g.score > score && g.player.velY < 0, 'stomp failed');
        });
        run('bonus room isolates and restores all overworld arrays', () => {
            reset(LEVELS[0]); const pipe = new Pipe(600, 270, 80, false); pipe.type = 'ENTRANCE';
            const before = { enemies: [...g.enemies], cannons: g.cannons, checkpoints: g.checkpoints, capes: g.capes, width: g.levelWidth };
            g.enterBonusLevel(pipe); g.loadBonusLevel(); g.player.isEnteringPipe = false; g.player.isExitingPipe = false; g.player.setState(0);
            for (let i = 0; i < 10; i++) g.update();
            check(g.cannons.length === 0 && g.checkpoints.length === 0 && g.levelWidth === 1000, 'overworld generated in bonus room');
            g.unloadBonusLevel();
            check(g.enemies[0] === before.enemies[0] && g.cannons === before.cannons && g.checkpoints === before.checkpoints && g.capes === before.capes && g.levelWidth === before.width, 'world restoration failed');
        });
        run('death consumes one life, respawns at checkpoint and removes cape', () => {
            reset(); g.lastCheckpointX = 1350; g.player.hasCape = true;
            g.gameOver(); g.gameOver(); for (let i = 0; i < 212; i++) g.update();
            check(g.lives === 2 && !g.player.isDead && !g.player.hasCape && g.player.x === 1350 && g._diedThisRun, 'respawn failed');
        });
        run('last life opens game-over; restart is explicit', () => {
            reset(); g.lives = 1; g.gameOver(); for (let i = 0; i < 152; i++) g.update();
            check(!g.gameRunning && g.ui.gameOverOverlay.style.display === 'flex', 'game-over missing');
            document.dispatchEvent(new Event('click')); check(!g.gameRunning, 'arbitrary click restarted');
            g.restart(); g.loop.stop(); check(g.lives === 3 && g.gameRunning, 'restart failed');
        });
        for (const config of COURSES) {
            run(`course ${config.name}: stable layout, render, finish and record`, () => {
                reset(config); const count = g.platforms.length;
                for (let i = 0; i < 120; i++) { g.update(); if (i % 30 === 0) g.draw(); }
                check(g.platforms.length === count && g.course.gems.length === 3, 'course drifted');
                for (const gem of g.course.gems) { g.player.x = gem.x; g.player.y = gem.y; g.course.update(); }
                g.player.x = config.length; g.course.update();
                const r = getCourseRecord(config.id);
                check(g.course.collected === 3 && g.levelCleared && g.isPaused && r?.stars === 3, 'course finish failed');
            });
        }
        run('spring launches; moving platform carries standing player', () => {
            reset(); const s = g.course.springs[0]; g.player.x = s.x; g.player.y = s.y - 40; g.player.velY = 0; g.course.update();
            check(g.player.velY < -16, 'spring failed');
            reset(COURSES[2]); const m = g.course.movers[0];
            g.player.x = m.platform.x + 30; g.player.y = m.platform.y - g.player.height; g.player.grounded = true;
            const offset = g.player.x - m.platform.x; g.course.ticks = 10; g.course.beforePlayerUpdate();
            check(Math.abs(g.player.x - m.platform.x - offset) < 0.01, 'platform left player behind');
        });
        for (const level of LEVELS) run(`classic ${level.id}: biome, boss, clear and unlock`, () => {
            reset(level); check(g.currentBiome === level.biome, 'wrong biome');
            g.player.x = 5010; g.generateChunk(2000, 8000); g.triggerBossBattle();
            check(g.levelWidth >= g.bossArenaStartX + 1200, 'boss arena outside world');
            for (let i = 0; i < 90; i++) g.boss.update(g.player, g.platforms, g.width);
            g.boss.draw(g.ctx, g.camera); g.boss.alive = false; g.handleBossDefeat(); g.boss.y = 1000; g.updateBossBattle();
            check(g.levelCleared && g.isPaused && getUnlockedLevels().includes(level.id), 'clear or unlock failed');
        });
        run('endless continues after boss instead of level completion', () => {
            reset(null); g.triggerBossBattle(); g.handleBossDefeat();
            check(!g.levelCleared && g.bossTriggerDistance > g.player.x, 'endless stopped');
        });
        run('draw does not advance weather, achievements or hints', () => {
            reset(); g.powerUpHint = { text:'test', timer:90, alpha:1 };
            const weather = g.weatherSystem.time; const notification = g.achievementSystem.notificationTimer;
            for (let i = 0; i < 10; i++) g.draw();
            check(g.weatherSystem.time === weather && g.powerUpHint.timer === 90 && g.achievementSystem.notificationTimer === notification, 'render advanced timers');
        });
        run('score achievements and distinct world clear counting', () => {
            reset(); g.score = 5001; g.updateScore(); check(g.achievementSystem.isUnlocked('high_score_5000'), 'score achievement missing');
            g.highScore = 0; g.isNewHighScore = false; g.updateScore(); g.showGameOverScreen();
            check(g.isNewHighScore && g.ui.finalHighScore.textContent.includes('新最高分'), 'new record announcement lost after live save');
            const a = g.achievementSystem; a.stats.clearedWorldIds = [];
            for (let i = 0; i < 4; i++) a.trackWorldClear(false, '1-1');
            check(a.stats.worldsCleared === 1, 'replayed world counted as different worlds');
            a.stats.currentEnemyStreak = 0; a.trackEnemyKill(); check(a.stats.currentEnemyStreak === 0, 'fire kill counted as stomp');
            a.trackEnemyKill(true); a.trackLanding(); check(a.stats.currentEnemyStreak === 0, 'landing did not reset streak');
            a._coinTimestamps = []; g.simulationTicks = 0; a.trackCoinCollect(); g.simulationTicks = 61; a.trackCoinCollect();
            check(a._coinTimestamps.length === 1, 'coin rush window is not 60 ticks');
        });
        for (const config of COURSES) run(`course ${config.name}: physical traversal without teleport`, () => {
            reset(config); let ticks = 0;
            while (g.gameRunning && !g.levelCleared && ticks++ < 6000) {
                g.input.keys.ArrowRight = true; g.input.keys.ShiftLeft = true;
                const danger = g.enemies.some(e => e.x > g.player.x && e.x - g.player.x < 110);
                if (g.player.grounded && (danger || ticks % 45 === 0)) g.onJump();
                g.update();
            }
            check(g.levelCleared, `traversal failed at x=${g.player.x}, lives=${g.lives}`);
        });
        run('long endless traversal bounds retained entities', () => {
            reset(null); g.bossTriggerDistance = Infinity;
            for (let x = 0; x < 60000; x += 1000) { g.player.x = x; g.camera.x = x; g.generateChunk(x, x + 1000); g.cleanupObjects(x - 2000); }
            check(g.platforms.length < 100 && g.coins.length < 250 && g.enemies.length < 100, 'unbounded world entities');
        });
    } finally {
        g.stop(); g.levelConfig = originalConfig; g.levelMode = !!originalConfig;
        g.playSound = originalSound;
        flushSaves();
        for (const key of Object.keys(localStorage)) if (!(key in saved)) localStorage.removeItem(key);
        for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
        g.achievementSystem = new AchievementSystem(g);
        Object.assign(g, originalCounts);
    }
    return { total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results };
}
