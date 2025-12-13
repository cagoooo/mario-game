export class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.active = true;
        this.collected = false;

        // Physics
        this.velX = 2;
        this.velY = -5;
        this.gravity = 0.5;
        this.bounceForce = -8;
        this.grounded = false;

        this.spawning = true;
        this.spawnY = y - 32;
        this.spawnTimer = 0;
    }

    spawn() {
        this.spawning = true;
    }

    update(platforms, groundY, canvasWidth) {
        if (this.collected) return;

        // Spawning animation (rise from block)
        if (this.spawning) {
            this.y -= 1;
            this.spawnTimer++;
            if (this.spawnTimer > 32) {
                this.spawning = false;
                this.y = this.spawnY;
            }
            return;
        }

        // Movement
        this.velY += this.gravity;
        this.x += this.velX;
        this.y += this.velY;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = this.bounceForce; // Bounce!
            this.grounded = false;
        }

        // Platform collision
        this.grounded = false;
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height) {

                // Land on top
                if (this.velY > 0 && this.y + this.height - this.velY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = this.bounceForce; // Bounce!
                }
                // Hit side (reverse direction)
                else if (this.y + this.height > platform.y) {
                    this.velX *= -1;
                }
            }
        });

        // Screen bounds (bounce off walls)
        if (this.x <= 0) {
            this.x = 0;
            this.velX *= -1;
        }
        // Don't bounce off right edge in infinite runner, just let it go
    }

    draw(ctx, camera) {
        if (this.collected) return;
        if (this.x + this.width < camera.x || this.x > camera.x + 1200) return;

        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(drawX, drawY);

        // Draw Star
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.beginPath();

        // Draw 5-pointed star
        const spikes = 5;
        const outerRadius = 15;
        const innerRadius = 7;
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        const step = Math.PI / spikes;

        ctx.moveTo(0, 0 - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = Math.cos(rot) * outerRadius;
            y = Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(0, 0 - outerRadius);
        ctx.closePath();
        ctx.fill();

        // Eyes (cute)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.fillRect(-4, -2, 2, 6);
        ctx.fillRect(2, -2, 2, 6);

        ctx.restore();
    }
}
