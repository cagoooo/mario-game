export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    addEnemies(newEnemies) {
        this.enemies.push(...newEnemies);
    }

    update(activeAreaX) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(activeAreaX);
        }
    }

    cleanup(minX) {
        this.enemies = this.enemies.filter(e => e.x + e.width > minX);
    }

    getEnemies() {
        return this.enemies;
    }

    reset() {
        this.enemies = [];
    }
}
