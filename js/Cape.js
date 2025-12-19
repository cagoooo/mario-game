/**
 * Cape.js - Cape Power-Up Item
 * 
 * Allows the player to glide by holding the jump button while in the air.
 * @version 2.17.0
 */

export class Cape {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.collected = false;

        // Physics for bouncing movement (like mushroom)
        this.velX = 2;
        this.velY = 0;
        this.gravity = 0.3;

        // Animation
        this.floatOffset = 0;
        this.floatSpeed = 0.08;
        this.animationTick = 0;
        this.sparkles = [];
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.velX = 2;
        this.velY = 0;
        this.sparkles = [];
    }

    update(platforms, groundY, levelWidth) {
        if (this.collected) return;

        // Floating animation
        this.floatOffset = Math.sin(this.animationTick * this.floatSpeed) * 3;
        this.animationTick++;

        // Apply gravity
        this.velY += this.gravity;
        this.y += this.velY;

        // Move horizontally
        this.x += this.velX;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = -5; // Small bounce
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.checkCollision(platform) && this.velY > 0) {
                if (this.y + this.height - this.velY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = -5; // Bounce
                }
            }
        });

        // Bounce off walls
        if (this.x < 0) {
            this.x = 0;
            this.velX *= -1;
        }
        if (this.x + this.width > levelWidth) {
            this.x = levelWidth - this.width;
            this.velX *= -1;
        }

        // Add sparkles
        if (Math.random() < 0.15) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                size: 2 + Math.random() * 3,
                life: 20 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 1
            });
        }

        // Update sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            s.size *= 0.95;
            if (s.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    collect(player) {
        if (this.collected) return false;
        this.collected = true;
        player.getCape();
        return true;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y + this.floatOffset;

        ctx.save();

        // Draw sparkles first (behind cape)
        this.sparkles.forEach(s => {
            ctx.globalAlpha = s.life / 30;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(s.x - camera.x, s.y + this.floatOffset, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // Cape body (yellow with red accent - like Super Mario World)
        const gradient = ctx.createLinearGradient(screenX, screenY, screenX + this.width, screenY + this.height);
        gradient.addColorStop(0, '#FFD700');    // Gold
        gradient.addColorStop(0.5, '#FFA500');  // Orange
        gradient.addColorStop(1, '#FF6347');    // Tomato red

        // Main cape shape (flowing fabric)
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, screenY);

        // Left curve
        ctx.quadraticCurveTo(
            screenX, screenY + this.height / 3,
            screenX + 3, screenY + this.height
        );

        // Bottom wave (fabric effect)
        const waveOffset = Math.sin(this.animationTick * 0.1) * 3;
        ctx.quadraticCurveTo(
            screenX + this.width / 4, screenY + this.height - 5 + waveOffset,
            screenX + this.width / 2, screenY + this.height - 3
        );
        ctx.quadraticCurveTo(
            screenX + this.width * 0.75, screenY + this.height - 5 - waveOffset,
            screenX + this.width - 3, screenY + this.height
        );

        // Right curve
        ctx.quadraticCurveTo(
            screenX + this.width, screenY + this.height / 3,
            screenX + this.width / 2, screenY
        );

        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = '#CC5500';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner highlight (fabric fold)
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, screenY + 4);
        ctx.quadraticCurveTo(
            screenX + this.width / 3, screenY + this.height / 2,
            screenX + this.width / 2 - 2, screenY + this.height - 6
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Decorative clasp at top
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC9900';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Shine effect on clasp
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 1, screenY + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
