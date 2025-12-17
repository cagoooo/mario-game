// Checkpoint - Flag pole that saves player progress
export class Checkpoint {
    constructor(x, y) {
        this.x = x;
        this.baseY = y; // Ground level
        this.poleHeight = 120;

        // Collision box - the entire pole area
        this.y = y - this.poleHeight; // Top of pole
        this.width = 60; // Wider for easier collision
        this.height = this.poleHeight; // Full pole height

        this.activated = false;
        this.flagY = 1; // Flag position on pole (0 = top, 1 = bottom)
        this.animationTimer = 0;
    }

    activate(game) {
        if (this.activated) return;

        this.activated = true;
        game.lastCheckpointX = this.x;
        game.playSound('coin');
        game.addScorePopup(this.x + 20, this.y, 'CHECKPOINT!', true);

        // Add celebratory particles
        game.addParticles(this.x + 20, this.y + 30, 15, '#FFD700');

        // Flag already at bottom, will animate to top
        console.log('Checkpoint activated at x:', this.x);
    }

    update() {
        // Animate flag going up when activated
        if (this.activated && this.flagY > 0) {
            this.flagY -= 0.03;
            if (this.flagY < 0) this.flagY = 0;
        }

        if (this.activated) {
            this.animationTimer++;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x;
        const groundY = this.baseY; // Use baseY (ground level) for drawing

        // Pole shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(drawX + 18, groundY - this.poleHeight + 5, 8, this.poleHeight);

        // Pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(drawX + 16, groundY - this.poleHeight, 8, this.poleHeight);

        // Pole top ball
        ctx.fillStyle = this.activated ? '#FFD700' : '#C0C0C0';
        ctx.beginPath();
        ctx.arc(drawX + 20, groundY - this.poleHeight - 8, 10, 0, Math.PI * 2);
        ctx.fill();

        // Highlight on ball
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(drawX + 17, groundY - this.poleHeight - 11, 4, 0, Math.PI * 2);
        ctx.fill();

        // Flag
        const flagTopY = groundY - this.poleHeight + 10;
        const flagBottomY = groundY - 30;
        const currentFlagY = flagTopY + (flagBottomY - flagTopY) * this.flagY;

        // Flag wave animation
        const wave = this.activated ? Math.sin(this.animationTimer * 0.1) * 3 : 0;

        ctx.fillStyle = this.activated ? '#FF0000' : '#808080';
        ctx.beginPath();
        ctx.moveTo(drawX + 24, currentFlagY);
        ctx.lineTo(drawX + 60 + wave, currentFlagY + 15);
        ctx.lineTo(drawX + 24, currentFlagY + 30);
        ctx.closePath();
        ctx.fill();

        // Flag border
        ctx.strokeStyle = this.activated ? '#8B0000' : '#404040';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Star on flag (if activated)
        if (this.activated) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', drawX + 42 + wave, currentFlagY + 20);
        }

        // Base
        ctx.fillStyle = '#654321';
        ctx.fillRect(drawX, groundY - 20, 40, 20);

        // Grass on base
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(drawX + 20, groundY - 18, 22, 8, 0, Math.PI, 0);
        ctx.fill();

        ctx.restore();
    }
}

// Generate checkpoints at intervals
export function generateCheckpoints(startX, endX, groundY, existingCheckpoints = []) {
    const checkpoints = [];
    const checkpointInterval = 1000; // Every 1000 pixels (more frequent)

    // Find last checkpoint position
    let lastCheckpointX = 0;
    existingCheckpoints.forEach(cp => {
        if (cp.x > lastCheckpointX) lastCheckpointX = cp.x;
    });

    // Generate new checkpoints
    const firstCheckpointX = Math.ceil((Math.max(startX, lastCheckpointX + checkpointInterval)) / checkpointInterval) * checkpointInterval;

    for (let x = firstCheckpointX; x < endX; x += checkpointInterval) {
        if (x > startX + 500) { // Don't place too close to chunk start
            checkpoints.push(new Checkpoint(x, groundY));
        }
    }

    return checkpoints;
}
