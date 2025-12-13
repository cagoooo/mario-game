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
    }

    drawSky(ctx, canvasHeight) {
        // Dynamic sky based on score (Day -> Sunset -> Night)
        // Cycle every 500 points (faster cycle)
        const cycle = (this.currentScore || 0) % 500;
        let topColor, bottomColor;

        if (cycle < 200) {
            // Day (0-200)
            topColor = '#87CEEB';
            bottomColor = '#E0F7FA';
        } else if (cycle < 350) {
            // Sunset transition (200-350)
            topColor = '#FF7F50'; // Coral
            bottomColor = '#FFD700'; // Gold
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
        if (cycle >= 350) {
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
