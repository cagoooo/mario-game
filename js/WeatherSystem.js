// WeatherSystem - Dynamic weather effects based on biome
export class WeatherSystem {
    constructor(game) {
        this.game = game;
        this.currentWeather = 'clear';
        this.particles = [];
        this.maxParticles = 200;
        this.intensity = 0;
        this.targetIntensity = 0;
        this.transitionSpeed = 0.02;
        this.time = 0;

        // Weather types per biome
        this.biomeWeather = {
            PLAINS: ['clear', 'cloudy', 'rain'],
            DESERT: ['clear', 'sandstorm'],
            SNOW: ['snow', 'blizzard'],
            SPOOKY: ['fog', 'rain']
        };
    }

    update() {
        this.time++;

        // Smooth intensity transition
        if (this.intensity < this.targetIntensity) {
            this.intensity = Math.min(this.intensity + this.transitionSpeed, this.targetIntensity);
        } else if (this.intensity > this.targetIntensity) {
            this.intensity = Math.max(this.intensity - this.transitionSpeed, this.targetIntensity);
        }

        // Spawn new particles based on weather
        this.spawnParticles();

        // Update existing particles
        this.updateParticles();

        // Random weather change
        if (this.time % 600 === 0 && Math.random() < 0.3) {
            this.randomizeWeather();
        }
    }

    setWeather(weather, intensity = 1) {
        this.currentWeather = weather;
        this.targetIntensity = intensity;
    }

    randomizeWeather() {
        const biome = this.game.currentBiome;
        const options = this.biomeWeather[biome] || ['clear'];
        const newWeather = options[Math.floor(Math.random() * options.length)];
        this.setWeather(newWeather, 0.5 + Math.random() * 0.5);
    }

    spawnParticles() {
        if (this.particles.length >= this.maxParticles) return;

        const spawnRate = this.intensity * 5;

        for (let i = 0; i < spawnRate; i++) {
            if (this.particles.length >= this.maxParticles) break;

            const particle = this.createParticle();
            if (particle) this.particles.push(particle);
        }
    }

    createParticle() {
        const x = this.game.camera.x + Math.random() * this.game.width * 1.5;
        const y = -20 - Math.random() * 50;

        switch (this.currentWeather) {
            case 'rain':
                return {
                    x, y,
                    vx: -2 + Math.random() * -2,
                    vy: 10 + Math.random() * 5,
                    size: 2,
                    length: 10 + Math.random() * 10,
                    color: 'rgba(150, 180, 255, 0.6)',
                    type: 'rain'
                };
            case 'snow':
                return {
                    x, y,
                    vx: Math.sin(this.time * 0.01 + x) * 0.5,
                    vy: 1 + Math.random() * 2,
                    size: 2 + Math.random() * 4,
                    color: 'rgba(255, 255, 255, 0.8)',
                    type: 'snow',
                    wobble: Math.random() * Math.PI * 2
                };
            case 'sandstorm':
                return {
                    x, y: this.game.height * 0.3 + Math.random() * this.game.height * 0.7,
                    vx: 8 + Math.random() * 10,
                    vy: (Math.random() - 0.5) * 2,
                    size: 1 + Math.random() * 3,
                    color: `rgba(210, 180, 140, ${0.3 + Math.random() * 0.4})`,
                    type: 'sand'
                };
            case 'blizzard':
                return {
                    x, y,
                    vx: -3 + Math.random() * -5,
                    vy: 2 + Math.random() * 4,
                    size: 3 + Math.random() * 5,
                    color: 'rgba(255, 255, 255, 0.9)',
                    type: 'snow',
                    wobble: Math.random() * Math.PI * 2
                };
            case 'fog':
                if (Math.random() > 0.1) return null;
                return {
                    x: this.game.camera.x + Math.random() * this.game.width,
                    y: this.game.height * 0.5 + Math.random() * this.game.height * 0.5,
                    vx: 0.2 + Math.random() * 0.3,
                    vy: (Math.random() - 0.5) * 0.2,
                    size: 50 + Math.random() * 100,
                    alpha: 0.1 + Math.random() * 0.2,
                    type: 'fog'
                };
            default:
                return null;
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;

            // Snow wobble
            if (p.type === 'snow') {
                p.wobble += 0.05;
                p.x += Math.sin(p.wobble) * 0.5;
            }

            // Remove off-screen particles
            const screenX = p.x - this.game.camera.x;
            if (screenX < -50 || screenX > this.game.width + 50 ||
                p.y > this.game.height + 50 || p.y < -100) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        if (this.currentWeather === 'clear' || this.intensity === 0) return;

        ctx.save();

        // Draw overlay for some weather types
        if (this.currentWeather === 'fog') {
            ctx.fillStyle = `rgba(200, 200, 220, ${this.intensity * 0.3})`;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
        } else if (this.currentWeather === 'sandstorm') {
            ctx.fillStyle = `rgba(210, 180, 140, ${this.intensity * 0.2})`;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
        }

        // Draw particles
        this.particles.forEach(p => {
            const screenX = p.x - camera.x;

            ctx.globalAlpha = p.alpha || 1;

            if (p.type === 'rain') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(screenX, p.y);
                ctx.lineTo(screenX + p.vx, p.y + p.length);
                ctx.stroke();
            } else if (p.type === 'snow' || p.type === 'sand') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'fog') {
                const gradient = ctx.createRadialGradient(screenX, p.y, 0, screenX, p.y, p.size);
                gradient.addColorStop(0, `rgba(200, 200, 220, ${p.alpha})`);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }

    getWeatherInfo() {
        return {
            weather: this.currentWeather,
            intensity: this.intensity,
            particleCount: this.particles.length
        };
    }
}
