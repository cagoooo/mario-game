/**
 * SpatialGrid.js - Spatial Partitioning for Collision Detection
 * 
 * Divides the game world into cells to optimize collision queries.
 * Instead of O(N) checks, nearby entities are found in O(1) average time.
 * @version 2.9.0
 */

export class SpatialGrid {
    /**
     * Create a new spatial grid
     * @param {number} cellSize - Size of each grid cell in pixels
     */
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.entityCells = new WeakMap(); // Track which cell each entity is in
    }

    /**
     * Clear the entire grid
     */
    clear() {
        this.grid.clear();
    }

    /**
     * Get the cell key for a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} Cell key
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Get all cell keys that an entity occupies (handles entities larger than cell size)
     * @param {Object} entity - Entity with x, y, width, height
     * @returns {string[]} Array of cell keys
     */
    getEntityCellKeys(entity) {
        const keys = [];
        const startX = Math.floor(entity.x / this.cellSize);
        const startY = Math.floor(entity.y / this.cellSize);
        const endX = Math.floor((entity.x + (entity.width || 0)) / this.cellSize);
        const endY = Math.floor((entity.y + (entity.height || 0)) / this.cellSize);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                keys.push(`${cx},${cy}`);
            }
        }
        return keys;
    }

    /**
     * Insert an entity into the grid
     * @param {Object} entity - Entity with x, y, width, height
     */
    insert(entity) {
        const keys = this.getEntityCellKeys(entity);

        for (const key of keys) {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key).add(entity);
        }

        this.entityCells.set(entity, keys);
    }

    /**
     * Remove an entity from the grid
     * @param {Object} entity - Entity to remove
     */
    remove(entity) {
        const keys = this.entityCells.get(entity);
        if (keys) {
            for (const key of keys) {
                const cell = this.grid.get(key);
                if (cell) {
                    cell.delete(entity);
                    if (cell.size === 0) {
                        this.grid.delete(key);
                    }
                }
            }
            this.entityCells.delete(entity);
        }
    }

    /**
     * Update an entity's position in the grid
     * @param {Object} entity - Entity that moved
     */
    update(entity) {
        this.remove(entity);
        this.insert(entity);
    }

    /**
     * Get all entities near a point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Number of cells to search in each direction
     * @returns {Set} Set of nearby entities
     */
    getNearby(x, y, radius = 1) {
        const entities = new Set();
        const centerX = Math.floor(x / this.cellSize);
        const centerY = Math.floor(y / this.cellSize);

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        entities.add(entity);
                    }
                }
            }
        }
        return entities;
    }

    /**
     * Get all entities that could potentially collide with an entity
     * @param {Object} entity - Entity to check collisions for
     * @returns {Set} Set of potential collision candidates
     */
    getPotentialCollisions(entity) {
        const candidates = new Set();
        const keys = this.getEntityCellKeys(entity);

        // Also check neighboring cells for entities that might overlap
        const checked = new Set();
        for (const key of keys) {
            const [cx, cy] = key.split(',').map(Number);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighborKey = `${cx + dx},${cy + dy}`;
                    if (checked.has(neighborKey)) continue;
                    checked.add(neighborKey);

                    const cell = this.grid.get(neighborKey);
                    if (cell) {
                        for (const other of cell) {
                            if (other !== entity) {
                                candidates.add(other);
                            }
                        }
                    }
                }
            }
        }
        return candidates;
    }

    /**
     * Rebuild the entire grid from a list of entities
     * @param {Array} entities - Array of entities to add
     */
    rebuild(entities) {
        this.clear();
        for (const entity of entities) {
            this.insert(entity);
        }
    }

    /**
     * Get debug info about the grid
     * @returns {Object} Debug statistics
     */
    getStats() {
        let totalEntities = 0;
        let maxPerCell = 0;

        for (const cell of this.grid.values()) {
            totalEntities += cell.size;
            maxPerCell = Math.max(maxPerCell, cell.size);
        }

        return {
            cellCount: this.grid.size,
            totalEntities,
            maxPerCell,
            cellSize: this.cellSize
        };
    }
}
