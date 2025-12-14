
export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 24;
        this.collected = false;

        // Animation
        this.animationFrame = 0;
        this.animationTick = 0;
        this.bobOffset = 0;
        this.bobDirection = 1;

        // Sparkle particles
        this.sparkles = [];
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.animationFrame = 0;
        this.animationTick = 0;
        this.bobOffset = 0;
        this.bobDirection = 1;
        this.sparkles = []; // Clear existing sparkles
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

export function generateCoins(startX, endX, platforms) {
    const coinsData = [];

    // 1. Coins on platforms
    platforms.forEach(platform => {
        if (Math.random() < 0.3) { // 30% chance for coins on a platform
            const count = 1 + Math.floor(Math.random() * 3); // 1-3 coins
            const startX = platform.x + (platform.width - (count * 30)) / 2;

            for (let i = 0; i < count; i++) {
                coinsData.push({
                    x: startX + i * 30,
                    y: platform.y - 30
                });
            }
        }
    });

    // 2. Coins in the air (arcs)
    if (Math.random() < 0.2) {
        const arcCenterX = startX + Math.random() * (endX - startX);
        const arcCenterY = 250;
        const radius = 60;

        for (let i = 0; i < 5; i++) {
            const angle = Math.PI + (Math.PI / 4) * i / 4; // Semi-circle arc
            coinsData.push({
                x: arcCenterX + Math.cos(angle) * radius,
                y: arcCenterY + Math.sin(angle) * radius
            });
        }
    }

    return coinsData;
}
