// Base Enemy class (Goomba)
export class Enemy {
    constructor(x, y, speed, direction, spriteSheet) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.direction = direction;
        this.spriteSheet = spriteSheet;
        this.type = 'goomba';
        this.alive = true;

        this.frameWidth = 32;
        this.frameHeight = 32;
        this.animationFrame = 0;
        this.animationTick = 0;
    }

    reset(x, y, speed, direction) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.direction = direction;
        this.alive = true;
        this.animationFrame = 0;
        this.animationTick = 0;
        // Type specific reset logic might be needed if subclasses override properties
    }

    update(canvasWidth) {
        if (!this.alive) return;

        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.direction *= -1;
        }

        this.animationTick++;
        if (this.animationTick >= 10) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTick = 0;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Draw Goomba-like enemy
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 5, 15, 0, Math.PI * 2);
        ctx.fill();

        // Head (tan mushroom cap)
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.ellipse(0, -8, 18, 12, 0, Math.PI, 0);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-6, -2, 5, 0, Math.PI * 2);
        ctx.arc(6, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-6, -2, 2, 0, Math.PI * 2);
        ctx.arc(6, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-3, -4);
        ctx.moveTo(10, -6);
        ctx.lineTo(3, -4);
        ctx.stroke();

        // Feet
        ctx.fillStyle = '#000000';
        const footOffset = this.animationFrame === 0 ? -2 : 2;
        ctx.fillRect(-12 + footOffset, 15, 8, 5);
        ctx.fillRect(4 - footOffset, 15, 8, 5);

        ctx.restore();
    }
}

