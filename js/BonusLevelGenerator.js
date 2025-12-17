// BonusLevelGenerator - Creates diverse bonus level layouts
export class BonusLevelGenerator {
    constructor(width, height, groundY, coinPool) {
        this.width = width;
        this.height = height;
        this.groundY = groundY;
        this.coinPool = coinPool;

        // All available layouts
        this.layouts = [
            'CLASSIC', 'PYRAMID', 'SKY_STEPS', 'SPIRAL', 'DIAMOND',
            'ZIGZAG', 'CIRCLE', 'WAVE', 'TOWER', 'MAZE',
            'RAINBOW', 'STAR_PATTERN', 'CASCADE', 'TUNNELS'
        ];

        // Background color themes
        this.bgColors = [
            '#000000',  // Black
            '#1a0b2e',  // Deep purple
            '#001f3f',  // Navy
            '#2c0b0e',  // Dark red
            '#0b1f0b',  // Dark green
            '#1f1f0b',  // Dark gold
            '#0b1f1f',  // Dark teal
        ];
    }

    generate() {
        const result = {
            platforms: [],
            coins: [],
            bgColor: this.bgColors[Math.floor(Math.random() * this.bgColors.length)]
        };

        const layout = this.layouts[Math.floor(Math.random() * this.layouts.length)];
        console.log('Bonus Level Layout:', layout);

        // Add base platforms (floor, ceiling, walls)
        this.addBasePlatforms(result);

        // Generate specific layout
        switch (layout) {
            case 'CLASSIC':
                this.generateClassic(result);
                break;
            case 'PYRAMID':
                this.generatePyramid(result);
                break;
            case 'SKY_STEPS':
                this.generateSkySteps(result);
                break;
            case 'SPIRAL':
                this.generateSpiral(result);
                break;
            case 'DIAMOND':
                this.generateDiamond(result);
                break;
            case 'ZIGZAG':
                this.generateZigzag(result);
                break;
            case 'CIRCLE':
                this.generateCircle(result);
                break;
            case 'WAVE':
                this.generateWave(result);
                break;
            case 'TOWER':
                this.generateTower(result);
                break;
            case 'MAZE':
                this.generateMaze(result);
                break;
            case 'RAINBOW':
                this.generateRainbow(result);
                break;
            case 'STAR_PATTERN':
                this.generateStarPattern(result);
                break;
            case 'CASCADE':
                this.generateCascade(result);
                break;
            case 'TUNNELS':
                this.generateTunnels(result);
                break;
        }

        return result;
    }

    addBasePlatforms(result) {
        const ceilingY = 50;

        // Floor
        result.platforms.push({
            x: 0, y: this.groundY, width: this.width, height: 50,
            draw: (ctx) => {
                ctx.fillStyle = '#0055AA';
                ctx.fillRect(0, this.groundY, this.width, 50);
                ctx.strokeStyle = '#003366';
                ctx.lineWidth = 2;
                for (let i = 0; i < this.width; i += 50) {
                    ctx.beginPath();
                    ctx.moveTo(i, this.groundY);
                    ctx.lineTo(i, this.groundY + 50);
                    ctx.stroke();
                }
            }
        });

        // Ceiling
        result.platforms.push({
            x: 0, y: -1000, width: this.width, height: 1000 + ceilingY,
            draw: (ctx) => {
                ctx.fillStyle = '#0055AA';
                ctx.fillRect(0, 0, this.width, ceilingY);
            }
        });

        // Walls
        result.platforms.push({ x: -50, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });
        result.platforms.push({ x: this.width, y: -1000, width: 50, height: this.height + 2000, draw: () => { } });
    }

