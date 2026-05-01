// Achievement System for tracking player accomplishments
//
// Achievement schema:
//   id        — unique string, used as localStorage key
//   name      — display name
//   desc      — description (hidden achievements show "???" until unlocked)
//   icon      — emoji
//   condition — (stats) => boolean
//   hidden    — optional, true = obscure name/desc until unlocked
export const ACHIEVEMENTS = {
    // ─── Combat ───────────────────────────────────────────
    FIRST_ENEMY: {
        id: 'first_enemy',
        name: '初戰告捷',
        desc: '首次擊敗敵人',
        icon: '👊',
        condition: (s) => s.enemiesKilled >= 1
    },
    FIRST_BOSS: {
        id: 'first_boss',
        name: 'Boss 獵人',
        desc: '首次擊敗 Boss',
        icon: '👹',
        condition: (s) => s.bossesKilled >= 1
    },
    BOSS_MASTER: {
        id: 'boss_master',
        name: 'Boss 大師',
        desc: '擊敗 5 隻 Boss',
        icon: '🗡️',
        condition: (s) => s.bossesKilled >= 5,
        hidden: true
    },
    ENEMY_STREAK: {
        id: 'enemy_streak',
        name: '連續踩踏',
        desc: '連續踩死 5 隻敵人不落地',
        icon: '🔥',
        condition: (s) => s.maxEnemyStreak >= 5
    },
    STREAK_10: {
        id: 'streak_10',
        name: '連跳王',
        desc: '連續踩死 10 隻敵人不落地',
        icon: '🦘',
        condition: (s) => s.maxEnemyStreak >= 10,
        hidden: true
    },

    // ─── Coins ────────────────────────────────────────────
    COIN_100: {
        id: 'coin_100',
        name: '金幣收藏家',
        desc: '累計收集 100 枚金幣',
        icon: '💰',
        condition: (s) => s.totalCoins >= 100
    },
    COIN_500: {
        id: 'coin_500',
        name: '財富大亨',
        desc: '累計收集 500 枚金幣',
        icon: '🏆',
        condition: (s) => s.totalCoins >= 500
    },
    COIN_RUSH: {
        id: 'coin_rush',
        name: '連續豐收',
        desc: '1 秒內收集 10 枚金幣',
        icon: '💎',
        condition: (s) => s.maxCoinRush >= 10,
        hidden: true
    },

    // ─── Power-ups & Skills ───────────────────────────────
    STAR_POWER: {
        id: 'star_power',
        name: '無敵之星',
        desc: '獲得無敵星',
        icon: '⭐',
        condition: (s) => s.starsCollected >= 1
    },
    POWER_COLLECTOR: {
        id: 'power_collector',
        name: '變身達人',
        desc: '累計取得 10 個道具',
        icon: '🍄',
        condition: (s) => s.powerUpsCollected >= 10
    },
    FREEZE_MASTER: {
        id: 'freeze_master',
        name: '冰凍大師',
        desc: '凍結 30 隻敵人',
        icon: '❄️',
        condition: (s) => s.frozenEnemies >= 30
    },
    CAPE_FLYER: {
        id: 'cape_flyer',
        name: '空中飛人',
        desc: '披風滑翔累計 10 秒',
        icon: '🦸',
        condition: (s) => s.glideFrames >= 600   // 600f @ 60fps = 10s
    },

    // ─── Discovery ────────────────────────────────────────
    BONUS_LEVEL: {
        id: 'bonus_level',
        name: '秘密發現',
        desc: '進入金幣關卡',
        icon: '🚀',
        condition: (s) => s.bonusLevelsEntered >= 1
    },
    MEGA_DESTROY: {
        id: 'mega_destroy',
        name: '破壞王',
        desc: '巨大化破壞 10 個物件',
        icon: '💪',
        condition: (s) => s.megaDestroys >= 10
    },

    // ─── Score / Progression ──────────────────────────────
    HIGH_SCORE_1000: {
        id: 'high_score_1000',
        name: '千分達人',
        desc: '單次遊戲得分超過 1,000',
        icon: '🎯',
        condition: (s) => s.highScore >= 1000
    },
    HIGH_SCORE_5000: {
        id: 'high_score_5000',
        name: '五千分大師',
        desc: '單次遊戲得分超過 5,000',
        icon: '✨',
        condition: (s) => s.highScore >= 5000
    },
    HIGH_SCORE_10000: {
        id: 'high_score_10000',
        name: '萬分傳奇',
        desc: '單次遊戲得分超過 10,000',
        icon: '👑',
        condition: (s) => s.highScore >= 10000,
        hidden: true
    },

    // ─── World Clears ─────────────────────────────────────
    WORLD_CLEARED: {
        id: 'world_cleared',
        name: '初次通關',
        desc: '通關任一個 World',
        icon: '🏁',
        condition: (s) => s.worldsCleared >= 1
    },
    ALL_WORLDS: {
        id: 'all_worlds',
        name: '征服四方',
        desc: '通關全部 4 個 World',
        icon: '🌍',
        condition: (s) => s.worldsCleared >= 4,
        hidden: true
    },
    NO_DEATH_RUN: {
        id: 'no_death_run',
        name: '完美通關',
        desc: '一條命通關任一 World',
        icon: '🎖️',
        condition: (s) => s.noDeathRuns >= 1,
        hidden: true
    }
};

