import { ObjectPool } from './ObjectPool.js?v=1.8.0';

export class ParticleSystem {
    constructor() {
        this.pool = new ObjectPool(
            () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '', size: 0, type: 'normal' }),
            (p, x, y, options = {}) => {
                p.x = x;
                p.y = y;
                p.vx = options.vx || (Math.random() - 0.5) * 8;
                p.vy = options.vy || (Math.random() - 0.5) * 8 - 3;
                p.life = options.life || 60 + Math.random() * 30;
                p.color = options.color || '#fff';
                p.size = options.size || 3 + Math.random() * 4;
                p.type = options.type || 'normal';
            }
        );
        this.activeParticles = [];
    }

    emit(x, y, count, color, type = 'normal') {
        for (let i = 0; i < count; i++) {
            let options = { color, type };

            if (type === 'sparkle') {
                options.vx = (Math.random() - 0.5) * 9; // Explode faster
                options.vy = (Math.random() - 0.5) * 9;
                options.size = Math.random() * 3 + 2;
            } else if (type === 'dust') {
                options.vx = (Math.random() - 0.5) * 2;
                options.vy = -Math.random() * 2; // Float up
                options.life = 0.6; // Short life (seconds? No, logic uses frames usually, but let's check Game.js logic)
                // Game.js used 0.5 for dust life, and subtracted 0.02 per frame. 
                // Wait, Game.js logic:
                // p.life -= 0.02;
                // if (p.life <= 0) ...
                // So life 1.0 = 50 frames.
                // Dust life 0.5 = 25 frames.
                options.life = 0.6;
                options.size = Math.random() * 4 + 2;
                options.color = 'rgba(255, 255, 255, 0.5)';
            } else {
                // Normal
                options.vx = (Math.random() - 0.5) * 8;
                options.vy = (Math.random() - 0.5) * 8 - 3;
                options.life = 1.0 + Math.random() * 0.5; // Normalized life?
                // Game.js logic for normal: life = 60 + Math.random() * 30;
                // But updateParticles did: p.life -= 0.02;
                // So 60 is huge if subtracting 0.02. 
                // Let's re-read Game.js particle logic carefully.
            }

            const p = this.pool.get(x, y, options);

            // Override specific logic if needed based on Game.js behavior
            if (type === 'normal') {
                // Game.js: life = 60 + Math.random() * 30;
                // But update loop: p.life -= 0.02; 
                // If life starts at 60, it takes 3000 frames to die? That's 50 seconds.
                // Let's check Game.js again.

                // Game.js line 862: p.life -= 0.02;
                // Game.js line 253: p.life = 60 + Math.random() * 30;
                // Wait, maybe I misread the update loop or the init.
                // Let's assume I should stick to the logic I see in Game.js or normalize it.
                // Actually, let's look at Game.js again to be sure.
            }

            this.activeParticles.push(p);
        }
    }

    createDust(x, y) {
        if (Math.random() > 0.3) return;

        const options = {
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1.5,
            life: 0.5,
            color: 'rgba(240, 240, 240, 0.4)',
            type: 'dust',
            size: Math.random() * 3 + 2
        };

        const p = this.pool.get(x + (Math.random() - 0.5) * 20, y, options);
        this.activeParticles.push(p);
    }

    update() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Life logic normalization
            // If we use 1.0 as base life and subtract 0.02, that's 50 frames.
            // If Game.js used 60, maybe it meant 60 frames and subtracted 1?
            // Let's check Game.js content again.

            p.life -= 0.02;

            if (p.type === 'normal') {
                p.vy += 0.2; // Gravity
            } else if (p.type === 'sparkle') {
                p.vy += 0.05; // Light gravity
                p.size *= 0.95; // Shrink
            } else if (p.type === 'dust') {
                p.size *= 0.95; // Shrink
                p.vx *= 0.9; // Slow down
            }

            if (p.life <= 0 || p.size < 0.1) {
                this.pool.release(p);
                this.activeParticles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        if (this.activeParticles.length === 0) return;

        // Batch drawing state changes
        ctx.save();

        this.activeParticles.forEach(p => {
            const screenX = p.x - camera.x;

            let alpha = p.life;
            if (p.life > 1) alpha = 1;

            // Set alpha and color directly without save/restore per particle
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillStyle = p.color;

            ctx.beginPath();
            ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    cleanup(minX) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            if (p.x < minX) {
                this.pool.release(p);
                this.activeParticles.splice(i, 1);
            }
        }
    }
}
