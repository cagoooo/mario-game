/**
 * Tutorial.js - 新手教學系統
 *
 * Version-bound first-play detection (v2.28.0+):
 * - localStorage stores `marioTutorialSeenVersion` after the player completes
 *   the tutorial. If TUTORIAL_VERSION (below) is bumped (e.g. new moves added),
 *   players see the updated tutorial once.
 * - Pause menu's「重看教學」button clears the flag → next game restart shows it.
 */

// Bump this whenever tutorial content changes substantively (new steps,
// rewordings that matter). Players who've seen an older version will be
// shown the new one once.
const TUTORIAL_VERSION = '2.34.0';
const STORAGE_KEY = 'marioTutorialSeenVersion';

export class Tutorial {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.stepTimer = 0;
        this.fadeAlpha = 1.0;

        // Skip if this player already saw the current tutorial version
        let alreadySeen = false;
        try {
            alreadySeen = localStorage.getItem(STORAGE_KEY) === TUTORIAL_VERSION;
        } catch (e) { /* localStorage may be blocked */ }

        this.isActive = !alreadySeen;

        this.steps = [
            {
                text: '歡迎來到超級瑪利歐！',
                subtext: '',
                duration: 90,
                icon: '🎮'
            },
            {
                text: '← → 移動 ｜ 空白鍵 跳躍',
                subtext: '也可用 A / D 移動、W 跳；再按一次可二段跳',
                duration: 180,
                icon: '🏃'
            },
            {
                text: '從上方踩敵人消滅',
                subtext: '連續踩多個有額外加分！',
                duration: 150,
                icon: '👟'
            },
            {
                text: 'Shift 衝刺',
                subtext: '按住 Shift 跑得更快',
                duration: 150,
                icon: '⚡'
            },
            {
                text: '↓ 蹲下 ｜ 牆壁＋跳 = 蹬牆跳',
                subtext: '站上水管按 ↓ 進入；手機用下方按鈕',
                duration: 180,
                icon: '🧗'
            },
            {
                text: '收集金幣 ｜ 撞問號磚塊',
                subtext: '裡頭有蘑菇、火焰花、披風⋯⋯各種驚喜',
                duration: 180,
                icon: '🪙'
            },
            {
                text: '披風 = 滑翔 ｜ 火/冰花 = 射子彈',
                subtext: '空中按住跳躍滑翔；取得火／冰花後自動發射',
                duration: 180,
                icon: '🦸'
            },
            {
                text: '收集寶石，抵達終點旗！',
                subtext: '探索關卡可拚三星與最快紀錄；點畫面跳過教學',
                duration: 90,
                icon: '🚀'
            }
        ];

        this.totalDuration = this.steps.reduce((sum, step) => sum + step.duration, 0);
    }

    update() {
        if (!this.isActive) return;

        this.stepTimer++;

        const currentStepData = this.steps[this.currentStep];
        if (!currentStepData) {
            this.complete();
            return;
        }

        if (this.stepTimer >= currentStepData.duration) {
            this.stepTimer = 0;
            this.currentStep++;
            if (this.currentStep >= this.steps.length) {
                this.complete();
            }
        }

        const stepProgress = this.stepTimer / currentStepData.duration;
        if (stepProgress < 0.1) {
            this.fadeAlpha = stepProgress / 0.1;
        } else if (stepProgress > 0.85) {
            this.fadeAlpha = (1 - stepProgress) / 0.15;
        } else {
            this.fadeAlpha = 1.0;
        }
    }

    draw(ctx, width, height) {
        if (!this.isActive) return;

        const currentStepData = this.steps[this.currentStep];
        if (!currentStepData) return;

        ctx.save();

        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2 - 30;

        ctx.globalAlpha = this.fadeAlpha;

        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText(currentStepData.icon, centerX, centerY - 40);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(currentStepData.text, centerX + 2, centerY + 12);
        ctx.fillStyle = '#FFF';
        ctx.fillText(currentStepData.text, centerX, centerY + 10);

        if (currentStepData.subtext) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#CCC';
            ctx.fillText(currentStepData.subtext, centerX, centerY + 42);
        }

        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('點擊螢幕跳過教學', centerX, height - 30);

        const progressWidth = 200;
        const progressHeight = 4;
        const progressX = centerX - progressWidth / 2;
        const progressY = height - 60;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

        const overallProgress = (this.currentStep + this.stepTimer / currentStepData.duration) / this.steps.length;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(progressX, progressY, progressWidth * overallProgress, progressHeight);

        ctx.restore();
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;
        try {
            localStorage.setItem(STORAGE_KEY, TUTORIAL_VERSION);
        } catch (e) { /* storage blocked */ }
        if (this.game && this.game.playSound) {
            this.game.playSound('menuSelect');
        }
    }

    isCompleted() {
        return !this.isActive;
    }
}

/**
 * Reset the seen-flag so the tutorial plays again on next game start.
 * Called from Pause menu「重看教學」button.
 */
export function resetTutorial() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* storage blocked */ }
}
