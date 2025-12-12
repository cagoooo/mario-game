export class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.direction = direction;
        this.speed = 8;
        this.velX = this.speed * this.direction;
        this.velY = 2;
        this.gravity = 0.5;
        this.bounceForce = -6;
        this.active = true;
        this.life = 120; // 2 seconds

        // Animation
        this.rotation = 0;
    }

    update(platforms, groundY) {
        if (!this.active) return;

        this.life--;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // Apply gravity
        this.velY += this.gravity;
        this.x += this.velX;
        this.y += this.velY;

        this.rotation += 0.5;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = this.bounceForce;
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height) {

                // Hit top - bounce
                if (this.velY > 0 && this.y + this.height - this.velY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = this.bounceForce;
                }
                // Hit side - destroy
                else {
                    this.active = false;
                }
            }
        });
    }

    draw(ctx, camera) {
        if (!this.active) return;
        if (this.x + this.width < camera.x || this.x > camera.x + 1200) return;

        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);

        // Fireball core
        ctx.fillStyle = '#FF4500'; // Orange Red
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
