// Base Enemy class (Goomba)
export class Enemy {
    constructor(x, y, speed, direction, spriteSheet) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.direction = direction;
        this.spriteSheet = spriteSheet;
        this.type = 'goomba';
        this.alive = true;

        this.frameWidth = 32;
        this.frameHeight = 32;
        this.animationFrame = 0;
        this.animationTick = 0;

        // Freeze state
        this.frozen = false;
        this.frozenTimer = 0;
        this.frozenDuration = 180; // 3 seconds at 60fps
        this.originalSpeed = speed;
    }

    reset(x, y, speed, direction) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.direction = direction;
        this.alive = true;
        this.animationFrame = 0;
        this.animationTick = 0;
        // Type specific reset logic might be needed if subclasses override properties
    }

    update(canvasWidth) {
        if (!this.alive) return;

        // Handle frozen state
        if (this.frozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
                this.speed = this.originalSpeed;
            }
            return; // Don't move while frozen
        }

        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.direction *= -1;
        }

        this.animationTick++;
        if (this.animationTick >= 10) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTick = 0;
        }
    }

    freeze() {
        this.frozen = true;
        this.frozenTimer = this.frozenDuration;
        this.originalSpeed = this.speed;
        this.speed = 0;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Apply frozen visual effect
        if (this.frozen) {
            ctx.globalAlpha = 0.9;
            ctx.filter = 'hue-rotate(180deg) saturate(150%)';
        }

        // Draw Goomba-like enemy
        ctx.fillStyle = this.frozen ? '#87CEEB' : '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 5, 15, 0, Math.PI * 2);
        ctx.fill();

        // Head (tan mushroom cap)
        ctx.fillStyle = this.frozen ? '#ADD8E6' : '#D2691E';
        ctx.beginPath();
        ctx.ellipse(0, -8, 18, 12, 0, Math.PI, 0);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-6, -2, 5, 0, Math.PI * 2);
        ctx.arc(6, -2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-6, -2, 2, 0, Math.PI * 2);
        ctx.arc(6, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-3, -4);
        ctx.moveTo(10, -6);
        ctx.lineTo(3, -4);
        ctx.stroke();

        // Feet
        ctx.fillStyle = this.frozen ? '#4682B4' : '#000000';
        const footOffset = this.frozen ? 0 : (this.animationFrame === 0 ? -2 : 2);
        ctx.fillRect(-12 + footOffset, 15, 8, 5);
        ctx.fillRect(4 - footOffset, 15, 8, 5);

        // Ice crystal overlay when frozen
        if (this.frozen) {
            ctx.filter = 'none';
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Ice sparkles
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-8, -10, 2, 0, Math.PI * 2);
            ctx.arc(10, -5, 2, 0, Math.PI * 2);
            ctx.arc(-5, 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Koopa (Turtle) - shrinks to shell when stomped
export class Koopa extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'koopa';
        this.height = 40;
        this.isShell = false;
        this.shellSpeed = 8;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'koopa';
        this.height = 40;
        this.isShell = false;
        this.speed = speed; // Restore original speed
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Frozen effect
        if (this.frozen) {
            ctx.globalAlpha = 0.9;
            ctx.filter = 'hue-rotate(180deg) saturate(150%)';
        }

        if (this.isShell) {
            // Shell - change color if frozen
            ctx.fillStyle = this.frozen ? '#87CEEB' : '#228B22';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell pattern
            ctx.strokeStyle = this.frozen ? '#4682B4' : '#006400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
        } else {
            // Body (green shell) - change color if frozen
            ctx.fillStyle = this.frozen ? '#87CEEB' : '#228B22';
            ctx.beginPath();
            ctx.ellipse(0, 5, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell pattern
            ctx.strokeStyle = this.frozen ? '#4682B4' : '#006400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 5, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Head (yellow) - change color if frozen
            ctx.fillStyle = this.frozen ? '#ADD8E6' : '#FFEB3B';
            ctx.beginPath();
            ctx.arc(10, -5, 10, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(13, -6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(14, -6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Feet - freeze animation
            ctx.fillStyle = this.frozen ? '#4682B4' : '#FFEB3B';
            const footOffset = this.frozen ? 0 : (this.animationFrame === 0 ? -2 : 2);
            ctx.fillRect(-10 + footOffset, 15, 8, 6);
            ctx.fillRect(2 - footOffset, 15, 8, 6);
        }

        // Ice overlay when frozen
        if (this.frozen) {
            ctx.filter = 'none';
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();

            // Ice sparkles
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-10, -12, 2, 0, Math.PI * 2);
            ctx.arc(12, -3, 2, 0, Math.PI * 2);
            ctx.arc(-6, 10, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Flying Enemy - bounces up and down
export class FlyingEnemy extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'flying';
        this.baseY = y;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
        this.floatAmplitude = 40;
    }

    update(canvasWidth) {
        super.update(canvasWidth);

        // Skip floating motion if frozen
        if (this.frozen) return;

        // Floating motion
        this.floatOffset += this.floatSpeed;
        this.y = this.baseY + Math.sin(this.floatOffset) * this.floatAmplitude;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Frozen effect
        if (this.frozen) {
            ctx.globalAlpha = 0.9;
        }

        // Body - change color if frozen
        ctx.fillStyle = this.frozen ? '#87CEEB' : '#8B0000';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (big and angry)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-5, -3, 6, 0, Math.PI * 2);
        ctx.arc(5, -3, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-4, -3, 3, 0, Math.PI * 2);
        ctx.arc(6, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Wings - stop flapping if frozen
        const wingFlap = this.frozen ? 0 : Math.sin(this.floatOffset * 10) * 10;
        ctx.fillStyle = this.frozen ? '#ADD8E6' : '#FFD700';

        // Left wing
        ctx.beginPath();
        ctx.ellipse(-18, -5 + wingFlap, 12, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.ellipse(18, -5 - wingFlap, 12, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Ice overlay when frozen
        if (this.frozen) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Cactus (Desert) - Spiky, cannot be stomped
export class Cactus extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'cactus';
        this.spiky = true; // Custom property for collision handling
        this.height = 40;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'cactus';
        this.spiky = true;
        this.height = 40;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);

        // Frozen effect
        if (this.frozen) {
            ctx.globalAlpha = 0.9;
            ctx.filter = 'hue-rotate(180deg) saturate(150%)';
        }

        // Main body (Green or ice blue if frozen)
        ctx.fillStyle = this.frozen ? '#87CEEB' : '#2E7D32';
        ctx.beginPath();
        ctx.roundRect(-10, -20, 20, 40, 5);
        ctx.fill();

        // Arms
        ctx.beginPath();
        ctx.roundRect(-18, -10, 8, 8, 2); // Left arm
        ctx.roundRect(10, -15, 8, 8, 2);  // Right arm
        ctx.fill();

        // Spikes (turn to ice crystals if frozen)
        ctx.fillStyle = this.frozen ? '#00BFFF' : '#FFF';
        const spikes = [[-10, -15], [10, -5], [0, -20], [-10, 5], [10, 10]];
        spikes.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.arc(sx, sy, this.frozen ? 2 : 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Eyes (Angry)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5, -5, 2, 0, Math.PI * 2);
        ctx.arc(5, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Ice overlay when frozen
        if (this.frozen) {
            ctx.filter = 'none';
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();

            // Ice sparkles
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-12, -18, 2, 0, Math.PI * 2);
            ctx.arc(12, -8, 2, 0, Math.PI * 2);
            ctx.arc(-8, 12, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Yeti (Snow) - Jumps randomly
export class Yeti extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'yeti';
        this.height = 35;
        this.jumpTimer = 0;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'yeti';
        this.height = 35;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
        this.jumpTimer = Math.random() * 100;
    }

    update(canvasWidth) {
        super.update(canvasWidth);

        // Skip jump logic if frozen
        if (this.frozen) return;

        // Jump logic
        if (!this.isJumping) {
            this.jumpTimer++;
            if (this.jumpTimer > 150) { // Jump every ~2.5 seconds
                this.velY = -8;
                this.isJumping = true;
                this.jumpTimer = 0;
            }
        } else {
            this.velY += 0.4; // Gravity
            this.y += this.velY;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velY = 0;
                this.isJumping = false;
                this.jumpTimer = Math.random() * 50; // Random delay
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Body (White/Blue fur)
        ctx.fillStyle = '#E0F7FA';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.arc(0, -2, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (Teeth)
        ctx.fillStyle = 'white';
        ctx.fillRect(-6, 4, 4, 3);
        ctx.fillRect(2, 4, 4, 3);

        ctx.restore();
    }
}

// Ghost (Spooky) - Floats and follows player slowly
export class Ghost extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'ghost';
        this.floatOffset = 0;
        this.baseY = y;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'ghost';
        this.baseY = y;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(canvasWidth, player) {
        // Handle frozen state
        if (this.frozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
            return; // Don't move while frozen
        }

        // Ghost ignores normal movement and follows player if close
        this.floatOffset += 0.05;
        this.y = this.baseY + Math.sin(this.floatOffset) * 10;

        if (player) {
            const dx = player.x - this.x;
            const dist = Math.abs(dx);

            // Only chase if within range
            if (dist < 400) {
                this.x += Math.sign(dx) * 0.5; // Very slow chase
                this.direction = Math.sign(dx);
            } else {
                // Idle wander
                this.x += this.direction * 0.2;
            }
        } else {
            this.x += this.direction * 0.5;
        }

        // Bounds check
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.direction *= -1;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        if (this.direction !== 0) ctx.scale(this.direction, 1);

        // Frozen effect
        if (this.frozen) {
            ctx.globalAlpha = 0.9;
        }

        // Ghost Body - change color if frozen
        ctx.fillStyle = this.frozen ? 'rgba(135, 206, 235, 0.9)' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -5, 15, Math.PI, 0); // Head
        ctx.lineTo(15, 15);
        ctx.lineTo(10, 10);
        ctx.lineTo(5, 15);
        ctx.lineTo(0, 10);
        ctx.lineTo(-5, 15);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Tongue (Boo!) - hide when frozen
        if (!this.frozen) {
            ctx.fillStyle = '#FF5252';
            ctx.beginPath();
            ctx.arc(0, 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ice overlay when frozen
        if (this.frozen) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            // Ice sparkles
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-8, -8, 2, 0, Math.PI * 2);
            ctx.arc(8, -3, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Hammer Bro - Throws hammers in an arc
export class HammerBro extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'hammerbro';
        this.height = 45;
        this.width = 35;
        this.throwTimer = 0;
        this.throwCooldown = 90; // Throw every 1.5 seconds
        this.jumpTimer = 0;
        this.jumpCooldown = 180;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
        this.hammers = [];
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'hammerbro';
        this.height = 45;
        this.groundY = y;
        this.velY = 0;
        this.isJumping = false;
        this.throwTimer = Math.random() * 60;
        this.jumpTimer = Math.random() * 60;
        this.hammers = [];
    }

    update(canvasWidth, player) {
        if (!this.alive) return;

        // Handle frozen state
        if (this.frozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
            // Still update hammers even when frozen
            for (let i = this.hammers.length - 1; i >= 0; i--) {
                const h = this.hammers[i];
                h.update();
                if (h.y > this.groundY + 100 || h.x < -50 || h.x > canvasWidth + 50) {
                    this.hammers.splice(i, 1);
                }
            }
            return;
        }

        // Face player
        if (player) {
            this.direction = player.x < this.x ? -1 : 1;
        }

        // Movement (small patrol)
        this.x += this.speed * this.direction * 0.3;
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.direction *= -1;
        }

        // Jump logic
        if (!this.isJumping) {
            this.jumpTimer++;
            if (this.jumpTimer > this.jumpCooldown) {
                this.velY = -10;
                this.isJumping = true;
                this.jumpTimer = 0;
            }
        } else {
            this.velY += 0.5;
            this.y += this.velY;
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velY = 0;
                this.isJumping = false;
                this.jumpTimer = Math.random() * 60;
            }
        }

        // Throw hammer
        this.throwTimer++;
        if (this.throwTimer > this.throwCooldown && player) {
            this.throwHammer(player);
            this.throwTimer = 0;
        }

        // Update hammers
        for (let i = this.hammers.length - 1; i >= 0; i--) {
            const h = this.hammers[i];
            h.update();
            if (h.y > this.groundY + 100 || h.x < -50 || h.x > canvasWidth + 50) {
                this.hammers.splice(i, 1);
            }
        }

        this.animationTick++;
        if (this.animationTick >= 10) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTick = 0;
        }
    }

    throwHammer(player) {
        const hammer = new Hammer(
            this.x + (this.direction > 0 ? this.width : 0),
            this.y - 10,
            this.direction * 4,
            -8
        );
        this.hammers.push(hammer);
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Body (Green shell)
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(0, 5, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell pattern
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 5, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Head (Yellow with helmet)
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(8, -12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(8, -18, 14, 8, 0, Math.PI, 0);
        ctx.fill();

        // White stripe on helmet
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, -18, 10, Math.PI + 0.3, -0.3, false);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(12, -12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(13, -12, 2, 0, Math.PI * 2);
        ctx.fill();

        // Arm holding hammer
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.ellipse(15, -5, 6, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = '#FFEB3B';
        const footOffset = this.animationFrame === 0 ? -2 : 2;
        ctx.fillRect(-10 + footOffset, 18, 8, 6);
        ctx.fillRect(2 - footOffset, 18, 8, 6);

        ctx.restore();

        // Draw hammers
        this.hammers.forEach(h => h.draw(ctx, camera));
    }

    getHammerHitboxes() {
        return this.hammers.filter(h => h.active).map(h => ({
            x: h.x,
            y: h.y,
            width: h.width,
            height: h.height
        }));
    }
}

// Hammer projectile thrown by HammerBro
export class Hammer {
    constructor(x, y, velX, velY) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.width = 20;
        this.height = 20;
        this.rotation = 0;
        this.active = true;
    }

    update() {
        this.x += this.velX;
        this.velY += 0.3; // Gravity
        this.y += this.velY;
        this.rotation += 0.3;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x;
        const drawY = this.y;

        ctx.translate(drawX, drawY);
        ctx.rotate(this.rotation);

        // Hammer head
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-12, -6, 24, 12);

        // Hammer handle
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(-3, -6, 6, 20);

        ctx.restore();
    }
}

// Lakitu - Cloud enemy that throws Spinies
export class Lakitu extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, speed, direction, null);
        this.type = 'lakitu';
        this.width = 40;
        this.height = 50;
        this.baseY = y;
        this.floatOffset = 0;
        this.throwTimer = 0;
        this.throwCooldown = 120; // Throw every 2 seconds
        this.spinies = [];
        this.patrolRange = 200;
        this.startX = x;
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'lakitu';
        this.baseY = y;
        this.startX = x;
        this.floatOffset = 0;
        this.throwTimer = Math.random() * 60;
        this.spinies = [];
    }

    update(canvasWidth, player, groundY) {
        if (!this.alive) return;

        // Handle frozen state
        if (this.frozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.frozen = false;
            }
            // Still update spinies even when frozen
            for (let i = this.spinies.length - 1; i >= 0; i--) {
                const spiny = this.spinies[i];
                spiny.update(canvasWidth);
                if (spiny.y > groundY + 50 || !spiny.alive) {
                    this.spinies.splice(i, 1);
                }
            }
            return;
        }

        // Floating motion
        this.floatOffset += 0.03;
        this.y = this.baseY + Math.sin(this.floatOffset) * 15;

        // Follow player horizontally if nearby
        if (player) {
            const dx = player.x - this.x;
            if (Math.abs(dx) < 400) {
                this.x += Math.sign(dx) * this.speed * 0.5;
                this.direction = Math.sign(dx);
            } else {
                // Patrol
                this.x += this.direction * this.speed;
                if (Math.abs(this.x - this.startX) > this.patrolRange) {
                    this.direction *= -1;
                }
            }
        }

        // Throw spiny
        this.throwTimer++;
        if (this.throwTimer > this.throwCooldown && player) {
            this.throwSpiny(groundY || this.baseY + 200);
            this.throwTimer = 0;
        }

        // Update spinies
        for (let i = this.spinies.length - 1; i >= 0; i--) {
            const spiny = this.spinies[i];
            spiny.update(canvasWidth);
            if (spiny.y > groundY + 50 || !spiny.alive) {
                this.spinies.splice(i, 1);
            }
        }
    }

    throwSpiny(groundY) {
        const spiny = new Spiny(
            this.x + this.width / 2,
            this.y + this.height,
            groundY
        );
        this.spinies.push(spiny);
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Cloud
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-8, 12, 18, 0, Math.PI * 2);
        ctx.arc(8, 12, 18, 0, Math.PI * 2);
        ctx.arc(0, 8, 20, 0, Math.PI * 2);
        ctx.fill();

        // Cloud outline
        ctx.strokeStyle = '#DDD';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lakitu body (yellow)
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(0, -8, 14, 0, Math.PI * 2);
        ctx.fill();

        // Goggles
        ctx.fillStyle = '#1E88E5';
        ctx.fillRect(-12, -12, 10, 6);
        ctx.fillRect(2, -12, 10, 6);

        // Goggle shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(-10, -11, 3, 2);
        ctx.fillRect(4, -11, 3, 2);

        // Shell on back
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw spinies
        this.spinies.forEach(s => s.draw(ctx, camera));
    }

    getSpinyHitboxes() {
        return this.spinies.filter(s => s.alive && s.grounded).map(s => ({
            x: s.x, y: s.y, width: s.width, height: s.height, spiky: true
        }));
    }
}

// Spiny - Thrown by Lakitu, spiky enemy
export class Spiny extends Enemy {
    constructor(x, y, groundY) {
        super(x, y, 0.8, Math.random() < 0.5 ? -1 : 1, null);
        this.type = 'spiny';
        this.width = 24;
        this.height = 24;
        this.spiky = true;
        this.velY = 0;
        this.groundY = groundY;
        this.grounded = false;
    }

    update(canvasWidth) {
        if (!this.alive) return;

        // Fall until grounded
        if (!this.grounded) {
            this.velY += 0.4;
            this.y += this.velY;

            if (this.y + this.height >= this.groundY) {
                this.y = this.groundY - this.height;
                this.grounded = true;
                this.velY = 0;
            }
        } else {
            // Walk on ground
            this.x += this.speed * this.direction;
            if (this.x < 0 || this.x + this.width > canvasWidth) {
                this.direction *= -1;
            }
        }

        this.animationTick++;
        if (this.animationTick >= 8) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTick = 0;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height / 2;

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction, 1);

        // Body (Red shell)
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.ellipse(0, 2, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.fillStyle = '#FFD700';
        const spikePositions = [
            [-8, -4], [-4, -8], [0, -10], [4, -8], [8, -4]
        ];
        spikePositions.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - 3, sy + 6);
            ctx.lineTo(sx + 3, sy + 6);
            ctx.closePath();
            ctx.fill();
        });

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-4, 0, 4, 0, Math.PI * 2);
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-3, 0, 2, 0, Math.PI * 2);
        ctx.arc(5, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = '#FFC107';
        const footOffset = this.animationFrame === 0 ? -2 : 2;
        ctx.fillRect(-8 + footOffset, 8, 6, 4);
        ctx.fillRect(2 - footOffset, 8, 6, 4);

        ctx.restore();
    }
}

