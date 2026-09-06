import { Platform } from './Platform.js';
import { Enemy } from './Enemy.js';
import { QuestionBlock } from './QuestionBlock.js';
import { Checkpoint } from './Checkpoint.js';
import { checkCollision } from './utils.js';
import { idleSave, loadValue } from './saveHelper.js';

export const COURSES = [
    { id: 'trail-meadow', name: '彈跳花園', subtitle: '彈簧 × 高低雙路線', biome: 'PLAINS', emoji: '🌼', mode: 'trail', length: 3200, par: 45, color: '#2b9561', power: 'mushroom' },
    { id: 'trail-dunes', name: '綠洲尋寶', subtitle: '階梯 × 遺跡探索', biome: 'DESERT', emoji: '🏺', mode: 'trail', length: 3400, par: 48, color: '#be7035', power: 'fireflower' },
    { id: 'trail-snow', name: '極光快遞', subtitle: '移動浮台 × 冰花', biome: 'SNOW', emoji: '💎', mode: 'trail', length: 3400, par: 48, color: '#387fa2', power: 'iceflower' },
    { id: 'trail-moon', name: '月光鐘樓', subtitle: '升降台 × 披風滑翔', biome: 'SPOOKY', emoji: '🌙', mode: 'trail', length: 3600, par: 52, color: '#7861b5', power: 'cape' }
];
export function getCourseRecord(id) {
    try {
        const r = JSON.parse(loadValue(`marioCourse:${id}`) || 'null');
        if (!r || !Number.isFinite(r.bestTime) || r.bestTime < 0) return null;
        return { stars: Math.max(0, Math.min(3, Number(r.stars) || 0)), bestTime: r.bestTime, clears: Number(r.clears) || 0 };
    } catch { return null; }
}
export function saveCourseRecord(id, stars, seconds) {
    const previous = getCourseRecord(id);
    const record = { stars: Math.max(previous?.stars || 0, stars), bestTime: Math.min(previous?.bestTime ?? Infinity, seconds), clears: (previous?.clears || 0) + 1 };
    idleSave(`marioCourse:${id}`, record);
    return record;
}

