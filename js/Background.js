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
        // Weather System
        // Force initial weather to be interesting (Rain or Snow) for testing/showcase
        this.weather = Math.random() > 0.5 ? 'RAIN' : 'SNOW';
        this.weatherTimer = 0;
        this.weatherDuration = 600 + Math.random() * 600; // 10-20 seconds (shorter for more variety)
        this.particles = [];
        this.skyColorOffset = 0; // For smooth transition
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
            clouds.push({
                x: Math.random() * this.canvasWidth * 2,
                y: 30 + Math.random() * 100,
                radius: 20 + Math.random() * 30,
                speed: 0.1 + Math.random() * 0.3
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
            if (cloud.x - cloud.radius * 2 > this.canvasWidth * 2) {
                cloud.x = -cloud.radius * 2;
            }
        });
        this.currentScore = score;

        // Update Weather
        this.updateWeather();
        this.updateParticles();
    }

    updateWeather() {
        this.weatherTimer++;
        if (this.weatherTimer > this.weatherDuration) {
            this.weatherTimer = 0;
            this.weatherDuration = 600 + Math.random() * 600; // 10-20 seconds

            // Random weather change
            // Random weather change
            const rand = Math.random();
            if (rand < 0.3) this.weather = 'CLEAR';      // 30% Clear
            else if (rand < 0.65) this.weather = 'RAIN'; // 35% Rain
            else this.weather = 'SNOW';                  // 35% Snow

            // Reset particles on change
            if (this.weather === 'CLEAR') this.particles = [];
        }

        // Generate particles
        if (this.weather === 'RAIN') {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: Math.random() * this.canvasWidth + (Math.random() * 500), // Spread wider for wind
                    y: -20,
                    vx: -2 - Math.random() * 2,
                    vy: 10 + Math.random() * 5,
                    length: 10 + Math.random() * 10,
                    type: 'rain'
                });
            }
        } else if (this.weather === 'SNOW') {
            if (Math.random() > 0.5) { // Less dense than rain
                this.particles.push({
                    x: Math.random() * this.canvasWidth,
                    y: -10,
                    vx: -1 + Math.random() * 2, // Drift
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
            ctx.fillStyle = 'rgba(0, 0, 20, 0.1)'; // Darken slightly
            ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
        } else if (this.weather === 'SNOW') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Lighten slightly
            ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
        }

        ctx.restore();
    }

    drawSky(ctx, canvasHeight) {
        // Dynamic sky based on score (Day -> Sunset -> Night)
        // Cycle every 500 points (faster cycle)
        const cycle = (this.currentScore || 0) % 500;
        let topColor, bottomColor;

        if (cycle < 200) {
            // Day (0-200)
            if (this.weather === 'RAIN') {
                topColor = '#4a5b6c'; // Gloomy gray
                bottomColor = '#8fa3b8';
            } else if (this.weather === 'SNOW') {
                topColor = '#a8c0d8'; // Snowy white-blue
                bottomColor = '#e6f0fa';
            } else {
                topColor = '#87CEEB';
                bottomColor = '#E0F7FA';
            }
        } else if (cycle < 350) {
            // Sunset transition (200-350)
            if (this.weather === 'RAIN') {
                topColor = '#5d4037'; // Dark muddy
                bottomColor = '#8d6e63';
            } else {
                topColor = '#FF7F50'; // Coral
                bottomColor = '#FFD700'; // Gold
            }
        } else {
            // Night (350-500)
            topColor = '#191970'; // MidnightBlue
            bottomColor = '#483D8B'; // DarkSlateBlue
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.groundY);

        // Draw stars if night
        if (cycle >= 350 && this.weather !== 'RAIN') {
            ctx.fillStyle = '#FFF';
            for (let i = 0; i < 50; i++) {
                const x = (i * 137) % this.canvasWidth;
                const y = (i * 53) % (this.groundY * 0.8);
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }

    drawFarMountains(ctx, camera) {
        ctx.fillStyle = '#B8C5D6'; // Distant blue-gray
        const parallaxFactor = 0.1;
        const width = this.canvasWidth * 2; // Repeat width

        this.farMountains.forEach(m => {
            // Calculate relative position with wrapping
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
        ctx.fillStyle = '#6B8E6B'; // Green hills
        const parallaxFactor = 0.25;
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const parallaxFactor = 0.15;
        const width = this.canvasWidth * 2;

        this.clouds.forEach(cloud => {
            let relX = (cloud.x - camera.x * parallaxFactor) % width;
            if (relX < -100) relX += width;
            if (relX > this.canvasWidth) relX -= width;

            ctx.beginPath();
            ctx.arc(relX, cloud.y, cloud.radius, 0, Math.PI * 2);
            ctx.arc(relX + cloud.radius * 0.8, cloud.y, cloud.radius * 1.2, 0, Math.PI * 2);
            ctx.arc(relX - cloud.radius * 0.8, cloud.y, cloud.radius * 1.1, 0, Math.PI * 2);
            ctx.arc(relX + cloud.radius * 0.3, cloud.y - cloud.radius * 0.5, cloud.radius * 0.8, 0, Math.PI * 2);
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

            // Dark green bush
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(relX, this.groundY - bush.size / 2, bush.size, 0, Math.PI * 2);
            ctx.arc(relX + bush.size * 0.8, this.groundY - bush.size / 2, bush.size * 0.8, 0, Math.PI * 2);
            ctx.arc(relX - bush.size * 0.6, this.groundY - bush.size / 2, bush.size * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Lighter highlights
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(relX, this.groundY - bush.size, bush.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawGround(ctx, canvasHeight, camera) {
        const groundHeight = canvasHeight - this.groundY;
        const tileSize = 800; // Keep texture tile size fixed
        const scrollX = -camera.x % tileSize;

        // Draw enough tiles to cover the screen width + buffer
        const tilesNeeded = Math.ceil(this.canvasWidth / tileSize) + 1;

        for (let i = 0; i < tilesNeeded; i++) {
            const drawX = scrollX + (i * tileSize);
            if (drawX + tileSize < 0) continue; // Skip if off-screen left

            // Grass layer on top
            ctx.fillStyle = '#228B22';
            ctx.fillRect(drawX, this.groundY, tileSize, 10);

            // Grass texture (triangles)
            ctx.fillStyle = '#32CD32';
            for (let j = 0; j < tileSize; j += 12) {
                ctx.beginPath();
                ctx.moveTo(drawX + j, this.groundY);
                ctx.lineTo(drawX + j + 6, this.groundY - 8);
                ctx.lineTo(drawX + j + 12, this.groundY);
                ctx.fill();
            }

            // Brown soil layer
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(drawX, this.groundY + 10, tileSize, 25);

            // Soil texture (darker lines)
            ctx.fillStyle = '#654321';
            for (let j = 0; j < tileSize; j += 30) {
                ctx.fillRect(drawX + j, this.groundY + 15, 20, 3);
            }

            // Stone/bedrock layer
            ctx.fillStyle = '#696969';
            ctx.fillRect(drawX, this.groundY + 35, tileSize, groundHeight - 35);

            // Stone texture
            ctx.fillStyle = '#808080';
            for (let j = 0; j < tileSize; j += 40) {
                ctx.beginPath();
                ctx.arc(drawX + j + 20, this.groundY + 50, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