const STORAGE_KEY = 'marioAchievements';
const COIN_RUSH_WINDOW_FRAMES = 60; // 1 second at 60fps

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = new Set();
        this.stats = {
            // Original (v2.13)
            enemiesKilled: 0,
            totalCoins: 0,
            bossesKilled: 0,
            starsCollected: 0,
            bonusLevelsEntered: 0,
            megaDestroys: 0,
            highScore: 0,
            maxEnemyStreak: 0,
            currentEnemyStreak: 0,
            // Added v2.29 (new tracking dimensions)
            frozenEnemies: 0,
            glideFrames: 0,
            powerUpsCollected: 0,
            worldsCleared: 0,
            noDeathRuns: 0,
            maxCoinRush: 0
        };
        this.pendingNotifications = [];
        this.notificationTimer = 0;
        this.currentNotification = null;

        // Coin-rush sliding-window tracker (transient, not persisted)
        this._coinTimestamps = [];

        this.load();
    }

    // ─── Track methods (called by Game / CollisionSystem) ───────────
    trackEnemyKill() {
        this.stats.enemiesKilled++;
        this.stats.currentEnemyStreak++;
        if (this.stats.currentEnemyStreak > this.stats.maxEnemyStreak) {
            this.stats.maxEnemyStreak = this.stats.currentEnemyStreak;
        }
        // v2.31.0 reward: STREAK_10 → auto-grant 1UP at threshold (once per streak)
        const threshold = this.game?.rewards?.streakOneUpThreshold;
        if (threshold && Number.isFinite(threshold)
            && this.stats.currentEnemyStreak === threshold
            && this.game?.addLife) {
            this.game.addLife();
            if (this.game.showPowerUpHint) {
                this.game.showPowerUpHint(`🦘 連踩 ${threshold} 隻 — +1UP！`);
            }
        }
        this.checkAchievements();
    }

    trackCoinCollect() {
        this.stats.totalCoins++;
        // Coin rush: count coins in last 60 frames
        const now = (this.game && this.game.frameCount) || performance.now();
        this._coinTimestamps.push(now);
        // Trim to last 60 frames worth
        const cutoff = now - COIN_RUSH_WINDOW_FRAMES;
        this._coinTimestamps = this._coinTimestamps.filter(t => t >= cutoff);
        if (this._coinTimestamps.length > this.stats.maxCoinRush) {
            this.stats.maxCoinRush = this._coinTimestamps.length;
        }
        this.checkAchievements();
    }

    trackBossKill() { this.stats.bossesKilled++; this.checkAchievements(); }
    trackStarCollect() { this.stats.starsCollected++; this.checkAchievements(); }
    trackBonusLevel() { this.stats.bonusLevelsEntered++; this.checkAchievements(); }
    trackMegaDestroy() { this.stats.megaDestroys++; this.checkAchievements(); }
    trackFreeze() { this.stats.frozenEnemies++; this.checkAchievements(); }
    trackGlideFrame() { this.stats.glideFrames++; this.checkAchievements(); }
    trackPowerUp() { this.stats.powerUpsCollected++; this.checkAchievements(); }

    trackHighScore(score) {
        if (score > this.stats.highScore) {
            this.stats.highScore = score;
            this.checkAchievements();
        }
    }

    trackWorldClear(noDeath = false) {
        this.stats.worldsCleared++;
        if (noDeath) this.stats.noDeathRuns++;
        this.checkAchievements();
    }

    trackLanding() { this.stats.currentEnemyStreak = 0; }

    // ─── Core ────────────────────────────────────────────────────────
    checkAchievements() {
        for (const key of Object.keys(ACHIEVEMENTS)) {
            const achievement = ACHIEVEMENTS[key];
            if (!this.unlockedAchievements.has(achievement.id)) {
                if (achievement.condition(this.stats)) {
                    this.unlock(achievement);
                }
            }
        }
    }

    unlock(achievement) {
        if (this.unlockedAchievements.has(achievement.id)) return;
        this.unlockedAchievements.add(achievement.id);
        this.pendingNotifications.push(achievement);
        this.save();
        console.log(`Achievement Unlocked: ${achievement.name}`);
    }

    update() {
        if (this.currentNotification) {
            this.notificationTimer--;
            if (this.notificationTimer <= 0) {
                this.currentNotification = null;
            }
        } else if (this.pendingNotifications.length > 0) {
            this.currentNotification = this.pendingNotifications.shift();
            this.notificationTimer = 180;
            if (this.game.playSound) {
                this.game.playSound('achievement');
            }
        }
    }

    draw(ctx, canvasWidth) {
        if (!this.currentNotification) return;

        const achievement = this.currentNotification;
        const boxWidth = 280;
        const boxHeight = 70;
        const x = (canvasWidth - boxWidth) / 2;
        const progress = Math.min(1, (180 - this.notificationTimer) / 15);
        const fadeOut = this.notificationTimer < 30 ? this.notificationTimer / 30 : 1;

        const y = -boxHeight + (50 + boxHeight) * Math.min(1, progress * 2);

        ctx.save();
        ctx.globalAlpha = fadeOut;

        const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.95)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0.95)');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 4, y + 4, boxWidth, boxHeight);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, boxWidth, boxHeight);

        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        ctx.font = '32px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000';
        ctx.fillText(achievement.icon, x + 15, y + 45);

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('🏅 成就解鎖!', x + 60, y + 25);

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#8B0000';
        ctx.fillText(achievement.name, x + 60, y + 48);

        ctx.restore();
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                unlocked: Array.from(this.unlockedAchievements),
                stats: this.stats
            }));
        } catch (e) { console.warn('save achievements failed', e); }
    }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedAchievements = new Set(data.unlocked || []);
                this.stats = { ...this.stats, ...data.stats };
            }
        } catch (e) {
            console.warn('Failed to load achievements:', e);
        }
    }

    getUnlockedCount() { return this.unlockedAchievements.size; }
    getTotalCount() { return Object.keys(ACHIEVEMENTS).length; }
    isUnlocked(id) { return this.unlockedAchievements.has(id); }

    /**
     * Returns full list with unlock state and (for hidden + locked) obscured fields.
     * Used by the achievements modal in main.js.
     */
    getAllAchievements() {
        return Object.values(ACHIEVEMENTS).map(a => {
            const unlocked = this.unlockedAchievements.has(a.id);
            const obscure = a.hidden && !unlocked;
            return {
                id: a.id,
                name: obscure ? '???' : a.name,
                desc: obscure ? '隱藏成就 — 解鎖以查看' : a.desc,
                icon: obscure ? '🔒' : a.icon,
                hidden: !!a.hidden,
                unlocked
            };
        });
    }
}
