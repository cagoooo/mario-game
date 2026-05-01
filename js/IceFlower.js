/**
 * IceFlower.js - Ice Power-up Item
 * 
 * Grants the player the ability to shoot iceballs that freeze enemies.
 * @version 2.9.0
 */

export class IceFlower {
    constructor(x, y) {
        this.width = 28;
        this.height = 32;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.collected = false;
        this.spawning = true;
        this.spawnY = y;
        this.targetY = y - 32;
        this.spawnProgress = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.glowPhase = 0;
    }

    spawn() {
        this.spawning = true;
        this.spawnProgress = 0;
    }

    update(platforms, groundY, levelWidth) {
        // Spawn animation - rise from block
        if (this.spawning) {
            this.spawnProgress += 0.03;
            this.y = this.spawnY - (this.spawnY - this.targetY) * Math.min(this.spawnProgress, 1);

            if (this.spawnProgress >= 1) {
                this.spawning = false;
                this.y = this.targetY;
            }
            return;
        }

        // Animation
        this.animationTimer++;
        if (this.animationTimer >= 8) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }

        this.glowPhase += 0.1;
    }

    draw(ctx, camera) {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y;

        ctx.save();

        // Glow effect
        const glowIntensity = 0.3 + Math.sin(this.glowPhase) * 0.2;
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 15 * glowIntensity;

        // Stem
        ctx.fillStyle = '#90EE90'; // Light green
        ctx.fillRect(screenX + 11, screenY + 20, 6, 12);

        // Leaves
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 24, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 24, 6, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Ice crystal petals
        const petalColors = ['#E0FFFF', '#B0E0E6', '#87CEEB', '#ADD8E6'];
        const centerX = screenX + 14;
        const centerY = screenY + 10;

        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + (this.animationFrame * 0.1);
            const petalX = centerX + Math.cos(angle) * 8;
            const petalY = centerY + Math.sin(angle) * 6;

            ctx.fillStyle = petalColors[i];
            ctx.beginPath();
            ctx.ellipse(petalX, petalY, 7, 5, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center crystal
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle effect
        const sparkleOffset = Math.sin(this.glowPhase * 2) * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX - 3 + sparkleOffset, centerY - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
