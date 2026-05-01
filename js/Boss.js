import { Enemy } from './Enemy.js';

// Base Boss class with shared functionality
export class Boss extends Enemy {
    constructor(x, y, difficultyMultiplier = 1, bossType = 'KOOPA_KING') {
        super(x, y, 0, -1, null);
        this.type = 'boss';
        this.bossType = bossType;
        this.width = 80;
        this.height = 80;
        this.maxHp = 3;
        this.hp = this.maxHp;
        this.difficultyMultiplier = difficultyMultiplier;

        // State Machine
        this.state = 'IDLE';
        this.stateTimer = 0;
        this.facing = -1;

        // Movement
        this.speed = 2 * difficultyMultiplier;
        this.jumpForce = -12;
        this.velY = 0;
        this.groundY = y;

        // Attack
        this.attackCooldown = 180;
        this.attackTimer = 0;

        // Invincibility after hit
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Visuals
        this.flashTimer = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;

        // Boss-specific initialization
        this.initBossType();
    }

    initBossType() {
        switch (this.bossType) {
            case 'SAND_SCORPION':
                this.speed = 3 * this.difficultyMultiplier;
                this.attackCooldown = 120;
                this.maxHp = 3;
                this.hp = this.maxHp;
                break;
            case 'ICE_GOLEM':
                this.speed = 1.5 * this.difficultyMultiplier;
                this.attackCooldown = 200;
                this.maxHp = 4;
                this.hp = this.maxHp;
                this.width = 90;
                this.height = 90;
                break;
            case 'GHOST_KING':
                this.speed = 2.5 * this.difficultyMultiplier;
                this.attackCooldown = 150;
                this.maxHp = 3;
                this.hp = this.maxHp;
                this.canFloat = true;
                this.floatPhase = 0;
                break;
            default: // KOOPA_KING
                break;
        }
    }

    update(player, platforms, width) {
        if (!this.alive) {
            this.y += 5;
            return;
        }

        // Ghost King floats
        if (this.bossType === 'GHOST_KING' && this.canFloat) {
            this.floatPhase += 0.05;
            this.velY += 0.2;
            this.y += this.velY;
            this.y += Math.sin(this.floatPhase) * 0.5;
        } else {
            this.velY += 0.5;
            this.y += this.velY;
        }

        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velY = 0;
        }

        if (player) {
            this.facing = player.x < this.x ? -1 : 1;
        }

        switch (this.state) {
            case 'IDLE':
                this.handleIdleState(player);
                break;
            case 'MOVE':
                this.handleMoveState(player);
                break;
            case 'ATTACK':
                this.handleAttackState(player);
                break;
            case 'HURT':
                this.handleHurtState();
                break;
            case 'TELEPORT':
                this.handleTeleportState(player);
                break;
        }