    createPlatform(x, y, w, h, color = '#FF8C00') {
        return {
            x, y, width: w, height: h,
            draw: (ctx, camera) => {
                const px = x - camera.x;
                ctx.fillStyle = color;
                ctx.fillRect(px, y, w, h);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, y, w, h);
            }
        };
    }

    addCoin(result, x, y) {
        result.coins.push(this.coinPool.get(x, y));
    }

    // ==== LAYOUT GENERATORS ====

    generateClassic(result) {
        // 3 stepping platforms
        for (let i = 0; i < 3; i++) {
            result.platforms.push(this.createPlatform(
                300 + i * 150, this.groundY - 100 - i * 50, 100, 20
            ));
        }
        // Grid of coins
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 3; j++) {
                this.addCoin(result, 250 + i * 60, 150 + j * 50);
            }
        }
        // Heart shape bonus
        this.addHeartPattern(result, 850, 200, 0.8);
    }

    generatePyramid(result) {
        const startX = 200;
        const stepW = 60, stepH = 60;
        const levels = 5;

        for (let i = 0; i < levels; i++) {
            // Left side
            result.platforms.push(this.createPlatform(
                startX + i * stepW, this.groundY - (i + 1) * stepH,
                stepW, (i + 1) * stepH, '#B8860B'
            ));
            this.addCoin(result, startX + i * stepW + 15, this.groundY - (i + 1) * stepH - 40);

            // Right side
            const rightX = startX + (levels * 2 - 1 - i) * stepW;
            result.platforms.push(this.createPlatform(
                rightX, this.groundY - (i + 1) * stepH,
                stepW, (i + 1) * stepH, '#B8860B'
            ));
            this.addCoin(result, rightX + 15, this.groundY - (i + 1) * stepH - 40);
        }

        // Top platform
        const topX = startX + levels * stepW;
        result.platforms.push(this.createPlatform(
            topX, this.groundY - (levels + 1) * stepH,
            stepW * 2, (levels + 1) * stepH, '#FFD700'
        ));
        this.addCoin(result, topX + 30, this.groundY - (levels + 1) * stepH - 50);
        this.addCoin(result, topX + 70, this.groundY - (levels + 1) * stepH - 50);
    }

    generateSkySteps(result) {
        const count = 7;
        for (let i = 0; i < count; i++) {
            const x = 150 + i * 110;
            const y = this.groundY - 100 - (i % 2 === 0 ? 0 : 100);

            result.platforms.push(this.createPlatform(x, y, 80, 20, '#87CEEB'));
            this.addCoin(result, x + 25, y - 40);
            if (i % 2 !== 0) {
                this.addCoin(result, x + 25, y + 40);
            }
        }
        // Final platform with coin row
        result.platforms.push(this.createPlatform(
            150 + count * 110, this.groundY - 200, 120, 25, '#FFFFFF'
        ));
        for (let k = 0; k < 4; k++) {
            this.addCoin(result, 165 + count * 110 + k * 30, this.groundY - 240);
        }
    }

    generateSpiral(result) {
        const centerX = this.width / 2;
        const centerY = this.groundY - 150;
        const spiralCoins = 24;

        for (let i = 0; i < spiralCoins; i++) {
            const angle = (i / spiralCoins) * Math.PI * 4; // 2 full rotations
            const radius = 50 + i * 8;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY - Math.sin(angle) * radius * 0.5;
            this.addCoin(result, x, y);
        }

        // Center platform
        result.platforms.push(this.createPlatform(
            centerX - 40, centerY + 30, 80, 20, '#9932CC'
        ));
    }

    generateDiamond(result) {
        const centerX = this.width / 2;
        const centerY = this.groundY - 180;
        const size = 100;

        // Diamond shape with coins
        const points = [
            [0, -size],     // top
            [size, 0],      // right
            [0, size],      // bottom
            [-size, 0]      // left
        ];

        // Outline
        for (let i = 0; i < 4; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[(i + 1) % 4];
            const steps = 5;
            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                this.addCoin(result,
                    centerX + x1 + (x2 - x1) * t,
                    centerY + y1 + (y2 - y1) * t
                );
            }
        }

        // Inner diamond
        for (let i = 0; i < 4; i++) {
            const [x1, y1] = points[i];
            const cx = centerX + x1 * 0.5;
            const cy = centerY + y1 * 0.5;
            this.addCoin(result, cx, cy);
        }

        // Platforms at 4 directions
        result.platforms.push(this.createPlatform(centerX - 40, centerY + size + 10, 80, 20, '#00CED1'));
    }

    generateZigzag(result) {
        const segments = 8;
        let x = 100;
        let goingUp = true;

        for (let i = 0; i < segments; i++) {
            const y = goingUp ?
                this.groundY - 200 - (i % 3) * 30 :
                this.groundY - 100 + (i % 3) * 30;

            result.platforms.push(this.createPlatform(x, y, 70, 15, '#FF6347'));

            // Coins on and around platform
            this.addCoin(result, x + 20, y - 35);
            this.addCoin(result, x + 50, y - 35);

            x += 100;
            goingUp = (i % 2 === 0);
        }
    }

    generateCircle(result) {
        const centerX = this.width / 2;
        const centerY = this.groundY - 170;
        const radius = 120;
        const coinCount = 16;

        for (let i = 0; i < coinCount; i++) {
            const angle = (i / coinCount) * Math.PI * 2;
            this.addCoin(result,
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius * 0.7
            );
        }

        // Inner circle
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
            this.addCoin(result,
                centerX + Math.cos(angle) * (radius * 0.5),
                centerY + Math.sin(angle) * (radius * 0.35)
            );
        }

        // Center coin
        this.addCoin(result, centerX, centerY);

        // Platform below
        result.platforms.push(this.createPlatform(
            centerX - 50, centerY + radius * 0.7 + 20, 100, 20, '#4169E1'
        ));
    }

    generateWave(result) {
        const waveLength = this.width - 200;
        const waves = 2;
        const amplitude = 80;
        const coins = 30;

        for (let i = 0; i < coins; i++) {
            const t = i / coins;
            const x = 100 + t * waveLength;
            const y = this.groundY - 180 + Math.sin(t * Math.PI * 2 * waves) * amplitude;
            this.addCoin(result, x, y);
        }

        // Platforms at wave peaks
        for (let w = 0; w < waves * 2; w++) {
            const t = w / (waves * 2);
            const x = 100 + t * waveLength;
            const y = this.groundY - 180 + (w % 2 === 0 ? -amplitude : amplitude);
            result.platforms.push(this.createPlatform(x - 30, y + 30, 60, 15, '#32CD32'));
        }
    }

    generateTower(result) {
        const towerX = this.width / 2 - 50;
        const levels = 5;
        const levelHeight = 60;

        for (let i = 0; i < levels; i++) {
            const y = this.groundY - (i + 1) * levelHeight;
            const width = 100 - i * 10;
            const x = this.width / 2 - width / 2;

            result.platforms.push(this.createPlatform(x, y, width, 15, '#8B4513'));

            // Coins on each level
            this.addCoin(result, x + 15, y - 30);
            if (width > 50) {
                this.addCoin(result, x + width - 25, y - 30);
            }
        }

        // Crown at top
        const topY = this.groundY - (levels + 1) * levelHeight;
        this.addCoin(result, this.width / 2, topY);
        this.addCoin(result, this.width / 2 - 30, topY + 15);
        this.addCoin(result, this.width / 2 + 30, topY + 15);
    }

    generateMaze(result) {
        // Simple maze-like structure
        const wallColor = '#696969';

        // Vertical walls
        result.platforms.push(this.createPlatform(300, this.groundY - 150, 20, 100, wallColor));
        result.platforms.push(this.createPlatform(500, this.groundY - 250, 20, 200, wallColor));
        result.platforms.push(this.createPlatform(700, this.groundY - 150, 20, 100, wallColor));

        // Horizontal platforms/shelves
        result.platforms.push(this.createPlatform(200, this.groundY - 100, 100, 15, '#4682B4'));
        result.platforms.push(this.createPlatform(400, this.groundY - 180, 100, 15, '#4682B4'));
        result.platforms.push(this.createPlatform(600, this.groundY - 100, 100, 15, '#4682B4'));
        result.platforms.push(this.createPlatform(350, this.groundY - 280, 150, 15, '#4682B4'));

        // Coins scattered through maze
        const coinPositions = [
            [250, this.groundY - 140],
            [450, this.groundY - 220],
            [650, this.groundY - 140],
            [420, this.groundY - 320],
            [220, this.groundY - 200],
            [600, this.groundY - 250],
            [800, this.groundY - 180],
        ];
        coinPositions.forEach(([x, y]) => this.addCoin(result, x, y));
    }

    generateRainbow(result) {
        const centerX = this.width / 2;
        const baseY = this.groundY - 50;
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];

        colors.forEach((color, i) => {
            const radius = 200 - i * 25;
            const startAngle = Math.PI;
            const endAngle = 0;
            const segments = 8;

            for (let j = 0; j <= segments; j++) {
                const angle = startAngle + (endAngle - startAngle) * (j / segments);
                const x = centerX + Math.cos(angle) * radius;
                const y = baseY + Math.sin(angle) * radius * 0.6;

                // Add small platform segments for inner arcs
                if (i > 2 && j % 2 === 0) {
                    result.platforms.push(this.createPlatform(x - 20, y, 40, 10, color));
                }

                // Coins on outer arcs
                if (i < 3) {
                    this.addCoin(result, x, y - 20);
                }
            }
        });
    }

    generateStarPattern(result) {
        const centerX = this.width / 2;
        const centerY = this.groundY - 180;
        const points = 5;
        const outerR = 130;
        const innerR = 50;

        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r * 0.7;

            this.addCoin(result, x, y);

            // Connect to next point with coins
            if (i % 2 === 0) {
                const nextAngle = ((i + 1) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
                const midX = centerX + Math.cos(nextAngle) * innerR * 1.2;
                const midY = centerY + Math.sin(nextAngle) * innerR * 0.8;
                this.addCoin(result, (x + midX) / 2, (y + midY) / 2);
            }
        }

        // Center platform
        result.platforms.push(this.createPlatform(centerX - 30, centerY + 20, 60, 15, '#FFD700'));
        this.addCoin(result, centerX, centerY);
    }

    generateCascade(result) {
        const startX = 150;
        const count = 6;

        for (let i = 0; i < count; i++) {
            const x = startX + i * 130;
            const y = this.groundY - 80 - i * 40;
            const width = 100 - i * 10;

            result.platforms.push(this.createPlatform(x, y, width, 15, '#DDA0DD'));

            // Waterfall of coins
            for (let j = 0; j < 3; j++) {
                this.addCoin(result, x + width / 2, y - 30 - j * 25);
            }
        }
    }

    generateTunnels(result) {
        // Upper tunnel
        result.platforms.push(this.createPlatform(150, this.groundY - 200, 700, 15, '#A0522D'));
        result.platforms.push(this.createPlatform(150, this.groundY - 280, 700, 15, '#A0522D'));

        // Lower tunnel
        result.platforms.push(this.createPlatform(150, this.groundY - 80, 700, 15, '#A0522D'));
        result.platforms.push(this.createPlatform(150, this.groundY - 140, 700, 15, '#A0522D'));

        // Coins in upper tunnel
        for (let i = 0; i < 10; i++) {
            this.addCoin(result, 200 + i * 60, this.groundY - 240);
        }

        // Coins in lower tunnel
        for (let i = 0; i < 10; i++) {
            this.addCoin(result, 200 + i * 60, this.groundY - 110);
        }

        // Connecting platforms
        result.platforms.push(this.createPlatform(400, this.groundY - 180, 60, 60, '#CD853F'));
    }

    // Helper pattern functions
    addHeartPattern(result, cx, cy, scale = 1) {
        const heartCoins = [
            [-30, -30], [30, -30],           // Top bumps
            [-40, 20], [-20, 35], [0, 40],   // Left side
            [20, 35], [40, 20]               // Right side
        ];
        heartCoins.forEach(([x, y]) => {
            this.addCoin(result, cx + x * scale, cy + y * scale);
        });
    }
}
