import { checkCollision } from './utils.js';
import { Mushroom } from './Mushroom.js';
import { Star } from './Star.js';
import { FireFlower } from './FireFlower.js';
import { IceFlower } from './IceFlower.js';
import { Magnet } from './Magnet.js';
import { MegaMushroom } from './MegaMushroom.js';
import { OneUpMushroom } from './OneUpMushroom.js';
import { Cape } from './Cape.js';
import { SpatialGrid } from './SpatialGrid.js';

export class CollisionSystem {
    constructor(game) {
        this.game = game;

        // Spatial partitioning for optimized collision detection
        this.spatialGrid = new SpatialGrid(100); // 100px cells
        this.lastGridRebuild = 0;
        this.GRID_REBUILD_INTERVAL = 5; // Rebuild every 5 frames
    }

    update() {
        // Periodically rebuild spatial grid with all collidable entities
        // Moving enemies/platforms must be indexed at their current positions.
        this.rebuildSpatialGrid();

        this.handleEnemyCollisions();
        this.handleBlockCollisions();
        this.handlePlatformCollisions();
        this.handleItemCollisions();
        this.handleFireballCollisions();
        this.handleEnvironmentCollisions();
    }

    /**
     * Rebuild the spatial grid with all relevant entities
     */
    rebuildSpatialGrid() {
        this.spatialGrid.clear();

        // Add all collidable entities
        for (const enemy of this.game.enemies) {
            this.spatialGrid.insert(enemy);
        }
        for (const coin of this.game.coins) {
            this.spatialGrid.insert(coin);
        }
        for (const block of this.game.questionBlocks) {
            this.spatialGrid.insert(block);
        }
        for (const pipe of this.game.pipes) {
            this.spatialGrid.insert(pipe);
        }
        for (const platform of this.game.platforms) {
            this.spatialGrid.insert(platform);
        }
    }

    /**
     * Get entities near the player using spatial grid
     */
    getNearbyEntities(entityArray) {
        const player = this.game.player;
        const nearby = [];
        const candidates = this.spatialGrid.getPotentialCollisions(player);

        for (const entity of entityArray) {
            if (candidates.has(entity)) {
                nearby.push(entity);
            }
        }
        return nearby;
    }

    handleEnemyCollisions() {
        // Skip if player is already dead or in death sequence
        if (this.game.player.isDead || this.game.isProcessingDeath) return;

        // Use spatial grid to get only nearby enemies
        const nearbyEnemies = this.getNearbyEntities(this.game.enemies);
        for (const enemy of nearbyEnemies) {

            if (checkCollision(this.game.player, enemy)) {
                // Mega Mario Destruction
                if (this.game.player.isMega) {
                    this.game.addScorePopup(enemy.x, enemy.y, 100);
                    this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    const idx = this.game.enemies.indexOf(enemy);
                    if (idx > -1) this.game.enemies.splice(idx, 1);
                    this.game.score += 100;
                    this.game.updateScore();
                    this.game.playSound('stomp'); // Or kick
                    this.game.triggerScreenShake(5);
                    this.game.achievementSystem.trackEnemyKill();
                    this.game.achievementSystem.trackMegaDestroy();
                    continue;
                }

                // Relaxed stomp check
                if (this.game.player.velY > 0 &&
                    this.game.player.y + this.game.player.height < enemy.y + enemy.height * 0.8 &&
                    !enemy.spiky) { // Check if enemy is spiky (cannot be stomped)

                    this.game.addScorePopup(enemy.x, enemy.y, 100);
                    this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    const idx = this.game.enemies.indexOf(enemy);
                    if (idx > -1) this.game.enemies.splice(idx, 1);
                    this.game.player.velY = -12 * 0.7;
                    this.game.score += 100;
                    this.game.updateScore();
                    this.game.playSound('stomp');
                    this.game.achievementSystem.trackEnemyKill(true);
                    this.checkNewHighScore();
                } else {
                    const result = this.game.player.hit();
                    if (result === 'kill') {
                        this.game.addScorePopup(enemy.x, enemy.y, 100);
                        this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                        const idx = this.game.enemies.indexOf(enemy);
                        if (idx > -1) this.game.enemies.splice(idx, 1);
                        this.game.score += 100;
                        this.game.updateScore();
                        this.game.playSound('stomp');
                        this.game.achievementSystem.trackEnemyKill();
                        this.checkNewHighScore();
                    } else if (result === 'dead') {
                        this.game.triggerDeathEffect();
                        this.game.gameOver();
                        return; // Stop processing after death
                    } else if (result === 'shrink') {
                        this.game.triggerScreenShake(5);
                        this.game.triggerFreeze(20);
                        this.game.playSound('shrink');
                    }
                }
            }
        }
    }

