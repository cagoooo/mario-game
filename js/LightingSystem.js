// LightingSystem - Dynamic glow and ambient lighting effects
export class LightingSystem {
    constructor(game) {
        this.game = game;
        this.lights = [];
        this.ambientLight = 1.0; // 0-1 darkness level (1 = no darkening)
        this.time = 0;
    }

    update() {
        this.time++;

        // Update all lights
        this.lights = this.lights.filter(light => {
            if (light.temporary) {
                light.life--;
                return light.life > 0;
            }
            return true;
        });
    }

    // Add a temporary light (e.g., fireball glow)
    addLight(x, y, radius, color, intensity = 1, life = 30) {
        this.lights.push({
            x, y, radius, color, intensity, life, temporary: true
        });
    }

    draw(ctx, camera) {
        // Draw object glows first (behind objects)
        this.drawObjectGlows(ctx, camera);

        // Draw dynamic lights
        this.drawLights(ctx, camera);
    }

    drawObjectGlows(ctx, camera) {
        // Question blocks glow
        this.game.questionBlocks.forEach(block => {
            if (block.used) return;

            const screenX = block.x - camera.x + block.width / 2;
            const screenY = block.y + block.height / 2;

            // Pulsing glow
            const pulse = 0.5 + Math.sin(this.time * 0.05 + block.x * 0.01) * 0.3;
            this.drawGlow(ctx, screenX, screenY, 40, '#FFD700', pulse * 0.4);
        });

        // Coins glow
        this.game.coins.forEach(coin => {
            const screenX = coin.x - camera.x + coin.width / 2;
            const screenY = coin.y + coin.height / 2;

            const pulse = 0.5 + Math.sin(this.time * 0.08 + coin.x * 0.02) * 0.3;
            this.drawGlow(ctx, screenX, screenY, 25, '#FFD700', pulse * 0.3);
        });

        // Stars glow (rainbow)
        this.game.stars.forEach(star => {
            if (!star.active || star.spawning) return;

            const screenX = star.x - camera.x + star.width / 2;
            const screenY = star.y + star.height / 2;

            const hue = (this.time * 3 + star.x) % 360;
            const color = `hsl(${hue}, 100%, 50%)`;
            this.drawGlow(ctx, screenX, screenY, 50, color, 0.5);
        });

        // Lava glow
        this.game.lava.forEach(lava => {
            const screenX = lava.x - camera.x + lava.width / 2;
            const screenY = lava.y + lava.height / 2;

            const flicker = 0.5 + Math.sin(this.time * 0.1 + lava.x * 0.05) * 0.2;
            this.drawGlow(ctx, screenX, screenY - 30, lava.width, '#FF4500', flicker * 0.6);
        });

        // Fireballs glow
        this.game.fireballs.forEach(fb => {
            if (!fb.active) return;

            const screenX = fb.x - camera.x + fb.width / 2;
            const screenY = fb.y + fb.height / 2;

            this.drawGlow(ctx, screenX, screenY, 30, '#FF6600', 0.6);
        });

        // Mega mushroom glow
        this.game.megaMushrooms.forEach(mega => {
            if (!mega.active || mega.spawning) return;

            const screenX = mega.x - camera.x + mega.width / 2;
            const screenY = mega.y + mega.height / 2;

            const pulse = 0.5 + Math.sin(this.time * 0.1) * 0.3;
            this.drawGlow(ctx, screenX, screenY, 60, '#FFD700', pulse * 0.5);
        });

        // Player star power glow
        if (this.game.player && this.game.player.starPower) {
            const screenX = this.game.player.x - camera.x + this.game.player.width / 2;
            const screenY = this.game.player.y + this.game.player.height / 2;

            const hue = (this.time * 5) % 360;
            const color = `hsl(${hue}, 100%, 50%)`;
            this.drawGlow(ctx, screenX, screenY, 80, color, 0.6);
        }

        // Player mega glow
        if (this.game.player && this.game.player.isMega) {
            const screenX = this.game.player.x - camera.x + this.game.player.width / 2;
            const screenY = this.game.player.y + this.game.player.height / 2;

            const pulse = 0.5 + Math.sin(this.time * 0.08) * 0.3;
            this.drawGlow(ctx, screenX, screenY, 100, '#FFD700', pulse * 0.4);
        }
    }

    drawLights(ctx, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        this.lights.forEach(light => {
            const screenX = light.x - camera.x;
            const alpha = light.temporary ? (light.life / 30) * light.intensity : light.intensity;

            this.drawGlow(ctx, screenX, light.y, light.radius, light.color, alpha);
        });

        ctx.restore();
    }

    drawGlow(ctx, x, y, radius, color, intensity) {
        if (intensity <= 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = intensity;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.3, this.adjustColorAlpha(color, 0.5));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    adjustColorAlpha(color, alpha) {
        // Simple color to rgba conversion
        if (color.startsWith('hsl')) {
            return color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        } else if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    // Set ambient light level (for day/night cycle)
    setAmbientLight(level) {
        this.ambientLight = Math.max(0, Math.min(1, level));
    }

    // Draw ambient darkness overlay
    drawAmbientOverlay(ctx, width, height) {
        if (this.ambientLight >= 1) return;

        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 50, ${1 - this.ambientLight})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}