// Authored encounters: a safe lower route and optional upper-route collectibles.
export class AdventureCourse {
    constructor(game, config) {
        Object.assign(this, { game, config, ticks: 0, gems: [], springs: [], movers: [], finished: false });
    }
    build() {
        const g = this.game, c = this.config, ground = g.GROUND_Y;
        const platform = (x, rise, width = 125) => {
            const p = new Platform(x, ground - rise, width, 20, null);
            p.tint = c.color;
            g.platforms.push(p);
            return p;
        };
        for (let i = 0; i < 3; i++) {
            const x = 420 + i * 900;
            platform(x, 80);
            const high = platform(x + 170, 165, 150);
            platform(x + 385, 100);
            if (c.biome === 'SNOW' || c.biome === 'SPOOKY') this.movers.push({ platform: high, x: high.x, y: high.y, phase: i * 1.7, vertical: c.biome === 'SPOOKY' });
            if (c.biome === 'PLAINS' || c.biome === 'SPOOKY') this.springs.push({ x: x - 70, y: ground - 18, width: 42, height: 18, cooldown: 0 });
            if (c.biome === 'DESERT') platform(x + 95, 120, 90);
            this.gems.push({ x: x + 225, y: ground - 220, width: 26, height: 30, collected: false });
            for (let n = 0; n < 7; n++) g.coins.push(g.coinPool.get(x - 90 + n * 75, ground - 40 - (n > 1 && n < 5 ? 85 : 0)));
            g.questionBlocks.push(new QuestionBlock(x - 140, ground - 105, i === 0 ? c.power : (i === 1 ? 'star' : 'oneup')));
            g.enemies.push(new Enemy(x + 510, ground - 30, 0.65 + i * 0.15, -1, g.images.enemy));
        }
        g.checkpoints.push(new Checkpoint(1350, ground), new Checkpoint(2250, ground));
        g.levelWidth = c.length + 300;
        g.lastGeneratedX = g.levelWidth;
        g.bossTriggerDistance = Infinity;
    }
    beforePlayerUpdate() {
        const p = this.game.player;
        for (const m of this.movers) {
            const platform = m.platform;
            const riding = p.grounded && Math.abs(p.y + p.height - platform.y) < 3 && p.x + p.width > platform.x && p.x < platform.x + platform.width;
            const oldX = platform.x, oldY = platform.y;
            const offset = Math.sin(this.ticks * 0.025 + m.phase) * (m.vertical ? 40 : 60);
            platform.x = m.x + (m.vertical ? 0 : offset);
            platform.y = m.y + (m.vertical ? offset : 0);
            if (riding) { p.x += platform.x - oldX; p.y += platform.y - oldY; }
        }
    }
    update() {
        if (this.finished) return;
        const g = this.game, p = g.player;
        if (p.isDead || g.isProcessingDeath) return;
        for (const spring of this.springs) {
            if (spring.cooldown > 0) spring.cooldown--;
            if (!spring.cooldown && p.velY >= 0 && checkCollision(p, spring)) {
                p.velY = -19; p.grounded = false; p.jumpCount = 1;
                p.setState(2); spring.cooldown = 25;
                g.playSound('jump');
            }
        }
        for (const gem of this.gems) {
            if (!gem.collected && checkCollision(p, gem)) {
                gem.collected = true;
                g.score += 300; g.updateScore();
                g.playSound('coin'); g.addParticles(gem.x, gem.y, 12, '#7fffe1');
                g.showPowerUpHint(`探索寶石 ${this.collected}/3！每顆 +300 分`);
            }
        }
        if (p.x >= this.config.length) {
            this.finished = true;
            const seconds = this.ticks / 60;
            const stars = 1 + Number(this.collected === 3) + Number(!g._diedThisRun);
            const record = saveCourseRecord(this.config.id, stars, seconds);
            g.levelCleared = true;
            g.achievementSystem.save();
            if (g.score > g.highScore) { g.highScore = g.score; g.saveHighScore(); }
            g.pause();
            g.ui.pauseOverlay.style.display = 'none';
            g.canvas.dispatchEvent(new CustomEvent('marioCourseCleared', { detail: { config: this.config, stars, seconds, gems: this.collected, record, noDeath: !g._diedThisRun } }));
        }
    }
    get collected() { return this.gems.filter(g => g.collected).length; }
    draw(ctx, camera) {
        const g = this.game, c = this.config;
        ctx.save();
        // Original vector scenery, independent of gameplay collisions.
        for (let x = 180; x < c.length; x += 260) {
            const sx = x - camera.x;
            if (sx < -100 || sx > g.width + 100) continue;
            ctx.fillStyle = c.color;
            if (c.biome === 'PLAINS') {
                ctx.fillRect(sx, g.GROUND_Y - 32, 3, 32);
                ctx.fillStyle = '#fff1a8';
                for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.arc(sx + Math.cos(j) * 7, g.GROUND_Y - 34 + Math.sin(j) * 7, 5, 0, Math.PI * 2); ctx.fill(); }
                ctx.fillStyle = '#db8c28'; ctx.fillRect(sx - 3, g.GROUND_Y - 37, 7, 7);
            } else if (c.biome === 'DESERT') {
                ctx.globalAlpha = 0.5; ctx.fillRect(sx, g.GROUND_Y - 62, 22, 62); ctx.fillRect(sx - 5, g.GROUND_Y - 68, 32, 8); ctx.globalAlpha = 1;
            } else if (c.biome === 'SNOW') {
                ctx.fillStyle = '#9cecec'; ctx.beginPath(); ctx.moveTo(sx, g.GROUND_Y); ctx.lineTo(sx + 12, g.GROUND_Y - 50); ctx.lineTo(sx + 30, g.GROUND_Y); ctx.fill();
            } else {
                ctx.fillRect(sx, g.GROUND_Y - 75, 4, 75); ctx.fillStyle = '#ffe6a2'; ctx.beginPath(); ctx.arc(sx + 2, g.GROUND_Y - 82, 10, 0, Math.PI * 2); ctx.fill();
            }
        }
        for (const s of this.springs) {
            const x = s.x - camera.x;
            ctx.strokeStyle = '#344b69'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, s.y + 18);
            ctx.lineTo(x + 32, s.y + 12); ctx.lineTo(x + 6, s.y + 6); ctx.lineTo(x + 32, s.y); ctx.stroke();
            ctx.fillStyle = '#efb436'; ctx.fillRect(x, s.y, s.width, 5);
        }
        for (const gem of this.gems) {
            if (gem.collected) continue;
            const x = gem.x - camera.x, y = gem.y;
            ctx.fillStyle = '#83ffdf'; ctx.strokeStyle = '#155867'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 13, y); ctx.lineTo(x + 26, y + 12); ctx.lineTo(x + 13, y + 30); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, y + 6, 4, 8);
        }
        const goal = c.length - camera.x;
        ctx.fillStyle = '#35475b'; ctx.fillRect(goal, g.GROUND_Y - 145, 5, 145);
        ctx.fillStyle = '#ffda58'; ctx.fillRect(goal + 5, g.GROUND_Y - 145, 60, 34);
        ctx.fillStyle = '#273448'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('終點', goal + 15, g.GROUND_Y - 123);
        ctx.restore();
    }
    drawHUD(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(18,35,50,.86)'; ctx.fillRect(205, 48, 390, 39);
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${this.config.name}　◆ ${this.collected}/3　${(this.ticks / 60).toFixed(1)} 秒　目標 ${this.config.par} 秒`, 400, 64);
        ctx.fillStyle = '#42536a'; ctx.fillRect(220, 73, 360, 5);
        ctx.fillStyle = '#80e2c1'; ctx.fillRect(220, 73, 360 * Math.min(1, this.game.player.x / this.config.length), 5);
        ctx.restore();
    }
}
