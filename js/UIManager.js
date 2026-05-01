/**
 * UIManager.js - Centralized UI Rendering
 * 
 * Handles all in-game UI elements like lives display, boss health bar,
 * score popups, and overlay screens.
 * @version 2.8.0
 */

import { CONFIG } from './Config.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }

    /**
     * Draw all UI elements
     */
    draw() {
        this.drawLivesUI();
        this.drawCoinCounter();
        this.drawAchievementBadges();
        this.drawStatsPanel();
        this.drawScorePopups();

        if (this.game.bossBattleActive && this.game.boss?.alive) {
            this.drawBossHealthBar();
        }

        if (this.game.isNewHighScore && this.game.gameRunning) {
            this.drawNewHighScoreIndicator();
        }
    }

    /**
     * Draw achievement badges in top-right corner
     */
    drawAchievementBadges() {
        if (!this.game.achievementSystem) return;

        const unlocked = this.game.achievementSystem.getUnlockedCount();
        const total = this.game.achievementSystem.getTotalCount();
        const achievements = this.game.achievementSystem.getAllAchievements();

        const x = this.game.width - 15;
        const y = 25;

        // Badge count
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;

        const countText = `🏅 ${unlocked}/${total}`;
        this.ctx.strokeText(countText, x, y);
        this.ctx.fillText(countText, x, y);

        // Display unlocked achievement icons (max 5 visible)
        const unlockedAchievements = achievements.filter(a => a.unlocked);
        const displayCount = Math.min(unlockedAchievements.length, 5);

        if (displayCount > 0) {
            this.ctx.font = '16px Arial';
            let iconX = x;

            for (let i = 0; i < displayCount; i++) {
                const achievement = unlockedAchievements[unlockedAchievements.length - 1 - i];
                this.ctx.fillText(achievement.icon, iconX - (i * 22), y + 22);
            }

            // Show +N if more achievements
            if (unlockedAchievements.length > 5) {
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillStyle = '#FFF';
                this.ctx.fillText(`+${unlockedAchievements.length - 5}`, iconX - (5 * 22), y + 22);
            }
        }
    }

    /**
     * Draw mini stats panel (top center)
     */
    drawStatsPanel() {
        if (!this.game.achievementSystem) return;

        const stats = this.game.achievementSystem.stats;
        const x = this.game.width / 2;
        const y = 18;

        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;

        // Stats line: 💀 X | 🪙 Y | ⏱ Z
        const statsText = `💀 ${stats.enemiesKilled} | 🪙 ${stats.totalCoins} | 👑 ${this.game.score}`;

        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.strokeText(statsText, x, y);
        this.ctx.fillText(statsText, x, y);
    }

    /**
     * Draw lives count in top-left corner
     */
    drawLivesUI() {
        const { x, y } = CONFIG.UI.LIVES_POSITION;

        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        const livesText = `❤️ × ${this.game.lives}`;
        this.ctx.strokeText(livesText, x, y);
        this.ctx.fillText(livesText, x, y);
    }

    /**
     * Draw total coin counter in top-left (below lives)
     * Shows progress towards next 1UP (every 100 coins)
     */
    drawCoinCounter() {
        const x = 15;
        const y = 55; // Below lives display

        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        const sessionCoins = this.game.sessionCoins || 0;
        const coinsToNextLife = sessionCoins % 100;
        const coinText = `🪙 ${coinsToNextLife}/100 → 1UP`;
        this.ctx.strokeText(coinText, x, y);
        this.ctx.fillText(coinText, x, y);

        // Draw progress bar
        const barX = x;
        const barY = y + 5;
        const barWidth = 80;
        const barHeight = 4;
        const progress = coinsToNextLife / 100;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress fill
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#32CD32');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    /**
     * Draw BOSS health bar at top center
     */
    drawBossHealthBar() {
        const boss = this.game.boss;
        if (!boss) return;

        this.ctx.save();

        const barWidth = CONFIG.UI.BOSS_BAR_WIDTH;
        const barHeight = CONFIG.UI.BOSS_BAR_HEIGHT;
        const barX = this.game.width / 2 - barWidth / 2;
        const barY = CONFIG.UI.BOSS_BAR_Y;

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX + 4, barY + 4, barWidth, barHeight);

        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const hpPercent = boss.hp / boss.maxHp;
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(1, '#FF0000');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Label
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 20px "Arial Black", Gadget, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText('☠️ BOSS ☠️', this.game.width / 2, barY - 10);
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }

    /**
     * Draw floating score popups
     */
    drawScorePopups() {
        const camera = this.game.camera;

        this.game.scorePopups.forEach(popup => {
            if (popup.x > camera.x - 50 && popup.x < camera.x + this.game.width + 50) {
                const screenX = popup.x - camera.x;
                const alpha = popup.life / CONFIG.GAME.SCORE_POPUP_DURATION;

                this.ctx.save();
                this.ctx.globalAlpha = alpha;

                if (popup.isCritical) {
                    this.ctx.font = 'bold 40px "Arial Black", sans-serif';
                    this.ctx.fillStyle = CONFIG.COLORS.GOLD;
                    this.ctx.strokeStyle = '#FF4500';
                    this.ctx.lineWidth = 4;

                    const shakeX = (Math.random() - 0.5) * 4;
                    const shakeY = (Math.random() - 0.5) * 4;
                    this.ctx.translate(shakeX, shakeY);

                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(`+${popup.value}`, screenX, popup.y);
                    this.ctx.fillText(`+${popup.value}`, screenX, popup.y);
                } else {
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.fillStyle = CONFIG.COLORS.GOLD;
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 3;
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(`+${popup.value}`, screenX, popup.y);
                    this.ctx.fillText(`+${popup.value}`, screenX, popup.y);
                }

                this.ctx.restore();
            }
        });
    }

    /**
     * Draw pulsing new high score indicator
     */
    drawNewHighScoreIndicator() {
        this.ctx.save();

        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = CONFIG.COLORS.GOLD;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        this.ctx.globalAlpha = pulse;

        this.ctx.strokeText('🎉 新紀錄！', this.game.width / 2, 100);
        this.ctx.fillText('🎉 新紀錄！', this.game.width / 2, 100);

        this.ctx.restore();
    }

    /**
     * Draw the "lives remaining" screen after death
     */
    drawLivesScreen() {
        this.ctx.save();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.game.width, this.game.height);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`× ${this.game.lives}`, this.game.width / 2 + 30, this.game.height / 2);

        // Mario icon
        this.ctx.fillStyle = CONFIG.COLORS.MARIO_RED;
        this.ctx.beginPath();
        this.ctx.arc(this.game.width / 2 - 40, this.game.height / 2 - 10, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }
}
