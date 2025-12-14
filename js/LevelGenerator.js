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

        const enemies = createEnemies(startX, endX, height, images.enemy, difficulty);

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
}
