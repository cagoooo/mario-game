export class Platform {
    constructor(x, y, width, height, spriteSheet) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.spriteSheet = spriteSheet;
    }

    draw(ctx, camera) {
        // Only draw if visible on screen (culling)
        if (this.x + this.width < camera.x || this.x > camera.x + 800) return;

        const drawX = this.x - camera.x;
        const tileSize = 20;
        const cols = Math.ceil(this.width / tileSize);

        // Draw brick-like platform
        for (let i = 0; i < cols; i++) {
            const tx = drawX + i * tileSize;

            // Brick base
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(tx, this.y, tileSize, this.height);

            // Brick lines
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, this.y, tileSize, this.height);

            // Brick highlight
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(tx + 2, this.y + 2, tileSize - 4, 3);
        }

        // Grass on top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(drawX, this.y - 5, this.width, 5);

        // Grass tufts
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < this.width; i += 8) {
            ctx.beginPath();
            ctx.moveTo(drawX + i, this.y - 5);
            ctx.lineTo(drawX + i + 4, this.y - 12);
            ctx.lineTo(drawX + i + 8, this.y - 5);
            ctx.fill();
        }
    }
}

export function generatePlatforms(startX, endX, canvasHeight, spriteSheet) {
    const width = endX - startX;
    const platformCount = Math.floor(width / 200) + Math.floor(Math.random() * 2);
    const platforms = [];

    for (let i = 0; i < platformCount; i++) {
        platforms.push(new Platform(
            startX + Math.random() * (width - 100),
            Math.random() * (canvasHeight - 150) + 100,
            Math.random() * 50 + 50,
            20,
            spriteSheet
        ));
    }
    return platforms;
}
