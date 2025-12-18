import { checkCollision } from './utils.js?v=1.6.22';
import { Mushroom } from './Mushroom.js?v=1.6.22';
import { Star } from './Star.js?v=1.6.22';
import { FireFlower } from './FireFlower.js?v=1.6.22';
import { Magnet } from './Magnet.js?v=1.9.32';
import { MegaMushroom } from './MegaMushroom.js?v=1.9.32';
import { OneUpMushroom } from './OneUpMushroom.js?v=2.1.0';
import { TimeFreezeItem } from './TimeFreezeItem.js?v=2.7.0';
import { InvisibilityCloak } from './InvisibilityCloak.js?v=2.7.0';
import { MagnetUpgrade } from './MagnetUpgrade.js?v=2.7.0';

export class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.handleEnemyCollisions();
        this.handleBlockCollisions();
        this.handlePlatformCollisions();
        this.handleItemCollisions();
        this.handleFireballCollisions();
        this.handleEnvironmentCollisions();
    }

    handleEnemyCollisions() {
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];

            if (checkCollision(this.game.player, enemy)) {
                // Mega Mario Destruction
                if (this.game.player.isMega) {
                    this.game.addScorePopup(enemy.x, enemy.y, 100);
                    this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    this.game.enemies.splice(i, 1);
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
                    this.game.enemies.splice(i, 1);
                    this.game.player.velY = -12 * 0.7;
                    this.game.score += 100;
                    this.game.updateScore();
                    this.game.playSound('stomp');
                    this.game.achievementSystem.trackEnemyKill();
                    this.checkNewHighScore();
                } else {
                    const result = this.game.player.hit();
                    if (result === 'kill') {
                        this.game.addScorePopup(enemy.x, enemy.y, 100);
                        this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                        this.game.enemies.splice(i, 1);
                        this.game.score += 100;
                        this.game.updateScore();
                        this.game.playSound('stomp');
                        this.game.achievementSystem.trackEnemyKill();
                        this.checkNewHighScore();
                    } else if (result === 'dead') {
                        this.game.triggerDeathEffect();
                        this.game.gameOver();
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
        for (let i = this.game.questionBlocks.length - 1; i >= 0; i--) {
            const block = this.game.questionBlocks[i];

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
                this.game.questionBlocks.splice(i, 1);
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
                        const mushroom = new Mushroom(block.x, block.y);
                        mushroom.spawn();
                        this.game.mushrooms.push(mushroom);
                        this.game.playSound('block');
                    } else if (result.type === 'star') {
                        const star = new Star(block.x, block.y);
                        star.spawn();
                        this.game.stars.push(star);
                        this.game.playSound('block');
                    } else if (result.type === 'fireflower') {
                        const flower = new FireFlower(block.x, block.y);
                        flower.spawn();
                        this.game.fireflowers.push(flower);
                        this.game.playSound('block');
                    } else if (result.type === 'magnet') {
                        const magnet = new Magnet(block.x, block.y);
                        magnet.spawn();
                        this.game.magnets.push(magnet);
                        this.game.playSound('block');
                    } else if (result.type === 'mega_mushroom') {
                        const mega = new MegaMushroom(block.x, block.y);
                        mega.spawn();
                        this.game.megaMushrooms.push(mega);
                        this.game.playSound('block');
                    } else if (result.type === 'oneup') {
                        const oneUp = new OneUpMushroom(block.x, block.y);
                        this.game.oneUpMushrooms.push(oneUp);
                        this.game.playSound('block');
                    } else if (result.type === 'time_freeze') {
                        const item = new TimeFreezeItem(block.x, block.y);
                        item.spawn();
                        this.game.timeFreezeItems.push(item);
                        this.game.playSound('block');
                    } else if (result.type === 'invisibility_cloak') {
                        const item = new InvisibilityCloak(block.x, block.y);
                        item.spawn();
                        this.game.invisibilityCloaks.push(item);
                        this.game.playSound('block');
                    } else if (result.type === 'magnet_upgrade') {
                        const item = new MagnetUpgrade(block.x, block.y);
                        item.spawn();
                        this.game.magnetUpgrades.push(item);
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

        for (let i = this.game.platforms.length - 1; i >= 0; i--) {
            const platform = this.game.platforms[i];

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
                    this.game.platforms.splice(i, 1);
                }
            }
        }
    }

    handleItemCollisions() {
        // Coins
        for (let i = this.game.coins.length - 1; i >= 0; i--) {
            const coin = this.game.coins[i];
            if (!coin.collected && checkCollision(this.game.player, coin)) {
                coin.collected = true;

                // Release to pool
                this.game.coinPool.release(coin);
                this.game.coins.splice(i, 1);

                this.game.score += 10;
                this.game.addScorePopup(coin.x, coin.y, 10);

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
                } else {
                    this.game.playSound('coin');
                }
                mushroom.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(mushroom.x, mushroom.y, 1000);
                this.game.updateScore();
                this.game.mushrooms.splice(i, 1);
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
                this.game.stars.splice(i, 1);
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
                    } else {
                        this.game.playSound('coin');
                    }
                }
                this.game.fireflowers.splice(i, 1);
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
                this.game.magnets.splice(i, 1);
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
                this.game.megaMushrooms.splice(i, 1);
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
            }
        }

        // Checkpoints
        for (const checkpoint of this.game.checkpoints) {
            if (!checkpoint.activated && checkCollision(this.game.player, checkpoint)) {
                checkpoint.activate(this.game);
            }
        }

        // Time Freeze Items
        for (let i = this.game.timeFreezeItems.length - 1; i >= 0; i--) {
            const item = this.game.timeFreezeItems[i];
            if (checkCollision(this.game.player, item) && item.active && !item.spawning) {
                item.collected = true;
                this.game.score += 1500;
                this.game.addScorePopup(item.x, item.y, 1500);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                this.game.addParticles(item.x + item.width / 2, item.y + item.height / 2, 10, '#87CEEB');
                // Activate Time Freeze power
                this.game.player.isTimeFrozen = true;
                this.game.player.timeFreezeTimer = 180; // 3 seconds at 60fps
                this.game.timeFreezeItems.splice(i, 1);
            }
        }

        // Invisibility Cloaks
        for (let i = this.game.invisibilityCloaks.length - 1; i >= 0; i--) {
            const item = this.game.invisibilityCloaks[i];
            if (checkCollision(this.game.player, item) && item.active && !item.spawning) {
                item.collected = true;
                this.game.score += 2000;
                this.game.addScorePopup(item.x, item.y, 2000);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                this.game.addParticles(item.x + item.width / 2, item.y + item.height / 2, 12, '#9966FF');
                // Activate Invisibility power
                this.game.player.isInvisible = true;
                this.game.player.invisibleTimer = 300; // 5 seconds at 60fps
                this.game.player.invincible = true;
                this.game.invisibilityCloaks.splice(i, 1);
            }
        }

        // Magnet Upgrades
        for (let i = this.game.magnetUpgrades.length - 1; i >= 0; i--) {
            const item = this.game.magnetUpgrades[i];
            if (checkCollision(this.game.player, item) && item.active && !item.spawning) {
                item.collected = true;
                this.game.score += 1000;
                this.game.addScorePopup(item.x, item.y, 1000);
                this.game.updateScore();
                this.game.playSound('powerup_mushroom');
                this.game.addParticles(item.x + item.width / 2, item.y + item.height / 2, 10, '#FFD700');
                // Activate Magnet Upgrade power (also activate base magnet if not active)
                this.game.player.magnetPower = true;
                this.game.player.magnetTimer = 600; // Reset base timer
                this.game.player.magnetUpgraded = true;
                this.game.player.magnetUpgradeTimer = 600; // 10 seconds at 60fps
                this.game.magnetUpgrades.splice(i, 1);
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
        // Pipes (Piranha Plants)
        for (let i = this.game.pipes.length - 1; i >= 0; i--) {
            const pipe = this.game.pipes[i];

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
                this.game.pipes.splice(i, 1);
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
