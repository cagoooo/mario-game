import { generatePlatforms } from './Platform.js?v=1.6.22';
import { createEnemies } from './Enemy.js?v=1.6.22';
import { generateCoins } from './Coin.js?v=1.6.22';
import { generateQuestionBlocks } from './QuestionBlock.js?v=1.6.22';
import { generatePipes } from './Pipe.js?v=1.6.22';

export class LevelGenerator {
    constructor() {
    }

    generateChunk(startX, endX, context) {
        const { height, groundY, images, difficulty } = context;

        const platforms = generatePlatforms(startX, endX, height, images.tiles);

        const enemies = createEnemies(startX, endX, height, images.enemy, difficulty, context.biome);

        // Pass only new platforms for optimization
        const coins = generateCoins(startX, endX, platforms);

        const questionBlocks = generateQuestionBlocks(startX, endX, groundY);

        const pipes = generatePipes(startX, endX, groundY);

        return {
            platforms,
            enemies,
            coins,
            questionBlocks,
            pipes
        };
    }

    generateBossArena(startX, groundY) {
        const width = 1200; // Arena width
        const endX = startX + width;

        // Arena Walls
        const platforms = [];
        // Left Wall (Invisible barrier)
        platforms.push({ x: startX - 50, y: -1000, width: 50, height: 2000, draw: () => { } });
        // Right Wall (Invisible barrier)
        platforms.push({ x: endX, y: -1000, width: 50, height: 2000, draw: () => { } });

        // Platforms for fighting
        // Two floating platforms
        platforms.push({
            x: startX + 300, y: groundY - 120, width: 150, height: 20,
            draw: (ctx, camera) => {
                const x = startX + 300 - camera.x;
                const y = groundY - 120;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, 150, 20);
            }
        });

        platforms.push({
            x: startX + 750, y: groundY - 120, width: 150, height: 20,
            draw: (ctx, camera) => {
                const x = startX + 750 - camera.x;
                const y = groundY - 120;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, 150, 20);
            }
        });

        return {
            startX,
            endX,
            platforms
        };
    }
}
