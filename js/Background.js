export const Biomes = {
    PLAINS: {
        sky: { day: ['#87CEEB', '#E0F7FA'], sunset: ['#FF7F50', '#FFD700'], night: ['#191970', '#483D8B'] },
        mountains: { far: '#B8C5D6', near: '#6B8E6B' },
        ground: { top: '#228B22', middle: '#8B4513', bottom: '#696969' },
        bush: { main: '#2E7D32', highlight: '#4CAF50' }
    },
    DESERT: {
        sky: { day: ['#87CEEB', '#FFF3E0'], sunset: ['#FF6F00', '#FFD54F'], night: ['#212121', '#424242'] },
        mountains: { far: '#D7CCC8', near: '#A1887F' }, // Sandy mountains
        ground: { top: '#FDD835', middle: '#FBC02D', bottom: '#5D4037' }, // Sand
        bush: { main: '#558B2F', highlight: '#7CB342' } // Cactus-ish green
    },
    SNOW: {
        sky: { day: ['#B3E5FC', '#E1F5FE'], sunset: ['#F48FB1', '#F8BBD0'], night: ['#1A237E', '#303F9F'] },
        mountains: { far: '#CFD8DC', near: '#90A4AE' }, // Snowy mountains
        ground: { top: '#FFFFFF', middle: '#ECEFF1', bottom: '#78909C' }, // Snow
        bush: { main: '#00695C', highlight: '#4DB6AC' } // Frozen bushes
    },
    SPOOKY: {
        sky: { day: ['#4A148C', '#7B1FA2'], sunset: ['#311B92', '#4527A0'], night: ['#000000', '#212121'] },
        mountains: { far: '#424242', near: '#212121' }, // Dark mountains
        ground: { top: '#3E2723', middle: '#263238', bottom: '#000000' }, // Dark earth
        bush: { main: '#1B5E20', highlight: '#388E3C' } // Dark green
    }
};

export class Background {
    constructor(canvasWidth, groundY) {
        this.canvasWidth = canvasWidth;
        this.groundY = groundY;
        this.tiles = null;

        // Multi-layer parallax elements
        this.farMountains = this.generateMountains(4, 0.6);
        this.nearMountains = this.generateMountains(6, 0.8);
        this.clouds = this.generateClouds(8);
        this.bushes = this.generateBushes(12);

        // Weather System
        this.weather = 'CLEAR';
        this.weatherTimer = 0;
        this.weatherDuration = 600 + Math.random() * 600;
        this.particles = [];
        this.skyColorOffset = 0;

        // Biome System
        this.currentBiome = 'PLAINS';
        this.biomeData = Biomes.PLAINS;
    }

    setBiome(biomeType) {
        if (Biomes[biomeType]) {
            this.currentBiome = biomeType;
            this.biomeData = Biomes[biomeType];

            // Reset weather on biome change for thematic consistency
            if (biomeType === 'SNOW') this.weather = 'SNOW';
            else if (biomeType === 'DESERT') this.weather = 'CLEAR';
            else if (biomeType === 'SPOOKY') this.weather = Math.random() > 0.5 ? 'RAIN' : 'CLEAR';
            else this.weather = Math.random() > 0.7 ? 'RAIN' : 'CLEAR';
        }
    }

    generateMountains(count, sizeFactor) {
        const mountains = [];
        for (let i = 0; i < count; i++) {
            mountains.push({
                x: i * (this.canvasWidth / count) + Math.random() * 200,
                width: 150 + Math.random() * 200 * sizeFactor,
                height: 80 + Math.random() * 100 * sizeFactor
            });
        }
        return mountains;
    }

