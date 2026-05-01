export class FireFlower {
    constructor(x, y) {
        this.width = 40;
        this.height = 40;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.collected = false;
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
        }
        // Fire Flower is static, doesn't move
    }

    draw(ctx, camera) {
        if (this.collected) return;
        if (this.x + this.width < camera.x || this.x > camera.x + 1200) return;

        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(drawX, drawY);

        // Scale up to match new size (40px) from original design (30px)
        const scale = this.width / 30;
        ctx.scale(scale, scale);

        // Stem
        ctx.fillStyle = '#228B22'; // Green
        ctx.fillRect(-2, 0, 4, 15);

        // Leaves
        ctx.beginPath();
        ctx.ellipse(-8, 10, 6, 3, -0.5, 0, Math.PI * 2);
        ctx.ellipse(8, 10, 6, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Flower Head
        ctx.fillStyle = '#FF4500'; // Orange-Red outer
        ctx.beginPath();
        ctx.arc(0, -5, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700'; // Yellow inner
        ctx.beginPath();
        ctx.arc(0, -5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-3, -5, 1, 0, Math.PI * 2);
        ctx.arc(3, -5, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