// Thwomp - Stone block that falls when player is underneath
export class Thwomp extends Enemy {
    constructor(x, y, speed, direction) {
        super(x, y, 0, 0, null);
        this.type = 'thwomp';
        this.width = 48;
        this.height = 64;
        this.spiky = true;
        this.baseY = y;
        this.groundY = y + 200; // How far it falls
        this.state = 'waiting'; // waiting, falling, rising
        this.velY = 0;
        this.waitTimer = 0;
        this.triggerDistance = 80; // Horizontal distance to trigger
    }

    reset(x, y, speed, direction) {
        super.reset(x, y, speed, direction);
        this.type = 'thwomp';
        this.baseY = y;
        this.state = 'waiting';
        this.velY = 0;
        this.waitTimer = 0;
    }

    update(canvasWidth, player) {
        if (!this.alive) return;

        if (this.state === 'waiting') {
            // Check if player is underneath
            if (player) {
                const dx = Math.abs(player.x + player.width / 2 - (this.x + this.width / 2));
                const isBelow = player.y > this.y;

                if (dx < this.triggerDistance && isBelow) {
                    this.state = 'falling';
                }
            }
        } else if (this.state === 'falling') {
            // Fall fast
            this.velY += 1.5;
            this.y += this.velY;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velY = 0;
                this.state = 'waiting_to_rise';
                this.waitTimer = 0;
            }
        } else if (this.state === 'waiting_to_rise') {
            this.waitTimer++;
            if (this.waitTimer > 60) {
                this.state = 'rising';
            }
        } else if (this.state === 'rising') {
            // Rise slowly
            this.y -= 2;
            if (this.y <= this.baseY) {
                this.y = this.baseY;
                this.state = 'waiting';
            }
        }

