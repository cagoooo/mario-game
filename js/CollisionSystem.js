import { checkCollision } from './utils.js?v=1.6.22';
import { Mushroom } from './Mushroom.js?v=1.6.22';
import { Star } from './Star.js?v=1.6.22';
import { FireFlower } from './FireFlower.js?v=1.6.22';

export class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.handleEnemyCollisions();
        this.handleBlockCollisions();
        this.handleItemCollisions();
        this.handleFireballCollisions();
        this.handleEnvironmentCollisions();
    }

    handleEnemyCollisions() {
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];

            if (checkCollision(this.game.player, enemy)) {
                // Relaxed stomp check
                if (this.game.player.velY > 0 && this.game.player.y + this.game.player.height < enemy.y + enemy.height * 0.8) {
                    this.game.addScorePopup(enemy.x, enemy.y, 100);
                    this.game.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#FFD700');
                    this.game.enemies.splice(i, 1);
                    this.game.player.velY = -12 * 0.7;
                    this.game.score += 100;
                    this.game.updateScore();
                    this.game.playSound('stomp');
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
        this.game.questionBlocks.forEach(block => {
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
                    }
                    this.game.triggerScreenShake(3);
                }
            }
        });
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
                this.game.addParticles(coin.x + 10, coin.y + 12, 5, '#FFD700', 'sparkle');
                this.game.updateScore();
                this.game.playSound('coin');
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
        this.game.pipes.forEach(pipe => {
            const hitbox = pipe.getPiranhaHitbox();
            if (hitbox && checkCollision(this.game.player, hitbox)) {
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
        });

        // Lava
        this.game.lava.forEach(lava => {
            if (checkCollision(this.game.player, lava)) {
                if (!this.game.player.isDead) {
                    this.game.playSound('death');
                    this.game.player.die();
                    this.game.gameOver();
                }
            }
        });
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
