// Time Freeze Item - Pauses all enemies for 3 seconds
export class TimeFreezeItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 36;
        this.velX = 1.5;
        this.velY = 0;
        this.collected = false;
        this.active = false;
        this.spawnY = y;
        this.targetY = y - 40;
        this.spawning = true;
        this.GRAVITY = 0.4;
        this.animationFrame = 0;
        this.animationTimer = 0;
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
        this.velX = 1.5;
        this.velY = 0;
        this.collected = false;
        this.active = true;
        this.spawning = true;
        this.animationFrame = 0;
    }

    update(platforms, groundY, levelWidth) {
        if (!this.active || this.collected) return;

        // Spawn animation - rise up
        if (this.spawning) {
            this.y -= 1.5;
            if (this.y <= this.targetY) {
                this.spawning = false;
            }
            return;
        }

        // Horizontal movement
        this.x += this.velX;

        // Bounce off level edges
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

        // Animation timer
        this.animationTimer++;
        if (this.animationTimer >= 10) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }

    draw(ctx, camera) {
        if (!this.active || this.collected) return;

        const screenX = this.x - camera.x;

        ctx.save();
        ctx.translate(screenX + this.width / 2, this.y + this.height / 2);

        // Gentle floating animation
        const floatOffset = Math.sin(Date.now() / 200) * 2;
        ctx.translate(0, floatOffset);

        // Glow effect
        const glowSize = 20 + Math.sin(Date.now() / 150) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Clock body (blue circle)
        const clockGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 16);
        clockGradient.addColorStop(0, '#87CEEB'); // Light blue
        clockGradient.addColorStop(0.7, '#1E90FF'); // Dodger blue
        clockGradient.addColorStop(1, '#0066CC'); // Dark blue

        ctx.fillStyle = clockGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Clock border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Clock face (white inner circle)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hour markers
        ctx.fillStyle = '#0066CC';
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = Math.cos(angle) * 9;
            const y = Math.sin(angle) * 9;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clock hands (animated)
        const time = Date.now() / 1000;

        // Hour hand
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const hourAngle = (time / 4 - Math.PI / 2);
        ctx.lineTo(Math.cos(hourAngle) * 5, Math.sin(hourAngle) * 5);
        ctx.stroke();

        // Minute hand
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const minuteAngle = (time * 2 - Math.PI / 2);
        ctx.lineTo(Math.cos(minuteAngle) * 8, Math.sin(minuteAngle) * 8);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Snowflake/freeze indicator (top)
        ctx.fillStyle = '#00BFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❄', 0, -22);

        ctx.restore();
    }
}
