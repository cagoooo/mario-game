// Bullet Bill - Horizontal projectile enemy
export class BulletBill {
    constructor(x, y, direction, speed = 4) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.direction = direction;
        this.speed = speed;
        this.alive = true;
        this.type = 'bulletbill';
    }

    update() {
        if (!this.alive) return;
        this.x += this.direction * this.speed;
    }

    draw(ctx, camera) {
        if (!this.alive) return;

        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Main body (Black bullet)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose cone
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(15, -10);
        ctx.quadraticCurveTo(28, 0, 15, 10);
        ctx.fill();

        // Eye (Angry white circle with black pupil)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(5, -2, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(7, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrow
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-2, -8);
        ctx.lineTo(10, -5);
        ctx.stroke();

        // Arms (small fists)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-5, 12, 5, 0, Math.PI * 2);
        ctx.arc(10, 12, 5, 0, Math.PI * 2);
        ctx.fill();

        // Back band (red stripe)
        ctx.fillStyle = '#B22222';
        ctx.fillRect(-18, -8, 6, 16);

        ctx.restore();
    }
}

// Cannon - Stationary launcher that fires Bullet Bills
export class Cannon {
    constructor(x, y, direction = -1) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 60;
        this.direction = direction;
        this.fireTimer = 0;
        this.fireCooldown = 180; // Fire every 3 seconds
        this.bullets = [];
        this.active = true;
        this.firingAnimation = 0;
    }

    update(player, canvasWidth) {
        if (!this.active) return;

        // Only fire when player is within range
        if (player) {
            const dist = Math.abs(player.x - this.x);
            if (dist < 600 && dist > 100) {
                this.fireTimer++;
                if (this.fireTimer >= this.fireCooldown) {
                    this.fire(player);
                    this.fireTimer = 0;
                }
            }
        }

        // Update firing animation
        if (this.firingAnimation > 0) {
            this.firingAnimation--;
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            // Remove if off screen
            if (bullet.x < -100 || bullet.x > canvasWidth + 1000) {
                this.bullets.splice(i, 1);
            }
        }
    }

    fire(player) {
        const direction = player.x < this.x ? -1 : 1;
        const bullet = new BulletBill(
            this.x + (direction > 0 ? this.width : -40),
            this.y - 15,
            direction
        );
        this.bullets.push(bullet);
        this.firingAnimation = 15;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Cannon shake when firing
        if (this.firingAnimation > 0) {
            ctx.translate((Math.random() - 0.5) * 4, 0);
        }

        // Base (dark grey platform)
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(-25, 10, 50, 25);

        // Cannon body (black barrel)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, -5, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cannon opening
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.ellipse(0, -5, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skull decoration
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Skull eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-3, -6, 2, 0, Math.PI * 2);
        ctx.arc(3, -6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Skull mouth
        ctx.fillRect(-4, -2, 8, 3);

        // Smoke effect when firing
        if (this.firingAnimation > 10) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(
                    (Math.random() - 0.5) * 20,
                    -5 + (Math.random() - 0.5) * 10,
                    5 + Math.random() * 5,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();

        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(ctx, camera));
    }

    getBulletHitboxes() {
        return this.bullets.filter(b => b.alive).map(b => ({
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height,
            bullet: b
        }));
    }
}