    handleBlockCollisions() {
        // Use spatial grid to get only nearby blocks
        const nearbyBlocks = this.getNearbyEntities(this.game.questionBlocks);
        for (const block of nearbyBlocks) {

            // Mega Mario Destruction - destroy blocks on any contact
            if (this.game.player.isMega && checkCollision(this.game.player, block)) {
                // Destroy the block with spectacular effects
                this.game.addParticles(block.x + block.width / 2, block.y + block.height / 2, 15, '#B8860B');
                this.game.addParticles(block.x + block.width / 2, block.y + block.height / 2, 10, '#FFD700');
                this.game.addScorePopup(block.x, block.y, 50);
                this.game.score += 50;
                this.game.updateScore();
                this.game.playSound('bump');
                this.game.triggerScreenShake(8);
                const idx = this.game.questionBlocks.indexOf(block);
                if (idx > -1) this.game.questionBlocks.splice(idx, 1);
                continue;
            }

            // Check for landing on top (Solid Platform)
            if (this.game.player.velY >= 0 && // Falling or flat
                this.game.player.x + this.game.player.width > block.x &&
                this.game.player.x < block.x + block.width &&
                this.game.player.y + this.game.player.height <= block.y + 10 && // Was above or just inside top
                this.game.player.y + this.game.player.height + this.game.player.velY >= block.y) { // Will be inside/below next frame

                this.game.player.y = block.y - this.game.player.height;
                this.game.player.velY = 0;
                this.game.player.grounded = true;
                this.game.player.isJumping = false;
                continue; // Handled platform collision, skip bottom collision
            }

            // Check for hitting from bottom (Question Block activation)
            if (this.game.player.velY < 0 &&
                this.game.player.x + this.game.player.width > block.x &&
                this.game.player.x < block.x + block.width &&
                this.game.player.y < block.y + block.height &&
                this.game.player.y + this.game.player.height > block.y + block.height - 10) {

                const result = block.hit();
                if (result) {
                    this.game.playSound('bump');
                    if (result.type === 'coin') {
                        this.game.score += result.value;
                        this.game.addScorePopup(block.x + 16, block.y - 20, result.value);
                        this.game.addParticles(block.x + 16, block.y - 20, 10, '#FFD700', 'sparkle');
                        this.game.updateScore();
                        this.game.playSound('coin');
                    } else if (result.type === 'mushroom') {
                        const mushroom = this.game.mushroomPool.get(block.x, block.y);
                        mushroom.spawn();
                        this.game.mushrooms.push(mushroom);
                        this.game.playSound('block');
                    } else if (result.type === 'star') {
                        const star = this.game.starPool.get(block.x, block.y);
                        star.spawn();
                        this.game.stars.push(star);
                        this.game.playSound('block');
                    } else if (result.type === 'fireflower') {
                        const flower = this.game.fireFlowerPool.get(block.x, block.y);
                        flower.spawn();
                        this.game.fireflowers.push(flower);
                        this.game.playSound('block');
                    } else if (result.type === 'iceflower') {
                        const iceflower = this.game.iceFlowerPool.get(block.x, block.y);
                        iceflower.spawn();
                        this.game.iceflowers.push(iceflower);
                        this.game.playSound('block');
                    } else if (result.type === 'magnet') {
                        const magnet = this.game.magnetPool.get(block.x, block.y);
                        magnet.spawn();
                        this.game.magnets.push(magnet);
                        this.game.playSound('block');
                    } else if (result.type === 'mega_mushroom') {
                        const mega = this.game.megaMushroomPool.get(block.x, block.y);
                        mega.spawn();
                        this.game.megaMushrooms.push(mega);
                        this.game.playSound('block');
                    } else if (result.type === 'oneup') {
                        const oneUp = this.game.oneUpMushroomPool.get(block.x, block.y);
                        this.game.oneUpMushrooms.push(oneUp);
                        this.game.playSound('block');
                    } else if (result.type === 'cape') {
                        const cape = this.game.capePool.get(block.x, block.y);
                        this.game.capes.push(cape);
                        this.game.playSound('block');
                    }
                    this.game.triggerScreenShake(3);

                    // Stop upward velocity
                    this.game.player.velY = 0;
                    this.game.player.y = block.y + block.height;
                }
            }
        }
    }

