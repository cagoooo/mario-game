import { ObjectPool } from './ObjectPool.js?v=1.8.0';

// Enhanced Particle Types with special effects
const PARTICLE_PRESETS = {
    normal: {
        gravity: 0.2,
        friction: 1,
        shrinkRate: 1,
        blend: 'source-over',
        glow: false
    },
    sparkle: {
        gravity: 0.05,
        friction: 0.98,
        shrinkRate: 0.95,
        blend: 'lighter',
        glow: true,
        glowSize: 2
    },
    dust: {
        gravity: -0.02,
        friction: 0.9,
        shrinkRate: 0.95,
        blend: 'source-over',
        glow: false
    },
    fire: {
        gravity: -0.15,
        friction: 0.95,
        shrinkRate: 0.92,
        blend: 'lighter',
        glow: true,
        glowSize: 3,
        colorShift: true,
        colors: ['#FF4500', '#FF6B00', '#FFD700', '#FFF']
    },
    smoke: {
        gravity: -0.08,
        friction: 0.97,
        shrinkRate: 0.98,
        blend: 'source-over',
        glow: false,
        expand: true
    },
    magic: {
        gravity: 0,
        friction: 0.98,
        shrinkRate: 0.96,
        blend: 'lighter',
        glow: true,
        glowSize: 4,
        rainbow: true,
        spiral: true
    },
    water: {
        gravity: 0.3,
        friction: 0.99,
        shrinkRate: 0.97,
        blend: 'source-over',
        glow: false,
        bounce: true
    },
    star: {
        gravity: 0.02,
        friction: 0.99,
        shrinkRate: 0.98,
        blend: 'lighter',
        glow: true,
        glowSize: 5,
        twinkle: true
    }
};

export class ParticleSystem {
    constructor() {
        this.MAX_PARTICLES = 150; // Performance limit
        this.pool = new ObjectPool(
            () => ({
                x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0,
                color: '', size: 0, type: 'normal',
                rotation: 0, rotationSpeed: 0,
                startSize: 0, time: 0
            }),
            (p, x, y, options = {}) => {
                p.x = x;
                p.y = y;
                p.vx = options.vx || (Math.random() - 0.5) * 8;
                p.vy = options.vy || (Math.random() - 0.5) * 8 - 3;
                p.life = options.life || 60 + Math.random() * 30;
                p.maxLife = p.life;
                p.color = options.color || '#fff';
                p.size = options.size || 3 + Math.random() * 4;
                p.startSize = p.size;
                p.type = options.type || 'normal';
                p.rotation = Math.random() * Math.PI * 2;
                p.rotationSpeed = (Math.random() - 0.5) * 0.2;
                p.time = 0;
            }
        );
        this.activeParticles = [];
    }