    generateClouds(count) {
        const clouds = [];
        for (let i = 0; i < count; i++) {
            // Create multi-part clouds for fluffiness
            const parts = [];
            const numParts = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numParts; j++) {
                parts.push({
                    xOffset: (Math.random() - 0.5) * 40,
                    yOffset: (Math.random() - 0.5) * 20,
                    radius: 20 + Math.random() * 15
                });
            }

            clouds.push({
                x: Math.random() * this.canvasWidth * 2,
                y: 50 + Math.random() * 150,
                baseRadius: 30,
                speed: 0.05 + Math.random() * 0.1, // Slower, more majestic
                parts: parts,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
        return clouds;
    }

    generateBushes(count) {
        const bushes = [];
        for (let i = 0; i < count; i++) {
            bushes.push({
                x: i * (this.canvasWidth / count) * 1.5 + Math.random() * 100,
                size: 15 + Math.random() * 25
            });
        }
        return bushes;
    }

    update(score = 0) {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            // Gentle floating
            cloud.floatOffset += 0.01;

            if (cloud.x - 100 > this.canvasWidth * 2) {
                cloud.x = -100;
            }
        });
        this.currentScore = score;

        // Update Weather
        this.updateWeather();
        this.updateParticles();
    }

    // ... (updateWeather and updateParticles remain unchanged)
    updateWeather() {
        this.weatherTimer++;
        if (this.weatherTimer > this.weatherDuration) {
            this.weatherTimer = 0;
            this.weatherDuration = 600 + Math.random() * 600;

            // Weather logic based on biome
            const rand = Math.random();
            if (this.currentBiome === 'SNOW') {
                this.weather = rand < 0.8 ? 'SNOW' : 'CLEAR';
            } else if (this.currentBiome === 'DESERT') {
                this.weather = 'CLEAR';
            } else {
                if (rand < 0.3) this.weather = 'CLEAR';
                else if (rand < 0.65) this.weather = 'RAIN';
                else this.weather = 'CLEAR'; // No snow in plains/spooky usually
            }

            if (this.weather === 'CLEAR') this.particles = [];
        }

        // Generate particles
        if (this.weather === 'RAIN') {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: Math.random() * this.canvasWidth + (Math.random() * 500),
                    y: -20,
                    vx: -2 - Math.random() * 2,
                    vy: 10 + Math.random() * 5,
                    length: 10 + Math.random() * 10,
                    type: 'rain'
                });
            }
        } else if (this.weather === 'SNOW') {
            if (Math.random() > 0.5) {
                this.particles.push({
                    x: Math.random() * this.canvasWidth,
                    y: -10,
                    vx: -1 + Math.random() * 2,
                    vy: 1 + Math.random() * 2,
                    size: 2 + Math.random() * 3,
                    type: 'snow',
                    angle: Math.random() * Math.PI * 2
                });
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.type === 'snow') {
                p.x += Math.sin(p.angle) * 0.5;
                p.angle += 0.05;
            }

            if (p.y > this.groundY || p.x < -100 || p.x > this.canvasWidth + 100) {
                this.particles.splice(i, 1);
            }
        }
    }

    setTiles(spriteSheet) {
        this.tiles = spriteSheet;
    }

    draw(ctx, canvasHeight, camera) {
        this.drawSky(ctx, canvasHeight);
        this.drawFarMountains(ctx, camera);
        this.drawNearMountains(ctx, camera);
        this.drawClouds(ctx, camera);
        this.drawBushes(ctx, camera);
        this.drawGround(ctx, canvasHeight, camera);
        this.drawWeather(ctx);
    }

    drawWeather(ctx) {
        // ... (unchanged)
        ctx.save();
        this.particles.forEach(p => {
            if (p.type === 'rain') {
                ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + p.vy);
                ctx.stroke();
            } else if (p.type === 'snow') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Overlay for atmosphere
        if (this.weather === 'RAIN') {
            ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
            ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
        } else if (this.weather === 'SNOW') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
        }
        ctx.restore();
    }

    drawSky(ctx, canvasHeight) {
        // ... (unchanged)
        const cycle = (this.currentScore || 0) % 5000;
        let topColor, bottomColor;
        const colors = this.biomeData.sky;

        if (cycle < 2000) { [topColor, bottomColor] = colors.day; }
        else if (cycle < 3500) { [topColor, bottomColor] = colors.sunset; }
        else { [topColor, bottomColor] = colors.night; }

        const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.groundY);

        if (cycle >= 3500 && this.weather !== 'RAIN') {
            ctx.fillStyle = '#FFF';
            for (let i = 0; i < 50; i++) {
                const x = (i * 137) % this.canvasWidth;
                const y = (i * 53) % (this.groundY * 0.8);
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }

    drawFarMountains(ctx, camera) {
        ctx.fillStyle = this.biomeData.mountains.far;
        const parallaxFactor = 0.05; // More distant feel
        const width = this.canvasWidth * 2;

        this.farMountains.forEach(m => {
            let relX = (m.x - camera.x * parallaxFactor) % width;
            if (relX < -200) relX += width;
            if (relX > this.canvasWidth) relX -= width;

            ctx.beginPath();
            ctx.moveTo(relX, this.groundY);
            ctx.lineTo(relX + m.width / 2, this.groundY - m.height);
            ctx.lineTo(relX + m.width, this.groundY);
            ctx.closePath();
            ctx.fill();
        });
    }

    drawNearMountains(ctx, camera) {
        ctx.fillStyle = this.biomeData.mountains.near;
        const parallaxFactor = 0.15; // Distinct from far mountains
        const width = this.canvasWidth * 2;

        this.nearMountains.forEach(m => {
            let relX = (m.x - camera.x * parallaxFactor) % width;
            if (relX < -200) relX += width;
            if (relX > this.canvasWidth) relX -= width;

            ctx.beginPath();
            ctx.moveTo(relX, this.groundY);
            ctx.quadraticCurveTo(relX + m.width / 2, this.groundY - m.height, relX + m.width, this.groundY);
            ctx.closePath();
            ctx.fill();
        });
    }

    drawClouds(ctx, camera) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        const parallaxFactor = 0.1; // Clouds move slowly
        const width = this.canvasWidth * 2;

        this.clouds.forEach(cloud => {
            let relX = (cloud.x - camera.x * parallaxFactor) % width;
            if (relX < -150) relX += width;
            if (relX > this.canvasWidth) relX -= width;

            const floatY = cloud.y + Math.sin(cloud.floatOffset) * 10;

            ctx.beginPath();
            // Draw cloud parts
            cloud.parts.forEach(part => {
                ctx.arc(relX + part.xOffset, floatY + part.yOffset, part.radius, 0, Math.PI * 2);
            });
            ctx.closePath();
            ctx.fill();
        });
    }

    drawBushes(ctx, camera) {
        const parallaxFactor = 0.7;
        const width = this.canvasWidth * 1.5;

        this.bushes.forEach(bush => {
            let relX = (bush.x - camera.x * parallaxFactor) % width;
            if (relX < -50) relX += width;
            if (relX > this.canvasWidth) relX -= width;

            // Main bush color
            ctx.fillStyle = this.biomeData.bush.main;
            ctx.beginPath();
            ctx.arc(relX, this.groundY - bush.size / 2, bush.size, 0, Math.PI * 2);
            ctx.arc(relX + bush.size * 0.8, this.groundY - bush.size / 2, bush.size * 0.8, 0, Math.PI * 2);
            ctx.arc(relX - bush.size * 0.6, this.groundY - bush.size / 2, bush.size * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = this.biomeData.bush.highlight;
            ctx.beginPath();
            ctx.arc(relX, this.groundY - bush.size, bush.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawGround(ctx, canvasHeight, camera) {
        const groundHeight = canvasHeight - this.groundY;
        const tileSize = 800;
        const scrollX = -camera.x % tileSize;
        const tilesNeeded = Math.ceil(this.canvasWidth / tileSize) + 1;

        for (let i = 0; i < tilesNeeded; i++) {
            const drawX = scrollX + (i * tileSize);
            if (drawX + tileSize < 0) continue;

            // Top layer
            ctx.fillStyle = this.biomeData.ground.top;
            ctx.fillRect(drawX, this.groundY, tileSize, 10);

            // Middle layer
            ctx.fillStyle = this.biomeData.ground.middle;
            ctx.fillRect(drawX, this.groundY + 10, tileSize, 25);

            // Bottom layer
            ctx.fillStyle = this.biomeData.ground.bottom;
            ctx.fillRect(drawX, this.groundY + 35, tileSize, groundHeight - 35);
        }
    }
}
