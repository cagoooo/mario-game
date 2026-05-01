/**
 * LevelLoader.js - JSON-Based Level Loading System
 * 
 * Loads level data from JSON files and converts them to game entities.
 * Supports programmatic and hand-crafted level designs.
 * @version 2.9.0
 */

import { Platform } from './Platform.js';
import { Coin } from './Coin.js';
import { QuestionBlock } from './QuestionBlock.js';
import { Pipe } from './Pipe.js';

export class LevelLoader {
    constructor(game) {
        this.game = game;
        this.levelCache = new Map();
    }

    /**
     * Load a level from a JSON file
     * @param {string} levelPath - Path to the JSON level file
     * @returns {Promise<Object>} Parsed level data with instantiated entities
     */
    async load(levelPath) {
        // Check cache first
        if (this.levelCache.has(levelPath)) {
            return this.parse(this.levelCache.get(levelPath));
        }

        try {
            const response = await fetch(levelPath);
            if (!response.ok) {
                throw new Error(`Failed to load level: ${response.status}`);
            }
            const data = await response.json();
            this.levelCache.set(levelPath, data);
            return this.parse(data);
        } catch (error) {
            console.error('LevelLoader error:', error);
            return null;
        }
    }

    /**
     * Parse raw level data into game entities
     * @param {Object} data - Raw level JSON data
     * @returns {Object} Object containing arrays of game entities
     */
    parse(data) {
        const result = {
            name: data.name || 'Unnamed Level',
            width: data.width || 3000,
            biome: data.biome || 'PLAINS',
            platforms: [],
            coins: [],
            questionBlocks: [],
            pipes: [],
            enemies: [],
            spawns: {
                player: data.playerSpawn || { x: 50, y: 0 }
            }
        };

        // Parse platforms
        if (data.platforms) {
            for (const p of data.platforms) {
                result.platforms.push(new Platform(
                    p.x,
                    p.y,
                    p.width,
                    p.height || 20,
                    p.type || 'normal'
                ));
            }
        }

        // Parse coins
        if (data.coins) {
            for (const c of data.coins) {
                // Support both single coins and coin rows
                if (c.count && c.count > 1) {
                    const spacing = c.spacing || 30;
                    for (let i = 0; i < c.count; i++) {
                        const coin = this.game.coinPool.get(c.x + i * spacing, c.y);
                        result.coins.push(coin);
                    }
                } else {
                    const coin = this.game.coinPool.get(c.x, c.y);
                    result.coins.push(coin);
                }
            }
        }

        // Parse question blocks
        if (data.questionBlocks) {
            for (const q of data.questionBlocks) {
                result.questionBlocks.push(new QuestionBlock(
                    q.x,
                    q.y,
                    q.content || 'coin'
                ));
            }
        }

        // Parse pipes
        if (data.pipes) {
            for (const p of data.pipes) {
                const pipe = new Pipe(
                    p.x,
                    p.y,
                    p.height || 80,
                    p.hasPiranha !== undefined ? p.hasPiranha : true
                );
                if (p.type) pipe.type = p.type;
                if (p.destination) pipe.destination = p.destination;
                result.pipes.push(pipe);
            }
        }

        // Parse enemy spawn points (enemies are spawned by EnemyManager)
        if (data.enemies) {
            result.enemySpawns = data.enemies.map(e => ({
                x: e.x,
                y: e.y || 0,
                type: e.type || 'goomba'
            }));
        }

        return result;
    }

    /**
     * Create level data programmatically (for level editor integration)
     * @param {Object} config - Level configuration
     * @returns {Object} Level data in JSON format
     */
    static createLevelData(config) {
        return {
            name: config.name || 'Custom Level',
            width: config.width || 3000,
            biome: config.biome || 'PLAINS',
            playerSpawn: config.playerSpawn || { x: 50, y: 0 },
            platforms: config.platforms || [],
            coins: config.coins || [],
            questionBlocks: config.questionBlocks || [],
            pipes: config.pipes || [],
            enemies: config.enemies || []
        };
    }

    /**
     * Export current game state as level JSON
     * @returns {Object} Level data from current game state
     */
    exportCurrentLevel() {
        const game = this.game;
        return {
            name: 'Exported Level',
            width: game.levelWidth,
            biome: game.currentBiome,
            playerSpawn: { x: game.player.x, y: game.player.y },
            platforms: game.platforms.map(p => ({
                x: p.x, y: p.y, width: p.width, height: p.height
            })),
            coins: game.coins.map(c => ({
                x: c.x, y: c.y
            })),
            questionBlocks: game.questionBlocks.map(q => ({
                x: q.x, y: q.y, content: q.content
            })),
            pipes: game.pipes.map(p => ({
                x: p.x, y: p.y, height: p.height, type: p.type
            }))
        };
    }
}
