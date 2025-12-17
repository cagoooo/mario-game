// Achievement System for tracking player accomplishments
export const ACHIEVEMENTS = {
    FIRST_ENEMY: {
        id: 'first_enemy',
        name: '初戰告捷',
        desc: '首次擊敗敵人',
        icon: '👊',
        condition: (stats) => stats.enemiesKilled >= 1
    },
    COIN_100: {
        id: 'coin_100',
        name: '金幣收藏家',
        desc: '累計收集100枚金幣',
        icon: '💰',
        condition: (stats) => stats.totalCoins >= 100
    },
    COIN_500: {
        id: 'coin_500',
        name: '財富大亨',
        desc: '累計收集500枚金幣',
        icon: '🏆',
        condition: (stats) => stats.totalCoins >= 500
    },
    FIRST_BOSS: {
        id: 'first_boss',
        name: 'Boss 獵人',
        desc: '首次擊敗Boss',
        icon: '👹',
        condition: (stats) => stats.bossesKilled >= 1
    },
    STAR_POWER: {
        id: 'star_power',
        name: '無敵之星',
        desc: '獲得無敵星',
        icon: '⭐',
        condition: (stats) => stats.starsCollected >= 1
    },
    BONUS_LEVEL: {
        id: 'bonus_level',
        name: '秘密發現',
        desc: '進入金幣關卡',
        icon: '🚀',
        condition: (stats) => stats.bonusLevelsEntered >= 1
    },
    MEGA_DESTROY: {
        id: 'mega_destroy',
        name: '破壞王',
        desc: '巨大化破壞10個物件',
        icon: '💪',
        condition: (stats) => stats.megaDestroys >= 10
    },
    HIGH_SCORE_1000: {
        id: 'high_score_1000',
        name: '千分達人',
        desc: '單次遊戲得分超過1000',
        icon: '🎯',
        condition: (stats) => stats.highScore >= 1000
    },
    ENEMY_STREAK: {
        id: 'enemy_streak',
        name: '連續踩踏',
        desc: '連續踩死5隻敵人不落地',
        icon: '🔥',
        condition: (stats) => stats.maxEnemyStreak >= 5
    }
};

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = new Set();
        this.stats = {
            enemiesKilled: 0,
            totalCoins: 0,
            bossesKilled: 0,
            starsCollected: 0,
            bonusLevelsEntered: 0,
            megaDestroys: 0,
            highScore: 0,
            maxEnemyStreak: 0,
            currentEnemyStreak: 0
        };
        this.pendingNotifications = [];
        this.notificationTimer = 0;
        this.currentNotification = null;

        this.load();
    }

    // Track various game events
    trackEnemyKill() {
        this.stats.enemiesKilled++;
        this.stats.currentEnemyStreak++;
        if (this.stats.currentEnemyStreak > this.stats.maxEnemyStreak) {
            this.stats.maxEnemyStreak = this.stats.currentEnemyStreak;
        }
        this.checkAchievements();
    }

    trackCoinCollect() {
        this.stats.totalCoins++;
        this.checkAchievements();
    }

    trackBossKill() {
        this.stats.bossesKilled++;
        this.checkAchievements();
    }

    trackStarCollect() {
        this.stats.starsCollected++;
        this.checkAchievements();
    }

    trackBonusLevel() {
        this.stats.bonusLevelsEntered++;
        this.checkAchievements();
    }

    trackMegaDestroy() {
        this.stats.megaDestroys++;
        this.checkAchievements();
    }

    trackHighScore(score) {
        if (score > this.stats.highScore) {
            this.stats.highScore = score;
            this.checkAchievements();
        }
    }

    trackLanding() {
        this.stats.currentEnemyStreak = 0;
    }

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
        // Handle notification display
        if (this.currentNotification) {
            this.notificationTimer--;
            if (this.notificationTimer <= 0) {
                this.currentNotification = null;
            }
        } else if (this.pendingNotifications.length > 0) {
            this.currentNotification = this.pendingNotifications.shift();
            this.notificationTimer = 180; // Show for 3 seconds
            if (this.game.playSound) {
                this.game.playSound('coin'); // Play unlock sound
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

        // Slide in from top
        const y = -boxHeight + (50 + boxHeight) * Math.min(1, progress * 2);

        ctx.save();
        ctx.globalAlpha = fadeOut;

        // Background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.95)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0.95)');

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 4, y + 4, boxWidth, boxHeight);

        // Main box
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Icon
        ctx.font = '32px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000';
        ctx.fillText(achievement.icon, x + 15, y + 45);

        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('🏅 成就解鎖!', x + 60, y + 25);

        // Achievement name
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#8B0000';
        ctx.fillText(achievement.name, x + 60, y + 48);

        ctx.restore();
    }

    save() {
        const data = {
            unlocked: Array.from(this.unlockedAchievements),
            stats: this.stats
        };
        localStorage.setItem('marioAchievements', JSON.stringify(data));
    }

    load() {
        try {
            const saved = localStorage.getItem('marioAchievements');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedAchievements = new Set(data.unlocked || []);
                this.stats = { ...this.stats, ...data.stats };
            }
        } catch (e) {
            console.warn('Failed to load achievements:', e);
        }
    }

    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }

    getTotalCount() {
        return Object.keys(ACHIEVEMENTS).length;
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    getAllAchievements() {
        return Object.values(ACHIEVEMENTS).map(a => ({
            ...a,
            unlocked: this.unlockedAchievements.has(a.id)
        }));
    }
}