    emit(x, y, count, color, type = 'normal') {
        // Limit total particles for performance
        const availableSlots = this.MAX_PARTICLES - this.activeParticles.length;
        const actualCount = Math.min(count, availableSlots);
        if (actualCount <= 0) return;

        const preset = PARTICLE_PRESETS[type] || PARTICLE_PRESETS.normal;

        for (let i = 0; i < actualCount; i++) {
            let options = { color, type };

            switch (type) {
                case 'sparkle':
                    options.vx = (Math.random() - 0.5) * 9;
                    options.vy = (Math.random() - 0.5) * 9;
                    options.size = Math.random() * 3 + 2;
                    options.life = 30 + Math.random() * 15;
                    break;
                case 'dust':
                    options.vx = (Math.random() - 0.5) * 2;
                    options.vy = -Math.random() * 2;
                    options.life = 20 + Math.random() * 10;
                    options.size = Math.random() * 4 + 2;
                    options.color = 'rgba(255, 255, 255, 0.5)';
                    break;
                case 'fire':
                    options.vx = (Math.random() - 0.5) * 4;
                    options.vy = -Math.random() * 5 - 2;
                    options.life = 40 + Math.random() * 20;
                    options.size = Math.random() * 8 + 4;
                    break;
                case 'smoke':
                    options.vx = (Math.random() - 0.5) * 2;
                    options.vy = -Math.random() * 2 - 1;
                    options.life = 60 + Math.random() * 30;
                    options.size = Math.random() * 10 + 5;
                    options.color = `rgba(100, 100, 100, ${0.3 + Math.random() * 0.3})`;
                    break;
                case 'magic':
                    const angle = (i / count) * Math.PI * 2;
                    options.vx = Math.cos(angle) * 3 + (Math.random() - 0.5) * 2;
                    options.vy = Math.sin(angle) * 3 + (Math.random() - 0.5) * 2;
                    options.life = 50 + Math.random() * 30;
                    options.size = Math.random() * 5 + 3;
                    break;
                case 'water':
                    options.vx = (Math.random() - 0.5) * 6;
                    options.vy = -Math.random() * 8 - 2;
                    options.life = 40 + Math.random() * 20;
                    options.size = Math.random() * 4 + 2;
                    options.color = `rgba(100, 180, 255, ${0.5 + Math.random() * 0.3})`;
                    break;
                case 'star':
                    options.vx = (Math.random() - 0.5) * 6;
                    options.vy = (Math.random() - 0.5) * 6;
                    options.life = 60 + Math.random() * 40;
                    options.size = Math.random() * 6 + 4;
                    break;
                default:
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

    // Emit fire effect
    emitFire(x, y, count = 10) {
        this.emit(x, y, count, '#FF4500', 'fire');
    }

    // Emit smoke effect
    emitSmoke(x, y, count = 5) {
        this.emit(x, y, count, '#666', 'smoke');
    }

    // Emit magic sparkles
    emitMagic(x, y, count = 15) {
        this.emit(x, y, count, '#FF00FF', 'magic');
    }

    // Emit water splash
    emitWater(x, y, count = 8) {
        this.emit(x, y, count, '#64B4FF', 'water');
    }

    // Emit star burst
    emitStars(x, y, count = 12) {
        this.emit(x, y, count, '#FFD700', 'star');
    }

    update() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            const preset = PARTICLE_PRESETS[p.type] || PARTICLE_PRESETS.normal;

            p.x += p.vx;
            p.y += p.vy;
            p.time++;
            p.life--;

            // Apply gravity
            p.vy += preset.gravity;

            // Apply friction
            p.vx *= preset.friction;
            p.vy *= preset.friction;

            // Apply shrink or expand
            if (preset.expand) {
                p.size *= 1.02;
            } else {
                p.size *= preset.shrinkRate;
            }

            // Rotation
            p.rotation += p.rotationSpeed;

            // Spiral effect for magic
            if (preset.spiral) {
                p.vx += Math.sin(p.time * 0.1) * 0.1;
                p.vy += Math.cos(p.time * 0.1) * 0.1;
            }

            // Bounce effect for water
            if (preset.bounce && p.y > 400) { // Ground level approximation
                p.vy = -Math.abs(p.vy) * 0.5;
                p.y = 400;
            }

            if (p.life <= 0 || p.size < 0.1) {
                this.pool.release(p);
                this.activeParticles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        // Group particles by blend mode for efficiency
        const blendGroups = {};

        this.activeParticles.forEach(p => {
            const preset = PARTICLE_PRESETS[p.type] || PARTICLE_PRESETS.normal;
            const blend = preset.blend || 'source-over';
            if (!blendGroups[blend]) blendGroups[blend] = [];
            blendGroups[blend].push(p);
        });

        // Draw each blend group
        for (const [blend, particles] of Object.entries(blendGroups)) {
            ctx.save();
            ctx.globalCompositeOperation = blend;

            particles.forEach(p => {
                const screenX = p.x - camera.x;
                const preset = PARTICLE_PRESETS[p.type] || PARTICLE_PRESETS.normal;

                // Calculate alpha
                let alpha = p.life / p.maxLife;
                if (alpha > 1) alpha = 1;
                if (alpha < 0) alpha = 0;

                // Twinkle effect
                if (preset.twinkle) {
                    alpha *= 0.5 + Math.sin(p.time * 0.3) * 0.5;
                }

                ctx.globalAlpha = alpha;

                // Get color
                let color = p.color;
                if (preset.rainbow) {
                    const hue = (p.time * 10 + p.x) % 360;
                    color = `hsl(${hue}, 100%, 60%)`;
                } else if (preset.colorShift && preset.colors) {
                    const colorIndex = Math.floor((1 - p.life / p.maxLife) * preset.colors.length);
                    color = preset.colors[Math.min(colorIndex, preset.colors.length - 1)];
                }

                // Glow effect
                if (preset.glow) {
                    ctx.shadowBlur = p.size * (preset.glowSize || 2);
                    ctx.shadowColor = color;
                }

                ctx.fillStyle = color;
                ctx.beginPath();

                // Different shapes for different types
                if (p.type === 'star') {
                    this.drawStar(ctx, screenX, p.y, p.size, 5, p.rotation);
                } else {
                    ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
                }

                ctx.fill();
                ctx.shadowBlur = 0;
            });

            ctx.restore();
        }
    }

    drawStar(ctx, x, y, radius, points, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();

        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : radius / 2;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            if (i === 0) {
                ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
            } else {
                ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
        }

        ctx.closePath();
        ctx.fill();
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

    // Get particle count for debugging
    getParticleCount() {
        return this.activeParticles.length;
    }
}
