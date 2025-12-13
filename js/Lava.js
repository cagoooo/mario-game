export class Lava {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bubbles = [];

        // Initialize some bubbles
        for (let i = 0; i < width / 20; i++) {
            this.bubbles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 2 + Math.random() * 4,
                speed: 0.5 + Math.random() * 1
            });
        }
    }

    update() {
        // Animate bubbles
        this.bubbles.forEach(bubble => {
            bubble.y -= bubble.speed;
            if (bubble.y < 0) {
                bubble.y = this.height;
                bubble.x = Math.random() * this.width;
            }
        });
    }

    draw(ctx, camera) {
        if (this.x + this.width < camera.x || this.x > camera.x + 800) return;

        const drawX = this.x - camera.x;

        // Lava base
        ctx.fillStyle = '#CF1020'; // Lava red
        ctx.fillRect(drawX, this.y, this.width, this.height);

        // Lava surface (lighter)
        ctx.fillStyle = '#FF4500'; // Orange red
        ctx.fillRect(drawX, this.y, this.width, 10);

        // Bubbles
        ctx.fillStyle = '#FFD700'; // Gold bubbles
        this.bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(drawX + bubble.x, this.y + bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Glow effect
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(drawX, this.y - 20, this.width, 20);
        ctx.restore();
    }
}
