/**
 * Iceball.js - Ice Projectile
 * 
 * Projectile shot by player with ice power. Freezes enemies on contact.
 * @version 2.9.0
 */

export class Iceball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.direction = direction; // 1 = right, -1 = left

        this.velX = 7 * direction;
        this.velY = 0;
        this.gravity = 0.3;
        this.bounceVel = -6;

        this.active = true;
        this.rotationAngle = 0;
        this.trailParticles = [];

        // Lifetime
        this.lifetime = 180; // 3 seconds at 60fps
    }

    reset(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.velX = 7 * direction;
        this.velY = 0;
        this.active = true;
        this.rotationAngle = 0;
        this.lifetime = 180;
        this.trailParticles = [];
    }

    update(platforms, groundY) {
        if (!this.active) return;

        // Lifetime check
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }

        // Physics
        this.velY += this.gravity;
        this.x += this.velX;
        this.y += this.velY;

        // Rotation for visual effect
        this.rotationAngle += 0.3 * this.direction;

        // Ground bounce
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = this.bounceVel;
        }

        // Platform bounce
        for (const platform of platforms) {
            if (this.velY > 0 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + platform.height + 10) {

                this.y = platform.y - this.height;
                this.velY = this.bounceVel;
                break;
            }
        }

        // Trail particles
        if (Math.random() > 0.6) {
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                size: 3 + Math.random() * 3,
                alpha: 0.7,
                life: 15
            });
        }

        // Update trail
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life--;
            p.alpha -= 0.05;
            p.size *= 0.9;
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }

        // Off-screen check
        if (this.x < -50 || this.x > 10000) {
            this.active = false;
        }
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y;

        // Draw trail
        ctx.save();
        for (const p of this.trailParticles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(p.x - camera.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw iceball
        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.rotationAngle);

        // Outer glow
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 10;

        // Main ice ball
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#4169E1');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Crystal facets
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) + this.rotationAngle;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Freeze an enemy on contact
     * @param {Object} enemy - Enemy to freeze
     */
    freezeEnemy(enemy) {
        if (enemy.freeze) {
            enemy.freeze();
        } else {
            // Fallback: make enemy a temporary platform
            enemy.frozen = true;
            enemy.frozenTimer = 180; // 3 seconds
            enemy.originalVelX = enemy.velX || 0;
            enemy.velX = 0;
        }
    }
}
