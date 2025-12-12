import { checkCollision } from './utils.js';

export class Player {
    constructor(x, y, spriteSheet) {
        this.x = x;
        this.y = y;
        this.baseWidth = 30;
        this.baseHeight = 50;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.spriteSheet = spriteSheet;

        // Movement physics
        this.velX = 0;
        this.velY = 0;
        this.maxSpeed = 5;
        this.acceleration = 0.5;
        this.friction = 0.85;

        // Jump physics
        this.GRAVITY = 0.6;
        this.JUMP_FORCE = -16; // Increased from -14
        this.jumpHeld = false;
        this.jumpHoldTime = 0;
        this.maxJumpHoldTime = 15; // Increased from 12
        this.jumpCutMultiplier = 0.5;

        // Coyote time
        this.coyoteTime = 0;
        this.coyoteMaxTime = 6;
        this.wasGrounded = false;

        // State
        this.grounded = false;
        this.jumping = false;
        this.isMoving = false;
        this.direction = 1;
        this.animationFrame = 0;
        this.animationTick = 0;
        this.isJumping = false;
        this.isDead = false; // New death state

        this.GROUND_Y = 0;

        // Power-up state
        this.isPowered = false;
        this.powerScale = 1.0;

        // Star Power
        this.starPower = false;
        this.starTimer = 0;
        this.starDuration = 600; // 10 seconds

        // Fire Power
        this.firePower = false;

        // Invincibility frames (when hit)
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 90; // frames
        this.flashTimer = 0;

        // Dust particles for landing and running
        this.dustParticles = [];
        this.justLanded = false;
        this.runDustTimer = 0;

        // Sprite configuration
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.5;

        // Squash and stretch
        this.scaleX = 1.0;
        this.scaleY = 1.0;
    }

    setGroundY(y) {
        this.GROUND_Y = y;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.velY = -12; // Small hop
        this.velX = 0;
        // Optional: Change sprite to dead sprite if available
    }

    update(input, platforms, canvasWidth, camera) {
        // Death Animation Logic
        if (this.isDead) {
            this.velY += this.GRAVITY;
            this.y += this.velY;
            return; // Skip all other updates (collision, input, etc.)
        }

        // Update Star Power
        if (this.starPower) {
            this.starTimer--;
            if (this.starTimer <= 0) {
                this.starPower = false;
            }
        }

        // Store previous grounded state
        this.wasGrounded = this.grounded;
        this.justLanded = false;

        // Restore scale
        this.scaleX += (1.0 - this.scaleX) * 0.2;
        this.scaleY += (1.0 - this.scaleY) * 0.2;

        // === HORIZONTAL MOVEMENT ===
        let moveInput = 0;

        // Touch direction (from clicking/touching left or right side of screen)
        // This is for mobile: tap left side = move left + jump
        if (input.touchDirection !== 0) {
            moveInput = input.touchDirection;
            this.direction = moveInput;
        }
        // Desktop mouse follow: mouse position controls player movement
        // Note: mouseX is in screen coordinates, player.x is in world coordinates
        // We need to convert player position to screen position using camera offset
        else if (input.mouseX !== null && camera) {
            // Convert player's world position to screen position
            const playerScreenX = this.x - camera.x + this.width / 2;
            const mouseDiff = input.mouseX - playerScreenX;

            if (Math.abs(mouseDiff) > 30) {
                moveInput = Math.sign(mouseDiff);
                this.direction = moveInput;
            }
        }

        // Keyboard control overrides all
        if (input.keys['ArrowLeft']) {
            moveInput = -1;
            this.direction = -1;
        } else if (input.keys['ArrowRight']) {
            moveInput = 1;
            this.direction = 1;
        }

        if (moveInput !== 0) {
            // Accelerate
            this.velX += moveInput * this.acceleration;
            // Cap speed
            if (Math.abs(this.velX) > this.maxSpeed) {
                this.velX = Math.sign(this.velX) * this.maxSpeed;
            }
            this.isMoving = true;
        } else {
            // Apply friction
            this.velX *= this.friction;
            if (Math.abs(this.velX) < 0.1) {
                this.velX = 0;
                this.isMoving = false;
            }
        }

        this.x += this.velX;

        // === ANIMATION ===
        if (this.isMoving) {
            this.animationTick++;
            if (this.animationTick >= 5) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationTick = 0;
            }

            // Spawn running dust
            if (this.grounded) {
                this.runDustTimer++;
                if (this.runDustTimer > 10) {
                    this.spawnDust('run');
                    this.runDustTimer = 0;
                }
            }
        } else {
            this.animationFrame = 0;
            this.animationTick = 0;
        }

