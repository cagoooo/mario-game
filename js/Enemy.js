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

    stomp() {
        if (!this.isShell) {
            this.isShell = true;
            this.height = 20;
            this.speed = 0;
            return 100; // Score for first stomp
        } else if (this.speed === 0) {
            // Kick the shell
            this.speed = this.shellSpeed;
            return 0;
        }
        return 100;
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

export function createEnemies(startX, endX, canvasHeight, spriteSheet, difficultyMultiplier = 1) {
    const enemies = [];
    const groundY = canvasHeight - 50;
    const width = endX - startX;

    // Density increases with difficulty (lower divisor = more enemies)
    // Base: 400px per enemy. Cap density at 200px per enemy.
    const densityDivisor = Math.max(200, 400 / difficultyMultiplier);
    const count = Math.floor(width / densityDivisor);

    for (let i = 0; i < count; i++) {
        const x = startX + Math.random() * width;
        // Speed increases with difficulty
        const baseSpeed = 0.5 + Math.random() * 1.0; // Reduced from 1.0 + random*1.5
        const speed = baseSpeed * difficultyMultiplier;

        const direction = Math.random() < 0.5 ? -1 : 1;
        const type = Math.random();

        if (type < 0.4) {
            // Regular Goomba (40%)
            enemies.push(new Enemy(x, groundY - 30, speed, direction, spriteSheet));
        } else if (type < 0.6) {
            // Koopa (20%)
            enemies.push(new Koopa(x, groundY - 40, speed, direction));
        } else {
            // Flying enemy (40%)
            enemies.push(new FlyingEnemy(x, groundY - 100 - Math.random() * 80, speed, direction));
        }
    }
    return enemies;
}
