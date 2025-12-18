// 1UP Mushroom - Gives an extra life when collected
export class OneUpMushroom {
    constructor(x, y, groundY = 350) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.velX = 1; // Slower horizontal speed (was 2)
        this.velY = 0;
        this.active = true;
        this.collected = false;
        this.spawning = true;
        this.spawnProgress = 0;
        this.originalY = y;
        this.gravity = 0.4; // Slightly lower gravity
        this.groundY = groundY; // Ground level to prevent falling off screen
    }

    update(platforms, canvasWidth, groundY = null) {
        if (!this.active) return;

        // Use provided groundY or fallback
        const effectiveGroundY = groundY || this.groundY;

        // Spawning animation (rise from block)
        if (this.spawning) {
            this.spawnProgress += 2;
            this.y = this.originalY - this.spawnProgress;
            if (this.spawnProgress >= this.height) {
                this.spawning = false;
                this.y = this.originalY - this.height;
            }
            return;
        }

        // Apply gravity
        this.velY += this.gravity;
        this.y += this.velY;

        // Horizontal movement (slower)
        this.x += this.velX;

        // Ground collision - prevent falling off screen
        if (this.y + this.height > effectiveGroundY) {
            this.y = effectiveGroundY - this.height;
            this.velY = 0;
        }

        // Platform collision
        let onPlatform = false;
        for (const platform of platforms) {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + platform.height + this.velY + 5) {
                this.y = platform.y - this.height;
                this.velY = 0;
                onPlatform = true;
            }

            // Side collision - bounce off platforms
            if (this.y + this.height > platform.y && this.y < platform.y + platform.height) {
                if (this.x + this.width > platform.x && this.x < platform.x + 10) {
                    this.velX = -Math.abs(this.velX);
                } else if (this.x < platform.x + platform.width && this.x + this.width > platform.x + platform.width - 10) {
                    this.velX = Math.abs(this.velX);
                }
            }
        }

        // Screen bounds - bounce at edges instead of continuing off screen
        if (this.x < 0) {
            this.x = 0;
            this.velX = Math.abs(this.velX);
        }
        if (this.x + this.width > canvasWidth * 10) { // Allow moving far right
            this.velX = -Math.abs(this.velX);
        }
    }

    draw(ctx, camera) {
        if (!this.active) return;

        ctx.save();
        const drawX = this.x - camera.x;
        const drawY = this.y;

        // Clip during spawning
        if (this.spawning) {
            ctx.beginPath();
            ctx.rect(drawX, this.originalY - this.spawnProgress, this.width, this.spawnProgress);
            ctx.clip();
        }

        const centerX = drawX + this.width / 2;
        const centerY = drawY + this.height / 2;

        // Mushroom cap (green)
        ctx.fillStyle = '#32CD32'; // Lime green
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 4, 14, 10, 0, Math.PI, 0);
        ctx.fill();

        // Cap spots (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(centerX - 6, centerY - 8, 4, 3, -0.3, 0, Math.PI * 2);
        ctx.ellipse(centerX + 5, centerY - 6, 3, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Mushroom stem (white/cream)
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.roundRect(centerX - 8, centerY - 4, 16, 14, 3);
        ctx.fill();

        // Eyes (happy)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY + 2, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 4, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // "1UP" text floating above
        if (!this.spawning) {
            ctx.fillStyle = '#32CD32';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeText('1UP', centerX, drawY - 5);
            ctx.fillText('1UP', centerX, drawY - 5);
        }

        ctx.restore();
    }
}