        this.animationTick++;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x;
        const drawY = this.y;

        // Stone body
        ctx.fillStyle = '#607D8B';
        ctx.fillRect(drawX, drawY, this.width, this.height);

        // Stone texture
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX + 4, drawY + 4, this.width - 8, this.height - 8);

        // Cracks
        ctx.beginPath();
        ctx.moveTo(drawX + 10, drawY + 15);
        ctx.lineTo(drawX + 20, drawY + 25);
        ctx.moveTo(drawX + 30, drawY + 40);
        ctx.lineTo(drawX + 38, drawY + 50);
        ctx.stroke();

        // Angry face
        const faceY = drawY + this.height / 2;

        // Eyes
        ctx.fillStyle = '#212121';
        ctx.fillRect(drawX + 8, faceY - 15, 12, 8);
        ctx.fillRect(drawX + 28, faceY - 15, 12, 8);

        // Eyebrows (angry)
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(drawX + 6, faceY - 20);
        ctx.lineTo(drawX + 22, faceY - 15);
        ctx.moveTo(drawX + 42, faceY - 20);
        ctx.lineTo(drawX + 26, faceY - 15);
        ctx.stroke();

        // Mouth (jagged)
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(drawX + 10, faceY + 10);
        ctx.lineTo(drawX + 15, faceY + 5);
        ctx.lineTo(drawX + 20, faceY + 12);
        ctx.lineTo(drawX + 25, faceY + 5);
        ctx.lineTo(drawX + 30, faceY + 12);
        ctx.lineTo(drawX + 35, faceY + 5);
        ctx.lineTo(drawX + 40, faceY + 10);
        ctx.lineTo(drawX + 40, faceY + 15);
        ctx.lineTo(drawX + 10, faceY + 15);
        ctx.closePath();
        ctx.fill();

        // Spikes on sides
        ctx.fillStyle = '#37474F';
        const spikeSize = 8;
        for (let i = 0; i < 4; i++) {
            const sy = drawY + 10 + i * 15;
            // Left spikes
            ctx.beginPath();
            ctx.moveTo(drawX, sy);
            ctx.lineTo(drawX - spikeSize, sy + spikeSize / 2);
            ctx.lineTo(drawX, sy + spikeSize);
            ctx.fill();
            // Right spikes
            ctx.beginPath();
            ctx.moveTo(drawX + this.width, sy);
            ctx.lineTo(drawX + this.width + spikeSize, sy + spikeSize / 2);
            ctx.lineTo(drawX + this.width, sy + spikeSize);
            ctx.fill();
        }

        ctx.restore();
    }
}

