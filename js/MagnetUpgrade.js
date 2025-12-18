// Magnet Upgrade - Doubles the coin collection range
export class MagnetUpgrade {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.velX = 1.8;
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 40;
        this.spawning = true;
        this.GRAVITY = 0.4;
        this.rotationAngle = 0;
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
        this.velX = 1.8;
        this.velY = 0;
        this.collected = false;
        this.active = true;
        this.spawning = true;
        this.rotationAngle = 0;
    }

    update(platforms, groundY, levelWidth) {
        if (!this.active || this.collected) return;

        // Rotation animation
        this.rotationAngle += 0.05;

        // Spawn animation
        if (this.spawning) {
            this.y -= 1.5;
            if (this.y <= this.targetY) {
                this.spawning = false;
            }
            return;
        }

        // Horizontal movement
        this.x += this.velX;

        // Bounce off edges
        if (this.x <= 0 || this.x + this.width >= levelWidth) {
            this.velX *= -1;
        }

        // Gravity
        this.velY += this.GRAVITY;
        this.y += this.velY;

        // Ground collision
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.velY = 0;
        }

        // Platform collision
        platforms.forEach(platform => {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + 20 &&
                this.velY > 0) {
                this.y = platform.y - this.height;
                this.velY = 0;
            }
        });
    }

    draw(ctx, camera) {
        if (!this.active || this.collected) return;

        const screenX = this.x - camera.x;

        ctx.save();
        ctx.translate(screenX + this.width / 2, this.y + this.height / 2);

        // Floating animation
        const floatY = Math.sin(Date.now() / 200) * 2;
        ctx.translate(0, floatY);

        // Magnetic field effect (rotating lines)
        ctx.save();
        ctx.rotate(this.rotationAngle);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
            ctx.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25);
            ctx.stroke();
        }
        ctx.restore();

        // Glow effect
        const glowSize = 22 + Math.sin(Date.now() / 150) * 4;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Magnet body (horseshoe shape)
        // Red side
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(-10, 14);
        ctx.lineTo(-10, -2);
        ctx.bezierCurveTo(-10, -14, 0, -18, 0, -14);
        ctx.lineTo(0, -6);
        ctx.bezierCurveTo(-2, -8, -4, -2, -4, 2);
        ctx.lineTo(-4, 14);
        ctx.closePath();
        ctx.fill();

        // Red tip
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(-10, 10, 6, 6);

        // Blue side
        ctx.fillStyle = '#4444FF';
        ctx.beginPath();
        ctx.moveTo(10, 14);
        ctx.lineTo(10, -2);
        ctx.bezierCurveTo(10, -14, 0, -18, 0, -14);
        ctx.lineTo(0, -6);
        ctx.bezierCurveTo(2, -8, 4, -2, 4, 2);
        ctx.lineTo(4, 14);
        ctx.closePath();
        ctx.fill();

        // Blue tip
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(4, 10, 6, 6);

        // Gold center highlight
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Upgrade indicator (arrow up)
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆', 0, -24);

        // Floating coins indicator
        const coinAngle = Date.now() / 400;
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            const a = coinAngle + i * (Math.PI * 2 / 3);
            const cx = Math.cos(a) * 20;
            const cy = Math.sin(a) * 12;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
