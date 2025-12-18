/**
 * Tutorial System - 新手教學系統
 * 在遊戲開始時顯示操作提示
 */
export class Tutorial {
    constructor(game) {
        this.game = game;
        this.isActive = true;
        this.currentStep = 0;
        this.stepTimer = 0;
        this.fadeAlpha = 1.0;

        // Tutorial steps configuration
        this.steps = [
            {
                text: '歡迎來到超級瑪利歐！',
                subtext: '',
                duration: 120, // 2 seconds at 60fps
                icon: '🎮'
            },
            {
                text: '← → 移動',
                subtext: '使用方向鍵或點擊螢幕左右側',
                duration: 180,
                icon: '🏃'
            },
            {
                text: '空白鍵 跳躍',
                subtext: '點擊畫面或按空白鍵可跳躍',
                duration: 180,
                icon: '⬆️'
            },
            {
                text: '踩踏敵人消滅！',
                subtext: '從上方跳到敵人頭上',
                duration: 180,
                icon: '👟'
            },
            {
                text: '收集金幣獲得分數',
                subtext: '問號磚塊內有驚喜！',
                duration: 180,
                icon: '🪙'
            },
            {
                text: '準備開始！',
                subtext: '',
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

        // Check if current step is complete
        if (this.stepTimer >= currentStepData.duration) {
            this.stepTimer = 0;
            this.currentStep++;

            if (this.currentStep >= this.steps.length) {
                this.complete();
            }
        }

        // Calculate fade effect for step transitions
        const stepProgress = this.stepTimer / currentStepData.duration;
        if (stepProgress < 0.1) {
            this.fadeAlpha = stepProgress / 0.1; // Fade in
        } else if (stepProgress > 0.85) {
            this.fadeAlpha = (1 - stepProgress) / 0.15; // Fade out
        } else {
            this.fadeAlpha = 1.0;
        }
    }

    draw(ctx, width, height) {
        if (!this.isActive) return;

        const currentStepData = this.steps[this.currentStep];
        if (!currentStepData) return;

        ctx.save();

        // Semi-transparent overlay (less opaque to see game behind)
        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, width, height);

        // Center content
        const centerX = width / 2;
        const centerY = height / 2 - 30;

        ctx.globalAlpha = this.fadeAlpha;

        // Icon
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText(currentStepData.icon, centerX, centerY - 40);

        // Main text with shadow
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(currentStepData.text, centerX + 2, centerY + 12);
        ctx.fillStyle = '#FFF';
        ctx.fillText(currentStepData.text, centerX, centerY + 10);

        // Subtext
        if (currentStepData.subtext) {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#CCC';
            ctx.fillText(currentStepData.subtext, centerX, centerY + 45);
        }

        // Skip hint at bottom
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('點擊螢幕跳過教學', centerX, height - 30);

        // Progress indicator
        const progressWidth = 200;
        const progressHeight = 4;
        const progressX = centerX - progressWidth / 2;
        const progressY = height - 60;

        // Background bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

        // Progress bar
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
        // Play a sound when tutorial ends
        if (this.game && this.game.playSound) {
            this.game.playSound('menuSelect');
        }
    }

    isCompleted() {
        return !this.isActive;
    }
}