        // === VARIABLE JUMP HEIGHT ===
        if (this.jumpHeld && this.velY < 0) {
            this.jumpHoldTime++;
            if (this.jumpHoldTime > this.maxJumpHoldTime) {
                this.jumpHeld = false;
            }
        }

        // Cut jump short if button released early (only after minimum hold time)
        // This ensures clicks/taps still give a decent jump
        const minJumpHoldTime = 6; // Minimum frames before jump can be cut
        if (!input.keys['Space'] && this.jumpHeld && this.velY < 0 && this.jumpHoldTime > minJumpHoldTime) {
            this.velY *= this.jumpCutMultiplier;
            this.jumpHeld = false;
        }

        // === GRAVITY ===
        this.velY += this.GRAVITY;
        this.y += this.velY;

        // === COYOTE TIME ===
        if (this.grounded) {
            this.coyoteTime = this.coyoteMaxTime;
        } else if (this.coyoteTime > 0) {
            this.coyoteTime--;
        }

        // Reset grounded state before collision checks
        this.grounded = false;

        // === GROUND COLLISION ===
        if (this.y + this.height > this.GROUND_Y) {
            if (!this.wasGrounded && this.velY > 2) {
                this.justLanded = true;
                this.spawnDust('land');
                // Squash effect on landing
                this.scaleY = 0.8;
                this.scaleX = 1.2;
            }
            this.y = this.GROUND_Y - this.height;
            this.velY = 0;
            this.grounded = true;
            this.jumping = false;
        }

        // === PLATFORM COLLISION ===
        platforms.forEach(platform => {
            if (checkCollision(this, platform) && this.velY > 0) {
                if (this.y + this.height - this.velY <= platform.y) {
                    if (!this.wasGrounded && this.velY > 2) {
                        this.justLanded = true;
                        this.spawnDust('land');
                    }
                    this.y = platform.y - this.height;
                    this.velY = 0;
                    this.grounded = true;
                    this.jumping = false;
                }
            }
        });

        // === BOUNDS ===
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

        // Update jump animation state
        this.isJumping = this.velY < 0 || !this.grounded;

