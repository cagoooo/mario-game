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
                options.life = 30 + Math.random() * 15;
            } else if (type === 'dust') {
                options.vx = (Math.random() - 0.5) * 2;
                options.vy = -Math.random() * 2; // Float up
                options.life = 20 + Math.random() * 10;
                options.size = Math.random() * 4 + 2;
                options.color = 'rgba(255, 255, 255, 0.5)';
            } else {
                // Normal
                options.vx = (Math.random() - 0.5) * 8;
                options.vy = (Math.random() - 0.5) * 8 - 3;
                options.life = 40 + Math.random() * 20;
            }

            const p = this.pool.get(x, y, options);
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

            // Normalize life logic: life is in frames (e.g., 60)
            p.life--;

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
        this.activeParticles.forEach(p => {
            const screenX = p.x - camera.x;

            // Alpha based on remaining life (assuming max life ~60)
            let alpha = p.life / 60;
            if (alpha > 1) alpha = 1;
            if (alpha < 0) alpha = 0;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
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
