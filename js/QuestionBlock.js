export class QuestionBlock {
    constructor(x, y, content = 'coin') {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.used = false;
        this.content = content; // 'coin' or 'mushroom'

        // Animation
        this.animationFrame = 0;
        this.animationTick = 0;

        // Bump animation when hit
        this.bumpOffset = 0;
        this.isBumping = false;

        // Spawned coin animation
        this.spawnedCoin = null;
    }

    hit() {
        if (this.used) return null;

        this.used = true;
        this.isBumping = true;
        this.bumpOffset = -8;

        if (this.content === 'coin') {
            // Create spawned coin animation
            this.spawnedCoin = {
                x: this.x + this.width / 2,
                y: this.y - 10,
                targetY: this.y - 50,
                velocity: -8,
                life: 40
            };
            return { type: 'coin', value: 10 };
        } else if (this.content === 'mushroom') {
            return { type: 'mushroom' };
        } else if (this.content === 'star') {
            return { type: 'star' };
        } else if (this.content === 'fireflower') {
            return { type: 'fireflower' };
        } else if (this.content === 'magnet') {
            return { type: 'magnet' };
        } else if (this.content === 'mega_mushroom') {
            return { type: 'mega_mushroom' };
        } else if (this.content === 'oneup') {
            return { type: 'oneup' };
        } else if (this.content === 'time_freeze') {
            return { type: 'time_freeze' };
        } else if (this.content === 'invisibility_cloak') {
            return { type: 'invisibility_cloak' };
        } else if (this.content === 'magnet_upgrade') {
            return { type: 'magnet_upgrade' };
        }

        return null;
    }

    update() {
        // Question mark animation
        if (!this.used) {
            this.animationTick++;
            if (this.animationTick >= 15) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.animationTick = 0;
            }
        }

        // Bump animation
        if (this.isBumping) {
            this.bumpOffset += 2;
            if (this.bumpOffset >= 0) {
                this.bumpOffset = 0;
                this.isBumping = false;
            }
        }

        // Spawned coin animation
        if (this.spawnedCoin) {
            this.spawnedCoin.y += this.spawnedCoin.velocity;
            this.spawnedCoin.velocity += 0.5;
            this.spawnedCoin.life--;

            if (this.spawnedCoin.life <= 0) {
                this.spawnedCoin = null;
            }
        }
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y + this.bumpOffset;

        ctx.save();

        if (this.used) {
            // Used block (brown/empty)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Dark lines
            ctx.strokeStyle = '#5D2906';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, this.width, this.height);

            // Inner shadow
            ctx.fillStyle = '#6B3410';
            ctx.fillRect(screenX + 4, screenY + 4, 24, 24);
        } else {
            // Active question block (yellow/orange)
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, '#FFD54F');
            gradient.addColorStop(0.5, '#FFC107');
            gradient.addColorStop(1, '#FF8F00');

            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.width, this.height);

            // Border
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, this.width, this.height);

            // Question mark
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const qOffset = this.animationFrame === 0 ? 0 : -2;
            ctx.fillText('?', screenX + this.width / 2, screenY + this.height / 2 + qOffset);

            // Question mark shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillText('?', screenX + this.width / 2 + 1, screenY + this.height / 2 + qOffset + 1);
        }

        // Draw spawned coin
        if (this.spawnedCoin) {
            const coinX = this.spawnedCoin.x - camera.x;
            const alpha = this.spawnedCoin.life / 40;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(coinX, this.spawnedCoin.y, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }
}

export function generateQuestionBlocks(startX, endX, groundY) {
    const blocks = [];

    // Spread question blocks across the level
    let firstBlockX = Math.ceil(startX / 400) * 400;
    if (firstBlockX < startX) firstBlockX += 400;

    for (let x = firstBlockX; x < endX; x += 400) {
        if (Math.random() > 0.3) {
            const blockY = groundY - 120 - Math.random() * 80;

            // Loot table
            const rand = Math.random();
            let content = 'coin';

            if (rand < 0.05) content = 'oneup';         // 5% - 1UP
            else if (rand < 0.10) content = 'star';        // 5%
            else if (rand < 0.20) content = 'fireflower'; // 10%
            else if (rand < 0.35) content = 'mushroom';   // 15%
            else if (rand < 0.45) content = 'magnet';     // 10%
            else if (rand < 0.52) content = 'mega_mushroom'; // 7%
            else if (rand < 0.59) content = 'time_freeze'; // 7%
            else if (rand < 0.66) content = 'invisibility_cloak'; // 7%
            else if (rand < 0.73) content = 'magnet_upgrade'; // 7%
            // else coin (27%)

            blocks.push(new QuestionBlock(x + Math.random() * 100, blockY, content));
        }
    }

    return blocks;
}