        // Update dust particles
        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            const p = this.dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.life--;
            p.size *= 0.9; // Shrink
            if (p.life <= 0) {
                this.dustParticles.splice(i, 1);
            }
        }
    }

    spawnDust(type) {
        const count = type === 'land' ? 8 : 2;
        const speed = type === 'land' ? 3 : 1;

        for (let i = 0; i < count; i++) {
            this.dustParticles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * speed + (type === 'run' ? -this.direction * 2 : 0),
                vy: -Math.random() * speed,
                life: 20 + Math.random() * 10,
                size: 4 + Math.random() * 4,
                color: type === 'land' ? '#C4A484' : '#E0E0E0' // Brown for land, whitish for run
            });
        }
    }

    getStarPower() {
        this.starPower = true;
        this.starTimer = this.starDuration;
        this.invincible = true; // Also invincible to damage
        this.invincibleTime = this.starDuration;
    }

    getFirePower() {
        this.firePower = true;
        this.powerUp(); // Also grow if not already
    }

    powerUp() {
        if (this.isPowered) return false; // Already powered

        this.isPowered = true;
        this.powerScale = 1.4;

        // Grow Mario
        const oldHeight = this.height;
        this.width = this.baseWidth * this.powerScale;
        this.height = this.baseHeight * this.powerScale;

        // Adjust Y so Mario grows upward
        this.y -= (this.height - oldHeight);

        return true;
    }

    shrink() {
        if (this.firePower) {
            this.firePower = false;
            // Stay big (powered) but lose fire? Or shrink completely?
            // Classic Mario: Fire -> Big. But here let's simplify: Fire -> Small.
            // Actually, let's do Fire -> Big (Powered).
            return true;
        }

        if (!this.isPowered) return false; // Already small

        this.isPowered = false;
        this.powerScale = 1.0;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // Start invincibility
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;

        return true;
    }

    hit() {
        // Called when hit by enemy
        if (this.starPower) return 'kill'; // Kill enemy if star power
        if (this.invincible) return 'invincible';

        if (this.firePower) {
            this.firePower = false;
            this.invincible = true;
            this.invincibleTime = this.invincibleDuration;
            return 'shrink'; // Lose fire power but stay big? Or shrink? 
            // Let's make it: Fire -> Small for simplicity and higher stakes, or Fire -> Big.
            // Let's stick to: Fire -> Small (shrink) to match current shrink logic which resets everything.
        }

        if (this.isPowered) {
            this.shrink();
            return 'shrink';
        }

        return 'dead';
    }

    updateInvincibility() {
        if (this.invincible) {
            this.invincibleTime--;
            this.flashTimer++;

            if (this.invincibleTime <= 0) {
                this.invincible = false;
                this.flashTimer = 0;
            }
        }
    }

    jump() {
        // Can jump if grounded OR within coyote time window
        if (this.grounded || this.coyoteTime > 0) {
            this.velY = this.JUMP_FORCE;
            this.jumping = true;
            this.jumpHeld = true;
            this.jumpHoldTime = 0;
            this.grounded = false;
            this.coyoteTime = 0; // Consume coyote time

            // Stretch on jump
            this.scaleX = 0.8;
            this.scaleY = 1.2;

            return true;
        }
        return false;
    }

    draw(ctx, camera) {
        ctx.save();
        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height; // Pivot at bottom

        ctx.translate(drawX, drawY);
        ctx.scale(this.direction * this.scaleX, this.scaleY);
        ctx.translate(0, -this.height / 2); // Move back to center for drawing

        // Define colors based on state
        let pantsColor = '#1E90FF'; // Blue
        let shirtColor = '#FF2020'; // Red
        let hatColor = '#FF0000';   // Red
        let overallColor = '#1E90FF'; // Blue

        if (this.firePower) {
            pantsColor = '#FFFFFF'; // White
            shirtColor = '#FFFFFF'; // White
            hatColor = '#FFFFFF';   // White
            overallColor = '#FF2020'; // Red overalls
        }

        if (this.starPower) {
            // Rainbow effect
            const hue = (Date.now() / 2) % 360;
            const color = `hsl(${hue}, 100%, 50%)`;
            pantsColor = color;
            shirtColor = color;
            hatColor = color;
            overallColor = color;
        }

        // ========== IMPROVED MARIO CHARACTER ==========

        // Animation offsets
        const runOffset = this.isMoving && !this.isJumping ? Math.sin(this.animationFrame * 0.8) * 3 : 0;
        const jumpArmOffset = this.isJumping ? -8 : 0;

        // === LEGS ===
        ctx.fillStyle = pantsColor;
        if (this.isJumping) {
            // Jump pose - legs spread
            ctx.fillRect(-12, 8, 8, 14);
            ctx.fillRect(4, 8, 8, 14);
        } else if (this.isMoving) {
            // Running animation
            const legOffset = this.animationFrame % 2 === 0 ? 4 : -4;
            ctx.fillRect(-10 + legOffset, 8, 7, 14);
            ctx.fillRect(3 - legOffset, 8, 7, 14);
        } else {
            // Idle stance
            ctx.fillRect(-9, 8, 7, 14);
            ctx.fillRect(2, 8, 7, 14);
        }

        // === SHOES ===
        ctx.fillStyle = '#8B0000'; // Dark red shoes
        if (this.isJumping) {
            ctx.beginPath();
            ctx.ellipse(-8, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(8, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isMoving) {
            const shoeOffset = this.animationFrame % 2 === 0 ? 4 : -4;
            ctx.beginPath();
            ctx.ellipse(-6 + shoeOffset, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(7 - shoeOffset, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(-5, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(5, 22, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === BODY (OVERALLS) ===
        ctx.fillStyle = overallColor;
        ctx.beginPath();
        ctx.roundRect(-11, -2, 22, 12, 3);
        ctx.fill();

        // Overall straps
        ctx.fillStyle = overallColor;
        ctx.fillRect(-9, -8, 4, 8);
        ctx.fillRect(5, -8, 4, 8);

        // Overall buttons (gold)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-7, -2, 2, 0, Math.PI * 2);
        ctx.arc(7, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        // === SHIRT ===
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.roundRect(-10, -12, 20, 10, 2);
        ctx.fill();

        // === ARMS ===
        ctx.fillStyle = shirtColor;
        if (this.isJumping) {
            // Arms up when jumping
            ctx.save();
            ctx.translate(-11, -8);
            ctx.rotate(-0.5);
            ctx.fillRect(-3, -12, 6, 12);
            ctx.restore();
            ctx.save();
            ctx.translate(11, -8);
            ctx.rotate(0.5);
            ctx.fillRect(-3, -12, 6, 12);
            ctx.restore();
        } else {
            // Normal arms with running animation
            ctx.fillRect(-15, -10 + runOffset, 6, 10);
            ctx.fillRect(9, -10 - runOffset, 6, 10);
        }

        // === HANDS (GLOVES) ===
        ctx.fillStyle = '#FFFFFF'; // White gloves
        if (this.isJumping) {
            ctx.beginPath();
            ctx.arc(-14, -20, 5, 0, Math.PI * 2);
            ctx.arc(14, -20, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(-12, 2 + runOffset, 5, 0, Math.PI * 2);
            ctx.arc(12, 2 - runOffset, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // === HEAD ===
        ctx.fillStyle = '#FFDAB9'; // Warm skin tone (peach)
        ctx.beginPath();
        ctx.arc(0, -22, 14, 0, Math.PI * 2);
        ctx.fill();

        // === HAT ===
        // Hat brim
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.ellipse(4, -28, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hat dome
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.ellipse(0, -34, 12, 8, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-12, -34, 24, 6);

        // Hat "M" logo
        ctx.fillStyle = this.firePower ? '#FF0000' : '#FFFFFF'; // Red M for fire, White otherwise
        ctx.beginPath();
        ctx.arc(0, -32, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.firePower ? '#FFFFFF' : '#FF0000'; // White text for fire, Red otherwise
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', 0, -29);

        // === FACE ===
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-5, -24, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -24, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000080'; // Dark blue
        ctx.beginPath();
        ctx.arc(-4, -24, 2, 0, Math.PI * 2);
        ctx.arc(6, -24, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-5, -25, 1, 0, Math.PI * 2);
        ctx.arc(5, -25, 1, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#DEB887'; // Darker skin
        ctx.beginPath();
        ctx.ellipse(2, -18, 5, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Mustache
        ctx.fillStyle = '#4A2C0A'; // Dark brown
        ctx.beginPath();
        ctx.ellipse(-4, -14, 6, 3, 0, 0, Math.PI);
        ctx.ellipse(4, -14, 6, 3, 0, 0, Math.PI);
        ctx.fill();

        // Mouth (smile)
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // === EARS ===
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.ellipse(-13, -20, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(13, -20, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw dust particles (outside of main transform)
        this.dustParticles.forEach(p => {
            const screenX = p.x - camera.x;
            const alpha = p.life / 30;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color || '#C4A484';
            ctx.beginPath();
            ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}
