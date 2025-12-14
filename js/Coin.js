import { ObjectPool } from './ObjectPool.js?v=1.7.2';

export class Coin {
    constructor(x, y) {
        this.init(x, y);
        this.width = 20;
        this.height = 24;
    }

    init(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;

        // Animation
        this.animationFrame = 0;
        this.animationTick = 0;
        this.bobOffset = 0;
        this.bobDirection = 1;

        // Sparkle particles
        this.sparkles = [];
    }

    update() {
        // Bob animation
        this.bobOffset += 0.1 * this.bobDirection;
        if (Math.abs(this.bobOffset) > 3) {
            this.bobDirection *= -1;
        }

        // Spin animation
        this.animationTick++;
        if (this.animationTick >= 8) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTick = 0;
        }

        // Occasional sparkle
        if (Math.random() < 0.05) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                life: 20,
                size: 2 + Math.random() * 3
            });
        }

        // Update sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            this.sparkles[i].life--;
            this.sparkles[i].y -= 0.5;
            if (this.sparkles[i].life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x + this.width / 2;
        const screenY = this.y + this.bobOffset;

        ctx.save();

        // Draw sparkles
        this.sparkles.forEach(s => {
            const sx = s.x - camera.x;
            ctx.globalAlpha = s.life / 20;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(sx, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // Spin effect (width changes)
        const spinWidths = [1, 0.6, 0.2, 0.6];
        const spinWidth = spinWidths[this.animationFrame];

        ctx.translate(screenX, screenY + this.height / 2);
        ctx.scale(spinWidth, 1);

        // Coin body (gold)
        const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
        gradient.addColorStop(0, '#FFEB3B');
        gradient.addColorStop(0.5, '#FFC107');
        gradient.addColorStop(1, '#FF9800');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 / spinWidth, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Coin outline
        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center decoration (if facing forward)
        if (this.animationFrame === 0 || this.animationFrame === 2) {
            ctx.fillStyle = '#FFE082';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

const coinPool = new ObjectPool(() => new Coin(0, 0), (c, x, y) => c.init(x, y), 50);

export function generateCoins(startX, endX, platforms) {
    const coins = [];

    // Coins along the ground
    let firstCoinX = Math.ceil(startX / 150) * 150;
    if (firstCoinX < startX) firstCoinX += 150;

    for (let x = firstCoinX; x < endX; x += 150) {
        if (Math.random() > 0.3) {
            coins.push(coinPool.get(x, 300)); // Adjust Y based on ground
        }
    }

    // Coins above platforms
    platforms.forEach(platform => {
        if (platform.x >= startX && platform.x < endX) {
            if (Math.random() > 0.4) {
                const coinX = platform.x + platform.width / 2 - 10;
                const coinY = platform.y - 50;
                coins.push(coinPool.get(coinX, coinY));
            }
        }
    });

    return coins;
}

export function releaseCoin(coin) {
    coinPool.release(coin);
}
