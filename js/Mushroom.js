export class Mushroom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velX = 2;
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 30;

        // Spawning animation
        this.spawning = true;

        this.GRAVITY = 0.3;
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

        // Scale up to match new size (40px) from original design (24px)
        const scale = this.width / 24;
        ctx.scale(scale, scale);

        // Draw mushroom (based on original 24x24 coordinates)

        // Mushroom cap (red with white spots)
        const gradient = ctx.createRadialGradient(12, 8, 2, 12, 8, 14);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.7, '#FF0000');
        gradient.addColorStop(1, '#CC0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(12, 10, 14, 10, 0, Math.PI, 0);
        ctx.fill();

        // White spots
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(6, 6, 4, 0, Math.PI * 2);
        ctx.arc(18, 6, 3, 0, Math.PI * 2);
        ctx.arc(12, 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Stem (beige)
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(6, 10, 12, 14);

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(9, 16, 2, 0, Math.PI * 2);
        ctx.arc(15, 16, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