    handlePlatformCollisions() {
        // Mega Mario Destruction - destroy platforms on side/bottom contact
        if (!this.game.player.isMega) return;

        // Use spatial grid to get only nearby platforms
        const nearbyPlatforms = this.getNearbyEntities(this.game.platforms);
        for (const platform of nearbyPlatforms) {

            // Skip ground platforms (very wide or at GROUND_Y)
            if (platform.width > 500 || platform.y >= this.game.GROUND_Y - 10) continue;

            // Skip bonus level special platforms (floor, ceiling, walls)
            if (this.game.gameState === 'BONUS') {
                // Skip the floor, ceiling, and wall platforms in bonus level
                if (platform.y < 0 || platform.x < 0 || platform.x >= this.game.levelWidth - 50) continue;
                if (platform.y >= this.game.GROUND_Y - 60 && platform.width > 200) continue;
            }

            if (checkCollision(this.game.player, platform)) {
                // Check if player is on top of platform (don't destroy if just standing)
                const playerBottom = this.game.player.y + this.game.player.height;
                const isStandingOnTop = playerBottom <= platform.y + 15 &&
                    playerBottom >= platform.y - 5 &&
                    this.game.player.velY >= 0;

                // Only destroy if hitting from side or bottom
                if (!isStandingOnTop || this.game.player.velY < 0) {
                    // Destroy the platform with spectacular effects
                    this.game.addParticles(platform.x + platform.width / 2, platform.y + platform.height / 2, 15, '#8B4513');
                    this.game.addParticles(platform.x + platform.width / 2, platform.y + platform.height / 2, 10, '#D2691E');
                    this.game.addScorePopup(platform.x, platform.y, 25);
                    this.game.score += 25;
                    this.game.updateScore();
                    this.game.playSound('bump');
                    this.game.triggerScreenShake(6);
                    const idx = this.game.platforms.indexOf(platform);
                    if (idx > -1) this.game.platforms.splice(idx, 1);
                }
            }
        }
    }

