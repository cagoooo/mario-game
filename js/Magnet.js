export class Magnet {
    constructor(x, y) {
        this.width = 40;
        this.height = 40;
        this.GRAVITY = 0.3;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velX = 2;
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 40;
        this.spawning = true;
    }

    spawn() {
        this.active = true;
        this.spawning = true;
    }

    update(platforms, groundY, levelWidth) {
        if (!this.active || this.collected) return;

        // Spawn animation (rise up from block)
        if (this.spawning) {
            this.y -= 1;
            if (this.y <= this.targetY) {
                this.spawning = false;
            }
            return;
        }

        // Horizontal movement
        this.x += this.velX;

        // Bounce off level edges
        if (this.x <= 0 || this.x + this.width >= levelWidth) {
            this.velX *= -1;
        }

        // Gravity
        this.velY += this.GRAVITY;
        this.y += this.velY;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = 0;
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + 20 &&
                this.velY > 0) {
                this.y = platform.y - this.height;
                this.velY = 0;
            }
        });
    }

    draw(ctx, camera) {
        if (!this.active || this.collected) return;

        const screenX = this.x - camera.x;

        ctx.save();
        ctx.translate(screenX, this.y);

        // Scale to fit 40x40
        const scale = this.width / 40;
        ctx.scale(scale, scale);

        // Draw Magnet (U-shape)
        const centerX = 20;
        const centerY = 20;

        // Magnet Body (Silver/Grey)
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, Math.PI, 0); // Top arch
        ctx.lineTo(centerX + 15, centerY + 15); // Right leg outer
        ctx.arc(centerX + 7.5, centerY + 15, 7.5, 0, Math.PI); // Right leg bottom
        ctx.lineTo(centerX, centerY + 15); // Right leg inner
        ctx.arc(centerX, centerY, 5, 0, Math.PI, true); // Inner arch
        ctx.lineTo(centerX - 5, centerY + 15); // Left leg inner
        ctx.arc(centerX - 12.5, centerY + 15, 7.5, 0, Math.PI); // Left leg bottom
        ctx.lineTo(centerX - 15, centerY); // Left leg outer
        ctx.fill();

        // Red Tips (Poles)
        ctx.fillStyle = '#FF0000';
        // North Pole (Left)
        ctx.fillRect(centerX - 15, centerY + 8, 10, 7);
        // South Pole (Right)
        ctx.fillRect(centerX + 5, centerY + 8, 10, 7);

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // "M" label
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', centerX, centerY - 2);

        ctx.restore();
    }
}
