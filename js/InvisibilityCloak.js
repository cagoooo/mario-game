// Invisibility Cloak - Short invincibility + pass through enemies
export class InvisibilityCloak {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velX = 1.2;
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 40;
        this.spawning = true;
        this.GRAVITY = 0.35;
        this.floatPhase = 0;
    }

    spawn() {
        this.active = true;
        this.spawning = true;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.spawnY = y;
        this.targetY = y - 40;
        this.velX = 1.2;
        this.velY = 0;
        this.collected = false;
        this.active = true;
        this.spawning = true;
        this.floatPhase = 0;
    }

    update(platforms, groundY, levelWidth) {
        if (!this.active || this.collected) return;

        // Float phase for visual effect
        this.floatPhase += 0.1;

        // Spawn animation
        if (this.spawning) {
            this.y -= 1.2;
            if (this.y <= this.targetY) {
                this.spawning = false;
            }
            return;
        }

        // Horizontal movement (floats gently)
        this.x += this.velX;

        // Bounce off edges
        if (this.x <= 0 || this.x + this.width >= levelWidth) {
            this.velX *= -1;
        }

        // Lighter gravity (more floaty)
        this.velY += this.GRAVITY;
        this.y += this.velY;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = -3; // Bounce up gently
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + 20 &&
                this.velY > 0) {
                this.y = platform.y - this.height;
                this.velY = -2;
            }
        });
    }

    draw(ctx, camera) {
        if (!this.active || this.collected) return;

        const screenX = this.x - camera.x;

        ctx.save();
        ctx.translate(screenX + this.width / 2, this.y + this.height / 2);

        // Floating animation
        const floatY = Math.sin(this.floatPhase) * 3;
        ctx.translate(0, floatY);

        // Ghostly glow effect
        const glowSize = 25 + Math.sin(Date.now() / 200) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(180, 100, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(140, 80, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 50, 150, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Cloak shape (ghost-like)
        const waveOffset = Math.sin(Date.now() / 100) * 2;

        // Main cloak body with transparency
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 300) * 0.2;

        const cloakGradient = ctx.createLinearGradient(0, -18, 0, 18);
        cloakGradient.addColorStop(0, '#9966FF'); // Purple top
        cloakGradient.addColorStop(0.5, '#7744DD'); // Mid purple
        cloakGradient.addColorStop(1, '#5522AA'); // Dark purple bottom

        ctx.fillStyle = cloakGradient;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        // Hood shape
        ctx.bezierCurveTo(-12, -16, -16, -8, -16, 0);
        // Left side with wave
        ctx.bezierCurveTo(-16, 8, -14 + waveOffset, 14, -12, 18);
        // Bottom waves
        ctx.bezierCurveTo(-8, 16 + waveOffset, -4, 18, 0, 16);
        ctx.bezierCurveTo(4, 18, 8, 16 + waveOffset, 12, 18);
        // Right side
        ctx.bezierCurveTo(14 - waveOffset, 14, 16, 8, 16, 0);
        // Back to top
        ctx.bezierCurveTo(16, -8, 12, -16, 0, -16);
        ctx.fill();

        // Shimmer effect
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-5, -8, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Mystical eyes
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#00FFFF';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-5, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupils
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle particles
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < 3; i++) {
            const angle = (Date.now() / 500 + i * 2) % (Math.PI * 2);
            const dist = 18 + Math.sin(Date.now() / 200 + i) * 3;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