export function createEnemies(startX, endX, canvasHeight, spriteSheet, difficultyMultiplier = 1, biome = 'PLAINS') {

    const enemiesData = [];
    const groundY = canvasHeight - 50;
    const width = endX - startX;

    // Density increases with difficulty
    const densityDivisor = Math.max(200, 400 / difficultyMultiplier);
    const count = Math.floor(width / densityDivisor);

    for (let i = 0; i < count; i++) {
        const x = startX + Math.random() * width;
        const baseSpeed = 0.5 + Math.random() * 1.0;
        const speed = baseSpeed * difficultyMultiplier;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const rand = Math.random();

        // Rare chance for HammerBro in any biome (increases with difficulty)
        const hammerBroChance = 0.05 * difficultyMultiplier;
        if (rand < hammerBroChance) {
            enemiesData.push({ type: 'hammerbro', x, y: groundY - 45, speed: speed * 0.5, direction });
            continue;
        }

        // Biome-specific enemy generation
        if (biome === 'DESERT') {
            if (rand < 0.5) {
                enemiesData.push({ type: 'cactus', x, y: groundY - 40, speed: speed * 0.5, direction });
            } else {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            }
        } else if (biome === 'SNOW') {
            if (rand < 0.5) {
                enemiesData.push({ type: 'yeti', x, y: groundY - 35, speed, direction });
            } else {
                enemiesData.push({ type: 'koopa', x, y: groundY - 40, speed, direction });
            }
        } else if (biome === 'SPOOKY') {
            if (rand < 0.6) {
                enemiesData.push({ type: 'ghost', x, y: groundY - 100 - Math.random() * 50, speed, direction });
            } else {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            }
        } else {
            // PLAINS (Default)
            if (rand < 0.4) {
                enemiesData.push({ type: 'goomba', x, y: groundY - 30, speed, direction, spriteSheet });
            } else if (rand < 0.6) {
                enemiesData.push({ type: 'koopa', x, y: groundY - 40, speed, direction });
            } else {
                enemiesData.push({ type: 'flying', x, y: groundY - 100 - Math.random() * 80, speed, direction });
            }
        }
    }
    return enemiesData;
}
