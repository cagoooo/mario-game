import { ObjectPool } from './ObjectPool.js?v=1.8.0';
import { Enemy, Koopa, FlyingEnemy, Cactus, Yeti, Ghost, HammerBro } from './Enemy.js?v=1.9.35';

export class EnemyManager {
    constructor() {
        this.enemies = [];

        this.goombaPool = new ObjectPool(
            () => new Enemy(0, 0, 0, 0, null),
            (e, x, y, speed, direction, spriteSheet) => {
                e.reset(x, y, speed, direction);
                e.spriteSheet = spriteSheet;
            }
        );

        this.koopaPool = new ObjectPool(
            () => new Koopa(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );

        this.flyingPool = new ObjectPool(
            () => new FlyingEnemy(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );

        this.cactusPool = new ObjectPool(
            () => new Cactus(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );

        this.yetiPool = new ObjectPool(
            () => new Yeti(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );

        this.ghostPool = new ObjectPool(
            () => new Ghost(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );

        this.hammerbroPool = new ObjectPool(
            () => new HammerBro(0, 0, 0, 0),
            (e, x, y, speed, direction) => e.reset(x, y, speed, direction)
        );
    }

    spawn(data) {
        let enemy;
        if (data.type === 'goomba') {
            enemy = this.goombaPool.get(data.x, data.y, data.speed, data.direction, data.spriteSheet);
        } else if (data.type === 'koopa') {
            enemy = this.koopaPool.get(data.x, data.y, data.speed, data.direction);
        } else if (data.type === 'flying') {
            enemy = this.flyingPool.get(data.x, data.y, data.speed, data.direction);
        } else if (data.type === 'cactus') {
            enemy = this.cactusPool.get(data.x, data.y, data.speed, data.direction);
        } else if (data.type === 'yeti') {
            enemy = this.yetiPool.get(data.x, data.y, data.speed, data.direction);
        } else if (data.type === 'ghost') {
            enemy = this.ghostPool.get(data.x, data.y, data.speed, data.direction);
        } else if (data.type === 'hammerbro') {
            enemy = this.hammerbroPool.get(data.x, data.y, data.speed, data.direction);
        }

        if (enemy) {
            this.enemies.push(enemy);
        }
    }

    addEnemies(spawnDataList) {
        spawnDataList.forEach(data => this.spawn(data));
    }

    update(activeAreaX, player) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(activeAreaX, player); // Pass player for Ghost tracking
        }
    }

    cleanup(minX) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.x + e.width <= minX) {
                this.release(e);
                this.enemies.splice(i, 1);
            }
        }
    }

    release(enemy) {
        if (enemy.type === 'goomba') this.goombaPool.release(enemy);
        else if (enemy.type === 'koopa') this.koopaPool.release(enemy);
        else if (enemy.type === 'flying') this.flyingPool.release(enemy);
        else if (enemy.type === 'cactus') this.cactusPool.release(enemy);
        else if (enemy.type === 'yeti') this.yetiPool.release(enemy);
        else if (enemy.type === 'ghost') this.ghostPool.release(enemy);
        else if (enemy.type === 'hammerbro') this.hammerbroPool.release(enemy);
    }

    getEnemies() {
        return this.enemies;
    }

    reset() {
        this.enemies.forEach(e => this.release(e));
        this.enemies = [];
    }
}