    handleItemCollisions() {
        // Coins - use spatial grid for performance (many coins exist)
        const nearbyCoins = this.getNearbyEntities(this.game.coins);
        for (const coin of nearbyCoins) {
            if (!coin.collected && checkCollision(this.game.player, coin)) {
                coin.collected = true;

                // Release to pool
                this.game.coinPool.release(coin);
                const idx = this.game.coins.indexOf(coin);
                if (idx > -1) this.game.coins.splice(idx, 1);

                this.game.score += 10;
                this.game.sessionCoins++; // Track session coins
                this.game.totalCoins++;    // Track total coins

                // Check for 100-coin 1UP bonus
                if (this.game.sessionCoins % 100 === 0) {
                    this.game.addLife();
                    this.game.addScorePopup(coin.x, coin.y - 30, '1UP', true);
                    this.game.addParticles(coin.x + 10, coin.y, 20, '#32CD32', 'sparkle');
                    this.game.addParticles(coin.x + 10, coin.y, 15, '#FFD700', 'sparkle');
                } else {
                    this.game.addScorePopup(coin.x, coin.y, 10);
                }

                // Enhanced coin collection burst effect
                this.game.addParticles(coin.x + 10, coin.y + 12, 10, '#FFD700', 'sparkle'); // Gold burst
                this.game.addParticles(coin.x + 10, coin.y + 12, 6, '#FFFFFF', 'sparkle');  // White flash
                this.game.updateScore();
                this.game.playSound('coin');
                this.game.achievementSystem.trackCoinCollect();
                this.checkNewHighScore();
            }
        }

        // Mushrooms
        for (let i = this.game.mushrooms.length - 1; i >= 0; i--) {
            const mushroom = this.game.mushrooms[i];
            if (checkCollision(this.game.player, mushroom) && mushroom.active && !mushroom.spawning) {
                if (this.game.player.powerUp()) {
                    this.game.playSound('powerup_mushroom');
                    this.game.triggerFreeze(20);
                    this.game.firstTimePickupHint('mushroom', '🍄 變大！受到傷害會回到小狀態');
                } else {
                    this.game.playSound('coin');
                }
                mushroom.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(mushroom.x, mushroom.y, 1000);
                this.game.updateScore();
                this.game.mushrooms.splice(i, 1);
                this.game.mushroomPool.release(mushroom);
            }
        }

        // Stars
        for (let i = this.game.stars.length - 1; i >= 0; i--) {
            const star = this.game.stars[i];
            if (checkCollision(this.game.player, star) && star.active && !star.spawning) {
                star.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(star.x, star.y, 1000);
                this.game.updateScore();
                this.game.playSound('powerup_star');
                this.game.triggerFreeze(20);
                this.game.achievementSystem.trackStarCollect();
                if (this.game.player.getStarPower) this.game.player.getStarPower();
                this.game.firstTimePickupHint('star', '⭐ 無敵！短時間內碰到敵人會直接消滅他們');
                this.game.stars.splice(i, 1);
                this.game.starPool.release(star);
            }
        }

        // FireFlowers
        for (let i = this.game.fireflowers.length - 1; i >= 0; i--) {
            const flower = this.game.fireflowers[i];
            if (checkCollision(this.game.player, flower) && flower.active && !flower.spawning) {
                flower.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(flower.x, flower.y, 1000);
                this.game.updateScore();

                if (this.game.player.getFirePower) {
                    const changed = !this.game.player.firePower;
                    this.game.player.getFirePower();
                    if (changed) {
                        this.game.playSound('powerup_fire');
                        this.game.triggerFreeze(20);
                        this.game.firstTimePickupHint('fire', '🔥 火焰花！自動發射火球，面向敵人即可攻擊');
                    } else {
                        this.game.playSound('coin');
                    }
                }
                this.game.fireflowers.splice(i, 1);
                this.game.fireFlowerPool.release(flower);
            }
        }

        // IceFlowers
        for (let i = this.game.iceflowers.length - 1; i >= 0; i--) {
            const flower = this.game.iceflowers[i];
            if (checkCollision(this.game.player, flower) && flower.active && !flower.spawning) {
                flower.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(flower.x, flower.y, 1000);
                this.game.updateScore();

                if (this.game.player.getIcePower) {
                    const changed = !this.game.player.icePower;
                    this.game.player.getIcePower();
                    if (changed) {
                        this.game.playSound('powerup_fire'); // Reuse sound
                        this.game.triggerFreeze(20);
                        this.game.addParticles(flower.x + 14, flower.y + 16, 15, '#00BFFF');
                        this.game.firstTimePickupHint('ice', '❄️ 冰花！冰球能凍住敵人，被凍敵人可當踏腳石');
                    } else {
                        this.game.playSound('coin');
                    }
                }
                this.game.iceflowers.splice(i, 1);
                this.game.iceFlowerPool.release(flower);
            }
        }

        // Magnets
        for (let i = this.game.magnets.length - 1; i >= 0; i--) {
            const magnet = this.game.magnets[i];
            if (checkCollision(this.game.player, magnet) && magnet.active && !magnet.spawning) {
                magnet.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(magnet.x, magnet.y, 1000);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                if (this.game.player.getMagnetPower) this.game.player.getMagnetPower();
                this.game.firstTimePickupHint('magnet', '🧲 磁鐵！自動吸附附近金幣');
                this.game.magnets.splice(i, 1);
                this.game.magnetPool.release(magnet);
            }
        }

        // Mega Mushrooms
        for (let i = this.game.megaMushrooms.length - 1; i >= 0; i--) {
            const mega = this.game.megaMushrooms[i];
            if (checkCollision(this.game.player, mega) && mega.active && !mega.spawning) {
                mega.collected = true;
                this.game.score += 2000;
                this.game.addScorePopup(mega.x, mega.y, 2000);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                if (this.game.player.getMegaMushroom) this.game.player.getMegaMushroom();
                this.game.firstTimePickupHint('mega', '🍄💥 巨大化！可破壞敵人、磚塊、水管！');
                this.game.megaMushrooms.splice(i, 1);
                this.game.megaMushroomPool.release(mega);
            }
        }

        // 1UP Mushrooms
        for (let i = this.game.oneUpMushrooms.length - 1; i >= 0; i--) {
            const oneUp = this.game.oneUpMushrooms[i];
            if (checkCollision(this.game.player, oneUp) && oneUp.active && !oneUp.spawning) {
                oneUp.collected = true;
                this.game.addLife();
                this.game.addParticles(oneUp.x + oneUp.width / 2, oneUp.y + oneUp.height / 2, 12, '#32CD32');
                this.game.oneUpMushrooms.splice(i, 1);
                this.game.oneUpMushroomPool.release(oneUp);
            }
        }

        // Capes
        for (let i = this.game.capes.length - 1; i >= 0; i--) {
            const cape = this.game.capes[i];
            if (!cape.collected && checkCollision(this.game.player, cape)) {
                cape.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(cape.x, cape.y, 1000);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                this.game.addParticles(cape.x + cape.width / 2, cape.y + cape.height / 2, 15, '#FFD700');
                this.game.addParticles(cape.x + cape.width / 2, cape.y + cape.height / 2, 10, '#FFA500');
                if (this.game.player.getCape) this.game.player.getCape();
                this.game.firstTimePickupHint('cape', '🦸 披風滑翔！空中按住空白鍵減緩下降');
                this.game.capes.splice(i, 1);
                this.game.capePool.release(cape);
            }
        }

        // Checkpoints
        for (const checkpoint of this.game.checkpoints) {
            if (!checkpoint.activated && checkCollision(this.game.player, checkpoint)) {
                checkpoint.activate(this.game);
            }
        }
    }

