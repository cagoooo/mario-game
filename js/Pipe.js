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
        this.piranhaTimer = 0;
        this.piranhaWaitTime = 60 + Math.random() * 60;

        // Interaction
        this.playerOnTop = false;

        // Portal properties
        this.type = 'NORMAL'; // NORMAL, ENTRANCE, EXIT
        this.destination = null; // { x, y, map }
    }

    killPiranha() {
        if (!this.hasPiranha) return;
        this.piranhaState = 'WAITING';
        this.piranhaOffset = 0;
        this.piranhaTimer = 0;
        this.piranhaWaitTime = 300; // Stay dead for 5 seconds (60fps * 5)
    }

    update() {
        if (!this.hasPiranha) return;

        switch (this.piranhaState) {
            case 'WAITING':
                // Don't emerge if player is standing on the pipe
                if (this.playerOnTop) {
                    this.piranhaTimer = 0;
                    return;
                }

                this.piranhaTimer++;
                if (this.piranhaTimer > this.piranhaWaitTime) {
                    this.piranhaState = 'EMERGING';
                    this.piranhaTimer = 0;
                    // Reset wait time for next cycle
                    this.piranhaWaitTime = 60 + Math.random() * 60;
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
        // === PIRANHA PLANT ===
        // Draw plant BEFORE pipe so it looks like it's coming out from inside
        if (this.hasPiranha && this.piranhaOffset > 0) {
            const plantY = this.y - this.piranhaOffset;
            const centerX = screenX + 24;

            // Stem (Green)
            ctx.fillStyle = '#228B22';
            ctx.fillRect(centerX - 6, plantY + 20, 12, this.piranhaOffset);

            // Stem highlight
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(centerX - 4, plantY + 20, 4, this.piranhaOffset);

            // Head (Red Bulb)
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(centerX, plantY + 10, 16, 0, Math.PI * 2);
            ctx.fill();

            // White Spots (Polka dots)
            ctx.fillStyle = '#FFFFFF';
            const spots = [
                { x: -8, y: -6, r: 4 },
                { x: 8, y: -4, r: 3 },
                { x: 0, y: -10, r: 3 },
                { x: -6, y: 6, r: 3 },
                { x: 7, y: 5, r: 4 }
            ];
            spots.forEach(spot => {
                ctx.beginPath();
                ctx.arc(centerX + spot.x, plantY + 10 + spot.y, spot.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Lips (White/Pinkish)
            ctx.fillStyle = '#F0F0F0';
            ctx.beginPath();
            // Top lip
            ctx.ellipse(centerX, plantY + 10, 12, 6, 0, Math.PI, 0);
            // Bottom lip
            ctx.ellipse(centerX, plantY + 10, 12, 6, 0, 0, Math.PI);
            ctx.fill();

            // Mouth interior (Dark)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(centerX, plantY + 10, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Teeth (Sharp triangles)
            ctx.fillStyle = '#FFFFFF';
            // Top teeth
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue;
                ctx.beginPath();
                ctx.moveTo(centerX + i * 3, plantY + 7);
                ctx.lineTo(centerX + i * 3 - 1.5, plantY + 10);
                ctx.lineTo(centerX + i * 3 + 1.5, plantY + 10);
                ctx.fill();
            }
            // Bottom teeth
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue;
                ctx.beginPath();
                ctx.moveTo(centerX + i * 3, plantY + 13);
                ctx.lineTo(centerX + i * 3 - 1.5, plantY + 10);
                ctx.lineTo(centerX + i * 3 + 1.5, plantY + 10);
                ctx.fill();
            }
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
            // Variable height: 40 to 120 (Player jump max is ~144, so 120 is safe)
            const height = 40 + Math.random() * 80;
            const hasPiranha = Math.random() > 0.3; // 70% chance for a piranha plant

            const pipe = new Pipe(x + Math.random() * 100, groundY - height, height, hasPiranha);

            // 10% chance to be an entrance pipe (if it doesn't have a piranha)
            if (!hasPiranha && Math.random() < 0.1) {
                pipe.type = 'ENTRANCE';
                // Visual indicator? Maybe a different color or just knowledge?
                // For now, let's keep it hidden/secret.
            }

            pipes.push(pipe);
        }
    }

    return pipes;
}