// Koopa (Turtle) - shrinks to shell when stomped
export class Koopa extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'koopa';
        this.height = 40;
        this.isShell = false;
        this.shellSpeed = 8;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'koopa';
        this.height = 40;
        this.isShell = false;
        this.speed = speed; // Restore original speed
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        if (this.isShell) {
            // Shell
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell pattern
            ctx.strokeStyle = '#006400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
        } else {
            // Body (green shell)
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.ellipse(0, 5, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell pattern
            ctx.strokeStyle = '#006400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 5, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Head (yellow)
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(10, -5, 10, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(13, -6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(14, -6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Feet
            ctx.fillStyle = '#FFEB3B';
            const footOffset = this.animationFrame === 0 ? -2 : 2;
            ctx.fillRect(-10 + footOffset, 15, 8, 6);
            ctx.fillRect(2 - footOffset, 15, 8, 6);
        }

        ctx.restore();
    }
}

// Flying Enemy - bounces up and down
export class FlyingEnemy extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'flying';
        this.baseY = y;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
        this.floatAmplitude = 40;
    }

    update(canvasWidth) {
        super.update(canvasWidth);

        // Floating motion
        this.floatOffset += this.floatSpeed;
        this.y = this.baseY + Math.sin(this.floatOffset) * this.floatAmplitude;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Body (dark red)
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (big and angry)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-5, -3, 6, 0, Math.PI * 2);
        ctx.arc(5, -3, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-4, -3, 3, 0, Math.PI * 2);
        ctx.arc(6, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        const wingFlap = Math.sin(this.floatOffset * 10) * 10;
        ctx.fillStyle = '#FFD700';

        // Left wing
        ctx.beginPath();
        ctx.ellipse(-18, -5 + wingFlap, 12, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.ellipse(18, -5 - wingFlap, 12, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Cactus (Desert) - Spiky, cannot be stomped
export class Cactus extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'cactus';
        this.spiky = true; // Custom property for collision handling
        this.height = 40;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'cactus';
        this.spiky = true;
        this.height = 40;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Main body (Green)
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.roundRect(-10, -20, 20, 40, 5);
        ctx.fill();

        // Arms
        ctx.beginPath();
        ctx.roundRect(-18, -10, 8, 8, 2); // Left arm
        ctx.roundRect(10, -15, 8, 8, 2);  // Right arm
        ctx.fill();

        // Spikes
        ctx.fillStyle = '#FFF';
        const spikes = [[-10, -15], [10, -5], [0, -20], [-10, 5], [10, 10]];
        spikes.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.arc(sx, sy, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Eyes (Angry)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5, -5, 2, 0, Math.PI * 2);
        ctx.arc(5, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Yeti (Snow) - Jumps randomly
export class Yeti extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'yeti';
        this.height = 35;
        this.jumpTimer = 0;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'yeti';
        this.height = 35;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
        this.jumpTimer = Math.random() * 100;
    }

    update(canvasWidth) {
        super.update(canvasWidth);

        // Jump logic
        if (!this.isJumping) {
            this.jumpTimer++;
            if (this.jumpTimer > 150) { // Jump every ~2.5 seconds
                this.velY = -8;
                this.isJumping = true;
                this.jumpTimer = 0;
            }
        } else {
            this.velY += 0.4; // Gravity
            this.y += this.velY;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velY = 0;
                this.isJumping = false;
                this.jumpTimer = Math.random() * 50; // Random delay
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Body (White/Blue fur)
        ctx.fillStyle = '#E0F7FA';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (Teeth)
        ctx.fillStyle = 'white';
        ctx.fillRect(-6, 4, 4, 3);
        ctx.fillRect(2, 4, 4, 3);

        ctx.restore();
    }
}

// Ghost (Spooky) - Floats and follows player slowly
export class Ghost extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'ghost';
        this.floatOffset = 0;
        this.baseY = y;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'ghost';
        this.baseY = y;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(canvasWidth, player) {
        // Ghost ignores normal movement and follows player if close
        this.floatOffset += 0.05;
        this.y = this.baseY + Math.sin(this.floatOffset) * 10;

        if (player) {
            const dx = player.x - this.x;
            const dist = Math.abs(dx);

            // Only chase if within range
            if (dist < 400) {
                this.x += Math.sign(dx) * 0.5; // Very slow chase
                this.direction = Math.sign(dx);
            } else {
                // Idle wander
                this.x += this.direction * 0.2;
            }
        } else {
            this.x += this.direction * 0.5;
        }

        // Bounds check
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.direction *= -1;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        if (this.direction !== 0) ctx.scale(this.direction, 1);

        // Ghost Body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -5, 15, Math.PI, 0); // Head
        ctx.lineTo(15, 15);
        ctx.lineTo(10, 10);
        ctx.lineTo(5, 15);
        ctx.lineTo(0, 10);
        ctx.lineTo(-5, 15);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Tongue (Boo!)
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export function createEnemies(startX, endX, canvasHeight, spriteSheet, difficultyMultiplier = 1, biome = 'PLAINS') {
    const enemiesData = [];
    const groundY = canvasHeight - 50;
    const width = endX - startX;

    // Density increases with difficulty
    const densityDivisor = Math.max(200, 400 / difficultyMultiplier);
    const count = Math.floor(width / densityDivisor);

    for (let i = 0; i < count; i++) {
        const x = startX + Math.random() * width;
        const baseSpeed = 0.5 + Math.random() * 1.0;
        const speed = baseSpeed * difficultyMultiplier;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const rand = Math.random();

        // Biome-specific enemy generation
        if (biome === 'DESERT') {
            if (rand < 0.5) {
                enemiesData.push({ type: 'cactus', x, y: groundY - 40, speed: speed * 0.5, direction });
            } else {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            }
        } else if (biome === 'SNOW') {
            if (rand < 0.5) {
                enemiesData.push({ type: 'yeti', x, y: groundY - 35, speed, direction });
            } else {
                enemiesData.push({ type: 'koopa', x, y: groundY - 40, speed, direction });
            }
        } else if (biome === 'SPOOKY') {
            if (rand < 0.6) {
                enemiesData.push({ type: 'ghost', x, y: groundY - 100 - Math.random() * 50, speed, direction });
            } else {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            }
        } else {
            // PLAINS (Default)
            if (rand < 0.4) {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            } else if (rand < 0.6) {
                enemiesData.push({ type: 'koopa', x, y: groundY - 40, speed, direction });
            } else {
                enemiesData.push({ type: 'flying', x, y: groundY - 100 - Math.random() * 80, speed, direction });
            }
        }
    }
    return enemiesData;
}
