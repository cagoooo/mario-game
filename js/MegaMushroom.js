export class MegaMushroom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60; // Bigger than normal (40)
        this.height = 60;
        this.velX = 1.5; // Slower
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 50;
        this.spawning = true;
        this.GRAVITY = 0.4; // Heavier
    }

    spawn() {
        this.active = true;
        this.spawning = true;
    }

    update(platforms, groundY, levelWidth) {
        if (!this.active || this.collected) return;

        // Spawn animation
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

        // Scale to fit 60x60
        const scale = this.width / 24; // Base size 24
        ctx.scale(scale, scale);

        // Draw Mega Mushroom (Orange/Red)
        // Cap
        const gradient = ctx.createRadialGradient(12, 8, 2, 12, 8, 14);
        gradient.addColorStop(0, '#FF8C00'); // Dark Orange
        gradient.addColorStop(0.7, '#FF4500'); // Orange Red
        gradient.addColorStop(1, '#B22222'); // Firebrick

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(12, 10, 14, 10, 0, Math.PI, 0);
        ctx.fill();

        // Spots (Yellowish)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(6, 6, 4, 0, Math.PI * 2);
        ctx.arc(18, 6, 3, 0, Math.PI * 2);
        ctx.arc(12, 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Stem
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
