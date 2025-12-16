import { Enemy } from './Enemy.js?v=1.9.27';

export class Boss extends Enemy {
    constructor(x, y, difficultyMultiplier = 1) {
        super(x, y, 0, -1, null); // Start stationary
        this.type = 'boss';
        this.width = 80;
        this.height = 80;
        this.maxHp = 3;
        this.hp = this.maxHp;
        this.difficultyMultiplier = difficultyMultiplier;

        // State Machine
        this.state = 'IDLE'; // IDLE, MOVE, ATTACK, HURT, DIE
        this.stateTimer = 0;
        this.facing = -1; // -1 Left, 1 Right

        // Movement
        this.speed = 2 * difficultyMultiplier;
        this.jumpForce = -12;
        this.velY = 0;
        this.groundY = y;

        // Attack
        this.attackCooldown = 180; // 3 seconds
        this.attackTimer = 0;

        // Invincibility after hit
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Visuals
        this.flashTimer = 0;
    }

    update(player, platforms, width) {
        if (!this.alive) {
            this.y += 5; // Fall off screen
            return;
        }

        // Gravity
        this.velY += 0.5;
        this.y += this.velY;

        // Ground collision (Simple floor check for now, can be improved with platform collision)
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velY = 0;
        }

        // Face player
        if (player) {
            this.facing = player.x < this.x ? -1 : 1;
        }

        // State Logic
        switch (this.state) {
            case 'IDLE':
                this.handleIdleState(player);
                break;
            case 'MOVE':
                this.handleMoveState(player);
                break;
            case 'ATTACK':
                this.handleAttackState();
                break;
            case 'HURT':
                this.handleHurtState();
                break;
        }

        // Invincibility
        if (this.isInvincible) {
            this.invincibleTimer--;
            this.flashTimer++;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.flashTimer = 0;
            }
        }

        // Attack Cooldown
        if (this.attackTimer > 0) {
            this.attackTimer--;
        }
    }

    handleIdleState(player) {
        this.stateTimer++;
        // Wait for 1-2 seconds then decide next move
        if (this.stateTimer > 60 + Math.random() * 60) {
            this.stateTimer = 0;
            const rand = Math.random();
            if (rand < 0.6) {
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

        // Move towards player
        this.x += this.speed * this.facing;

        // Jump randomly or if stuck (simple random jump for now)
        if (this.stateTimer % 120 === 0 && Math.random() < 0.5 && this.y === this.groundY) {
            this.velY = this.jumpForce;
        }

        // Stop moving after some time
        if (this.stateTimer > 180) {
            this.stateTimer = 0;
            this.state = 'IDLE';
        }
    }

    handleAttackState() {
        this.stateTimer++;

        if (this.stateTimer === 1) {
            // Start attack animation / telegraph
            this.velY = -15; // Big jump
        }

        if (this.stateTimer === 30) {
            // Perform attack (e.g., shoot fireball or ground pound impact)
            // For now, let's just make it a big jump that tracks slightly
        }

        if (this.stateTimer > 60 && this.y === this.groundY) {
            this.stateTimer = 0;
            this.attackTimer = this.attackCooldown;
            this.state = 'IDLE';
        }
    }

    handleHurtState() {
        this.stateTimer++;
        if (this.stateTimer > 30) {
            this.stateTimer = 0;
            this.state = 'IDLE'; // Return to fight
            // Enrage if low HP
            if (this.hp === 1) {
                this.speed *= 1.5;
                this.attackCooldown = 90;
            }
        }
    }

    takeDamage() {
        if (this.isInvincible || !this.alive) return;

        this.hp--;
        this.isInvincible = true;
        this.invincibleTimer = 120; // 2 seconds invincibility
        this.state = 'HURT';
        this.stateTimer = 0;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.state = 'DIE';
        this.velY = -12; // Higher hop
        this.rotation = 0;
        this.rotationSpeed = 0.2;
    }

    draw(ctx, camera) {
        if (!this.alive && this.y > camera.y + 1000) return; // Don't draw if fell off

        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Apply rotation if dying
        if (this.state === 'DIE') {
            this.rotation += this.rotationSpeed;
            ctx.rotate(this.rotation);
        }

        ctx.scale(this.facing, 1); // Face direction

        // Flashing when invincible
        if (this.isInvincible && Math.floor(this.flashTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw Boss (Big Spiky Turtle/Koopa King style)

        // Shell
        ctx.fillStyle = '#006400'; // Dark Green
        ctx.beginPath();
        ctx.ellipse(0, 5, 35, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes on shell
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
        ctx.fillStyle = '#2E8B57'; // Sea Green
        ctx.beginPath();
        ctx.arc(25, -15, 20, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Angry or Dead)
        if (this.state === 'DIE') {
            // Dead Eyes (X)
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;

            // Left Eye
            ctx.beginPath();
            ctx.moveTo(25, -22);
            ctx.lineTo(35, -14);
            ctx.moveTo(35, -22);
            ctx.lineTo(25, -14);
            ctx.stroke();
        } else {
            // Angry Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(30, -18, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(32, -18, 2, 0, Math.PI * 2);
            ctx.fill();

            // Eyebrow
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(22, -24);
            ctx.lineTo(38, -20);
            ctx.stroke();
        }

        // Mouth/Teeth
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(35, -10);
        ctx.lineTo(38, -5);
        ctx.lineTo(41, -10);
        ctx.fill();

        // Arms/Legs
        ctx.fillStyle = '#2E8B57';
        // Front Arm
        ctx.beginPath();
        ctx.ellipse(20, 10, 10, 15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // Back Leg
        ctx.beginPath();
        ctx.ellipse(-20, 25, 12, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Front Leg
        ctx.beginPath();
        ctx.ellipse(15, 25, 12, 15, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Hurt State Expression
        if (this.state === 'HURT') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