    handleFireballCollisions() {
        for (let i = this.game.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.game.fireballs[i];
            if (!fireball.active) continue;

            for (let j = this.game.enemies.length - 1; j >= 0; j--) {
                const enemy = this.game.enemies[j];
                if (checkCollision(fireball, enemy)) {
                    this.game.addScorePopup(enemy.x, enemy.y, 100);
                    this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    this.game.enemies.splice(j, 1);
                    this.game.achievementSystem.trackEnemyKill();
                    this.game.score += 100;
                    this.game.updateScore();
                    this.game.playSound('stomp');

                    fireball.active = false;
                    this.game.addParticles(fireball.x, fireball.y, 4, '#FF4500');
                    break;
                }
            }
        }
    }

    handleEnvironmentCollisions() {
        // Pipes (Piranha Plants) - use spatial grid for performance
        const nearbyPipes = this.getNearbyEntities(this.game.pipes);
        for (const pipe of nearbyPipes) {

            // Skip collision if entering/exiting pipe
            if (this.game.player.isEnteringPipe || this.game.player.isExitingPipe) continue;

            // Reset playerOnTop flag each frame
            pipe.playerOnTop = false;

            // Mega Mario Destruction - destroy pipes on side contact (except ENTRANCE/EXIT in OVERWORLD)
            if (this.game.player.isMega && checkCollision(this.game.player, pipe)) {
                // Don't destroy entrance/exit pipes - they're important for gameplay
                if (pipe.type === 'ENTRANCE' || pipe.type === 'EXIT') {
                    // Just kill the piranha if any
                    if (pipe.piranhaState !== 'DEAD') {
                        pipe.killPiranha();
                        this.game.addScorePopup(pipe.x, pipe.y, 200);
                        this.game.score += 200;
                        this.game.updateScore();
                        this.game.playSound('stomp');
                    }
                    // Still allow standing on top
                    if (this.game.player.velY >= 0 &&
                        this.game.player.y + this.game.player.height <= pipe.y + 10) {
                        this.game.player.y = pipe.y - this.game.player.height;
                        this.game.player.velY = 0;
                        this.game.player.grounded = true;
                        pipe.playerOnTop = true;
                    }
                    continue;
                }

                // Destroy the pipe with spectacular effects
                this.game.addParticles(pipe.x + pipe.width / 2, pipe.y + pipe.height / 2, 20, '#228B22');
                this.game.addParticles(pipe.x + pipe.width / 2, pipe.y + pipe.height / 2, 15, '#32CD32');
                this.game.addScorePopup(pipe.x, pipe.y, 100);
                this.game.score += 100;
                this.game.updateScore();
                this.game.playSound('bump');
                this.game.triggerScreenShake(10);
                const idx = this.game.pipes.indexOf(pipe);
                if (idx > -1) this.game.pipes.splice(idx, 1);
                continue;
            }

            // Check for landing on top (Solid Platform)
            // Pipe width is 48, but let's make the standing area slightly smaller to avoid edge clipping
            if (this.game.player.velY >= 0 &&
                this.game.player.x + this.game.player.width > pipe.x + 4 &&
                this.game.player.x < pipe.x + pipe.width - 4 &&
                this.game.player.y + this.game.player.height <= pipe.y + 10 &&
                this.game.player.y + this.game.player.height + this.game.player.velY >= pipe.y) {

                this.game.player.y = pipe.y - this.game.player.height;
                this.game.player.velY = 0;
                this.game.player.grounded = true;
                this.game.player.isJumping = false;
                pipe.playerOnTop = true;
                continue; // Safe on top
            }

            const hitbox = pipe.getPiranhaHitbox();
            if (hitbox && checkCollision(this.game.player, hitbox)) {
                // Mega Mario auto-kills piranha
                if (this.game.player.isMega) {
                    pipe.killPiranha();
                    this.game.addScorePopup(hitbox.x, hitbox.y, 200);
                    this.game.addParticles(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, 10, '#228B22');
                    this.game.score += 200;
                    this.game.updateScore();
                    this.game.playSound('stomp');
                    this.game.triggerScreenShake(5);
                    continue;
                }

                if (this.game.player.velY > 0 && this.game.player.y + this.game.player.height < hitbox.y + hitbox.height / 2) {
                    pipe.killPiranha();
                    this.game.player.velY = -12;
                    this.game.score += 200;
                    this.game.addScorePopup(hitbox.x, hitbox.y, 200);
                    this.game.addParticles(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, 8, '#228B22');
                    this.game.updateScore();
                    this.game.playSound('stomp');
                } else {
                    const result = this.game.player.hit();
                    if (result === 'dead') {
                        this.game.triggerDeathEffect();
                        this.game.gameOver();
                    } else if (result === 'shrink') {
                        this.game.triggerScreenShake(5);
                        this.game.triggerFreeze(20);
                        this.game.playSound('shrink');
                    } else if (result === 'kill') {
                        pipe.killPiranha();
                        this.game.score += 200;
                        this.game.addScorePopup(hitbox.x, hitbox.y, 200);
                        this.game.updateScore();
                        this.game.playSound('stomp');
                    }
                }
            }
        }

        // Lava
        for (let i = this.game.lava.length - 1; i >= 0; i--) {
            const lava = this.game.lava[i];
            if (checkCollision(this.game.player, lava)) {
                // Mega Mario destroys lava!
                if (this.game.player.isMega) {
                    this.game.addParticles(lava.x + lava.width / 2, lava.y, 20, '#FF4500');
                    this.game.addParticles(lava.x + lava.width / 2, lava.y, 15, '#FFD700');
                    this.game.addScorePopup(lava.x, lava.y, 50);
                    this.game.score += 50;
                    this.game.updateScore();
                    this.game.playSound('bump');
                    this.game.triggerScreenShake(8);
                    this.game.lava.splice(i, 1);
                    continue;
                }

                if (!this.game.player.isDead) {
                    this.game.playSound('death');
                    this.game.player.die();
                    this.game.gameOver();
                }
            }
        }
    }

    checkNewHighScore() {
        if (this.game.score > this.game.highScore && !this.game.isNewHighScore) {
            this.game.isNewHighScore = true;
            this.game.addParticles(this.game.player.x, this.game.player.y, 20, '#FF0000');
            this.game.addParticles(this.game.player.x, this.game.player.y, 20, '#FFD700');
            this.game.playSound('newHighScore');
        }
    }
}
