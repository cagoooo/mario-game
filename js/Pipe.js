export class Pipe {
    constructor(x, y, height, hasPiranha = false) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = height;

        // Piranha plant
        this.hasPiranha = hasPiranha;
        this.piranhaOffset = 0;
        this.piranhaState = 'WAITING'; // WAITING, EMERGING, ATTACKING, RETREATING
        this.piranhaTimer = 0;
        this.piranhaWaitTime = 60 + Math.random() * 60;
    }

    update() {
        if (!this.hasPiranha) return;

        switch (this.piranhaState) {
            case 'WAITING':
                this.piranhaTimer++;
                if (this.piranhaTimer > this.piranhaWaitTime) {
                    this.piranhaState = 'EMERGING';
                    this.piranhaTimer = 0;
                }
                break;
            case 'EMERGING':
                this.piranhaOffset += 1.0;
                if (this.piranhaOffset >= 30) {
                    this.piranhaOffset = 30;
                    this.piranhaState = 'ATTACKING';
                    this.piranhaTimer = 0;
                }
                break;
            case 'ATTACKING':
                this.piranhaTimer++;
                if (this.piranhaTimer > 90) { // Stay up for 1.5 seconds
                    this.piranhaState = 'RETREATING';
                }
                break;
            case 'RETREATING':
                this.piranhaOffset -= 1.0;
                if (this.piranhaOffset <= 0) {
                    this.piranhaOffset = 0;
                    this.piranhaState = 'WAITING';
                    this.piranhaTimer = 0;
                    this.piranhaWaitTime = 60 + Math.random() * 60;
                }
                break;
        }
    }

    getPiranhaHitbox() {
        if (!this.hasPiranha || this.piranhaOffset < 10) return null;
        return {
            x: this.x + 10,
            y: this.y - this.piranhaOffset,
            width: 28,
            height: 30
        };
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;

        // === PIRANHA PLANT ===
        // Draw plant BEFORE pipe so it looks like it's coming out from inside
        if (this.hasPiranha && this.piranhaOffset > 0) {
            const plantY = this.y - this.piranhaOffset;

            // Stem
            ctx.fillStyle = '#228B22';
            ctx.fillRect(screenX + 18, plantY + 20, 12, this.piranhaOffset);

            // Head (red spotted)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.ellipse(screenX + 24, plantY + 15, 16, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            // White spots
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(screenX + 18, plantY + 10, 4, 0, Math.PI * 2);
            ctx.arc(screenX + 30, plantY + 12, 3, 0, Math.PI * 2);
            ctx.arc(screenX + 22, plantY + 20, 3, 0, Math.PI * 2);
            ctx.fill();

            // Mouth (open)
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse(screenX + 24, plantY + 18, 10, 6, 0, 0, Math.PI);
            ctx.fill();

            // Teeth
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX + 16 + i * 5, plantY + 18);
                ctx.lineTo(screenX + 18 + i * 5, plantY + 22);
                ctx.lineTo(screenX + 20 + i * 5, plantY + 18);
                ctx.fill();
            }

            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(screenX + 18, plantY + 8, 4, 0, Math.PI * 2);
            ctx.arc(screenX + 30, plantY + 8, 4, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(screenX + 19, plantY + 8, 2, 0, Math.PI * 2);
            ctx.arc(screenX + 31, plantY + 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // === PIPE BODY ===
        // Main pipe body (dark green)
        ctx.fillStyle = '#228B22';
        ctx.fillRect(screenX + 4, this.y + 20, 40, this.height - 20);

        // Pipe rim (lighter green)
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(screenX, this.y, this.width, 24);

        // Pipe highlight
        ctx.fillStyle = '#90EE90';
        ctx.fillRect(screenX + 4, this.y + 4, 8, 16);
        ctx.fillRect(screenX + 8, this.y + 24, 6, this.height - 30);

        // Pipe shadow
        ctx.fillStyle = '#006400';
        ctx.fillRect(screenX + 36, this.y + 4, 8, 16);
        ctx.fillRect(screenX + 38, this.y + 24, 6, this.height - 30);
    }
}

export function generatePipes(startX, endX, groundY) {
    const pipes = [];

    // Ensure we align pipes to a grid or just random within chunk
    // Let's start from the first multiple of 500 after startX
    let firstPipeX = Math.ceil(startX / 500) * 500;
    if (firstPipeX < startX) firstPipeX += 500;

    for (let x = firstPipeX; x < endX; x += 500) {
        if (Math.random() > 0.3) { // 70% chance for a pipe
            const height = 60 + Math.random() * 40;
            const hasPiranha = Math.random() > 0.3; // 70% chance for a piranha plant
            pipes.push(new Pipe(x + Math.random() * 100, groundY - height, height, hasPiranha));
        }
    }

    return pipes;
}