        if (this.isInvincible) {
            this.invincibleTimer--;
            this.flashTimer++;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.flashTimer = 0;
            }
        }

        if (this.attackTimer > 0) {
            this.attackTimer--;
        }
    }

    handleIdleState(player) {
        this.stateTimer++;
        if (this.stateTimer > 60 + Math.random() * 60) {
            this.stateTimer = 0;
            const rand = Math.random();

            // Ghost King can teleport
            if (this.bossType === 'GHOST_KING' && rand < 0.3) {
                this.state = 'TELEPORT';
            } else if (rand < 0.6) {
                this.state = 'MOVE';
            } else if (this.attackTimer <= 0) {
                this.state = 'ATTACK';
            } else {
                this.state = 'MOVE';
            }
        }
    }

    handleMoveState(player) {
        this.stateTimer++;
        this.x += this.speed * this.facing;

        if (this.stateTimer % 120 === 0 && Math.random() < 0.5 && this.y === this.groundY) {
            this.velY = this.jumpForce;
        }

        if (this.stateTimer > 180) {
            this.stateTimer = 0;
            this.state = 'IDLE';
        }
    }

    handleAttackState(player) {
        this.stateTimer++;

        if (this.stateTimer === 1) {
            // Attack behavior based on boss type
            switch (this.bossType) {
                case 'SAND_SCORPION':
                    this.velY = -8;
                    break;
                case 'ICE_GOLEM':
                    // Ground pound
                    this.velY = -18;
                    break;
                case 'GHOST_KING':
                    this.velY = -10;
                    break;
                default:
                    this.velY = -15;
            }
        }

        if (this.stateTimer > 60 && this.y === this.groundY) {
            this.stateTimer = 0;
            this.attackTimer = this.attackCooldown;
            this.state = 'IDLE';
        }
    }

    handleTeleportState(player) {
        this.stateTimer++;

        if (this.stateTimer === 15) {
            // Teleport to player's position
            if (player) {
                const offset = (Math.random() > 0.5 ? 100 : -100);
                this.x = player.x + offset;
                this.y = this.groundY - 50;
                this.velY = 0;
            }
        }

        if (this.stateTimer > 30) {
            this.stateTimer = 0;
            this.state = 'IDLE';
        }
    }

    handleHurtState() {
        this.stateTimer++;
        if (this.stateTimer > 30) {
            this.stateTimer = 0;
            this.state = 'IDLE';
            if (this.hp === 1) {
                this.speed *= 1.5;
                this.attackCooldown = Math.floor(this.attackCooldown * 0.6);
            }
        }
    }

    takeDamage() {
        if (this.isInvincible || !this.alive) return;

        this.hp--;
        this.isInvincible = true;
        this.invincibleTimer = 120;
        this.state = 'HURT';
        this.stateTimer = 0;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.state = 'DIE';
        this.velY = -12;
        this.rotation = 0;
        this.rotationSpeed = 0.2;
    }

    draw(ctx, camera) {
        if (!this.alive && this.y > camera.y + 1000) return;

        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        if (this.state === 'DIE') {
            this.rotation += this.rotationSpeed;
            ctx.rotate(this.rotation);
        }

        ctx.scale(this.facing, 1);

        if (this.isInvincible && Math.floor(this.flashTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Ghost King teleport effect
        if (this.bossType === 'GHOST_KING' && this.state === 'TELEPORT') {
            ctx.globalAlpha = 0.3 + Math.random() * 0.3;
        }

        // Draw based on boss type
        switch (this.bossType) {
            case 'SAND_SCORPION':
                this.drawSandScorpion(ctx);
                break;
            case 'ICE_GOLEM':
                this.drawIceGolem(ctx);
                break;
            case 'GHOST_KING':
                this.drawGhostKing(ctx);
                break;
            default:
                this.drawKoopaKing(ctx);
        }

        if (this.state === 'HURT') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawKoopaKing(ctx) {
        // Shell
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.ellipse(0, 5, 35, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.fillStyle = '#EEE';
        const spikes = [[-20, -15], [0, -22], [20, -15], [-25, 5], [25, 5]];
        spikes.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(sx - 5, sy);
            ctx.lineTo(sx, sy - 15);
            ctx.lineTo(sx + 5, sy);
            ctx.fill();
        });

        // Head
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.arc(25, -15, 20, 0, Math.PI * 2);
        ctx.fill();

        this.drawBossEyes(ctx, 30, -18, this.state === 'DIE');

        // Teeth
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(35, -10);
        ctx.lineTo(38, -5);
        ctx.lineTo(41, -10);
        ctx.fill();

        // Limbs
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.ellipse(20, 10, 10, 15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-20, 25, 12, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, 25, 12, 15, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSandScorpion(ctx) {
        // Body
        const bodyGradient = ctx.createRadialGradient(0, 5, 5, 0, 5, 35);
        bodyGradient.addColorStop(0, '#D2691E');
        bodyGradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 5, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.ellipse(30, -5, 18, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pincers
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(40, 10, 15, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(40, -20, 15, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Tail (curved up and over)
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.quadraticCurveTo(-50, -30, -40, -50);
        ctx.stroke();

        // Stinger
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-40, -50);
        ctx.lineTo(-35, -65);
        ctx.lineTo(-45, -55);
        ctx.fill();

        this.drawBossEyes(ctx, 35, -8, this.state === 'DIE');

        // Legs
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(-15 + i * 15, 25, 5, 12, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawIceGolem(ctx) {
        // Body (crystalline)
        const bodyGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 45);
        bodyGradient.addColorStop(0, '#E0FFFF');
        bodyGradient.addColorStop(0.5, '#87CEEB');
        bodyGradient.addColorStop(1, '#4682B4');
        ctx.fillStyle = bodyGradient;

        // Main body (hexagonal-ish)
        ctx.beginPath();
        ctx.moveTo(-30, -20);
        ctx.lineTo(-20, -40);
        ctx.lineTo(20, -40);
        ctx.lineTo(30, -20);
        ctx.lineTo(30, 20);
        ctx.lineTo(0, 35);
        ctx.lineTo(-30, 20);
        ctx.closePath();
        ctx.fill();

        // Ice crystals
        ctx.fillStyle = '#ADD8E6';
        const crystals = [[-25, -35], [25, -35], [-35, 0], [35, 0]];
        crystals.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 5, cy - 15);
            ctx.lineTo(cx + 5, cy - 15);
            ctx.closePath();
            ctx.fill();
        });

        // Face area
        ctx.fillStyle = '#B0E0E6';
        ctx.beginPath();
        ctx.ellipse(0, -15, 20, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawBossEyes(ctx, 8, -18, this.state === 'DIE', '#00BFFF');

        // Arms
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(-35, 0, 12, 18, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, 0, 12, 18, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGhostKing(ctx) {
        // Ghostly body gradient
        const bodyGradient = ctx.createRadialGradient(0, 0, 10, 0, 10, 50);
        bodyGradient.addColorStop(0, 'rgba(138, 43, 226, 0.9)');
        bodyGradient.addColorStop(0.7, 'rgba(75, 0, 130, 0.7)');
        bodyGradient.addColorStop(1, 'rgba(48, 0, 82, 0.3)');
        ctx.fillStyle = bodyGradient;

        // Main body (wavy ghost shape)
        ctx.beginPath();
        ctx.moveTo(-30, -30);
        ctx.quadraticCurveTo(0, -50, 30, -30);
        ctx.lineTo(30, 20);
        ctx.quadraticCurveTo(20, 35, 10, 25);
        ctx.quadraticCurveTo(0, 40, -10, 25);
        ctx.quadraticCurveTo(-20, 35, -30, 20);
        ctx.closePath();
        ctx.fill();

        // Crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-20, -40);
        ctx.lineTo(-15, -55);
        ctx.lineTo(-5, -45);
        ctx.lineTo(0, -60);
        ctx.lineTo(5, -45);
        ctx.lineTo(15, -55);
        ctx.lineTo(20, -40);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = 'rgba(200, 180, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(0, -15, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawBossEyes(ctx, 8, -18, this.state === 'DIE', '#FF0000');

        // Ghostly arms
        ctx.fillStyle = 'rgba(138, 43, 226, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-40, 0, 15, 10, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(40, 0, 15, 10, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBossEyes(ctx, eyeX, eyeY, isDead, pupilColor = 'red') {
        if (isDead) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(eyeX - 5, eyeY - 4);
            ctx.lineTo(eyeX + 5, eyeY + 4);
            ctx.moveTo(eyeX + 5, eyeY - 4);
            ctx.lineTo(eyeX - 5, eyeY + 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = pupilColor;
            ctx.beginPath();
            ctx.arc(eyeX + 2, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();

            // Eyebrow
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(eyeX - 8, eyeY - 6);
            ctx.lineTo(eyeX + 8, eyeY - 2);
            ctx.stroke();
        }
    }
}

// Factory function to create boss based on biome
export function createBoss(biome, x, y, difficultyMultiplier = 1) {
    const bossTypes = {
        'PLAINS': 'KOOPA_KING',
        'DESERT': 'SAND_SCORPION',
        'SNOW': 'ICE_GOLEM',
        'SPOOKY': 'GHOST_KING'
    };

    const bossType = bossTypes[biome] || 'KOOPA_KING';
    console.log(`Creating boss for biome ${biome}: ${bossType}`);
    return new Boss(x, y, difficultyMultiplier, bossType);
}
