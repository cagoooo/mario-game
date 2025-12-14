import { checkCollision } from './utils.js?v=1.6.22';
import { Idle, Running, Jumping, Falling, Dead } from './PlayerStates.js?v=1.7.8';

export class Player {
    constructor(game, x, y, spriteSheet) {
        this.game = game; // Store reference to game
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
        this.maxSpeed = 3.5; // Reduced from 5
        this.acceleration = 0.3; // Reduced from 0.5
        this.friction = 0.9; // Increased from 0.85 (less slippery)

        // Jump physics
        this.GRAVITY = 0.6;
        this.JUMP_FORCE = -16; // Increased from -14
        this.jumpHeld = false;
        this.jumpHoldTime = 0;
        this.maxJumpHoldTime = 28; // Increased from 24 for even higher max jump
        this.jumpCutMultiplier = 0.5;

        // Coyote time
        this.coyoteTime = 0;
        this.coyoteMaxTime = 6;
        this.wasGrounded = false;

        this.grounded = false;
        this.isDead = false;

        // State Machine
        this.states = [
            new Idle(this),
            new Running(this),
            new Jumping(this),
            new Falling(this),
            new Dead(this)
        ];
        this.currentState = this.states[0];
        this.currentState.enter();

        // Double Jump
        this.jumpCount = 0;
        this.maxJumps = 2;

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

    setState(state) {
        this.currentState = this.states[state];
        this.currentState.enter();
    }

    die() {
        if (this.currentState instanceof Dead) return;
        this.setState(4); // DEAD state
    }

    update(input, platforms, canvasWidth, camera) {
        // Update State
        this.currentState.handleInput(input);

        // Death Animation Logic (Physics only)
        if (this.isDead) {
            this.velY += this.GRAVITY;
            this.y += this.velY;
            return; // Skip all other updates
        }

        // Update Star Power
        if (this.starPower) {
            this.starTimer--;
            if (this.starTimer <= 0) {
                this.starPower = false;
                this.maxSpeed = 3.5; // Reset to normal speed
            }
        }

        // Update Invincibility
        this.updateInvincibility();

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
            // Check for skid (moving opposite to velocity)
            if (this.grounded && Math.abs(this.velX) > 2 && Math.sign(moveInput) !== Math.sign(this.velX)) {
                this.spawnDust('skid');
            }

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
        // Animation logic is now partly handled by state (setting frames), 
        // but ticking is still here or could be moved.
        // For now, let's keep simple ticking if moving/active
        if (this.currentState instanceof Running) {
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
        } else if (this.currentState instanceof Idle) {
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
        const minJumpHoldTime = 12; // Increased from 10 for even better light tap height
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
            this.jumpCount = 0;
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
                    this.jumpCount = 0;
                }
            }
        });

        // === BOUNDS ===
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

        // Update jump animation state
        this.isJumping = !this.grounded; // Simplified for drawing logic

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
        const count = type === 'land' ? 8 : (type === 'skid' ? 4 : 2);
        const speed = type === 'land' ? 3 : 1;

        let color = '#E0E0E0'; // Default whitish
        if (type === 'land') color = '#C4A484'; // Brown
        if (type === 'skid') color = '#A9A9A9'; // Dark gray

        for (let i = 0; i < count; i++) {
            this.dustParticles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * speed + (type === 'run' ? -this.direction * 2 : 0),
                vy: -Math.random() * speed,
                life: 20 + Math.random() * 10,
                size: 4 + Math.random() * 4,
                color: color
            });
        }
    }

    getStarPower() {
        this.starPower = true;
        this.starTimer = this.starDuration;
        this.invincible = true; // Also invincible to damage
        this.invincibleTime = this.starDuration;
        this.maxSpeed = 6; // Speed boost!
    }

    getFirePower() {
        this.firePower = true;
        this.powerUp(); // Also grow if not already
    }

    powerUp() {
        if (this.isPowered) return false; // Already powered

        this.isPowered = true;
        this.isPowered = true;
        this.powerScale = 1.6; // Increased from 1.4 for better visibility

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
            // Fall through to shrink logic (Fire -> Small)
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

        if (this.firePower || this.isPowered) {
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
        // Can jump if grounded OR within coyote time window OR has jumps remaining (double jump)
        if (this.grounded || this.coyoteTime > 0 || this.jumpCount < this.maxJumps) {
            this.velY = this.JUMP_FORCE;
            // this.jumping = true; // Handled by state
            this.jumpHeld = true;
            this.jumpHoldTime = 0;

            if (this.grounded || this.coyoteTime > 0) {
                this.jumpCount = 1; // First jump
            } else {
                this.jumpCount++; // Double jump
                this.spawnDust('run'); // Small effect for double jump
            }

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

        // Flashing effect when invincible
        if (this.invincible) {
            // Flash every 4 frames
            if (Math.floor(this.flashTimer / 4) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }

        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height; // Pivot at bottom

        ctx.translate(drawX, drawY);
        // Apply powerScale to visual drawing as well
        ctx.scale(this.direction * this.scaleX * this.powerScale, this.scaleY * this.powerScale);
        ctx.translate(0, -this.baseHeight / 2); // Move back to center using BASE height since we scaled up

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
        // Blinking Logic
        this.blinkTimer++;
        if (this.blinkTimer > this.nextBlinkTime) {
            this.isBlinking = true;
            if (this.blinkTimer > this.nextBlinkTime + 10) { // Blink for 10 frames
                this.isBlinking = false;
                this.blinkTimer = 0;
                this.nextBlinkTime = Math.random() * 200 + 100;
            }
        }

        // Eyes
        if (this.isDead) {
            // Dead eyes (X shape)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;

            // Left eye
            ctx.beginPath();
            ctx.moveTo(-7, -26);
            ctx.lineTo(-3, -22);
            ctx.moveTo(-3, -26);
            ctx.lineTo(-7, -22);
            ctx.stroke();

            // Right eye
            ctx.beginPath();
            ctx.moveTo(3, -26);
            ctx.lineTo(7, -22);
            ctx.moveTo(7, -26);
            ctx.lineTo(3, -22);
            ctx.stroke();
        } else if (this.isBlinking) {
            // Closed eyes (lines)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, -24);
            ctx.lineTo(-3, -24);
            ctx.moveTo(3, -24);
            ctx.lineTo(7, -24);
            ctx.stroke();
        } else {
            // Open Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(-5, -24, 4, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(5, -24, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils (look direction)
            const lookOffset = this.direction * 1;
            ctx.fillStyle = '#000080'; // Dark blue
            ctx.beginPath();
            ctx.arc(-4 + lookOffset, -24, 2, 0, Math.PI * 2);
            ctx.arc(6 + lookOffset, -24, 2, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-5 + lookOffset, -25, 1, 0, Math.PI * 2);
            ctx.arc(5 + lookOffset, -25, 1, 0, Math.PI * 2);
            ctx.fill();
        }

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

        // Mouth (smile or open if jumping)
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (this.isDead) {
            // Dead mouth with tongue
            ctx.fillStyle = '#FFB6C1'; // Pink tongue
            ctx.beginPath();
            ctx.arc(0, -10, 3, 0, Math.PI, false); // Tongue
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, -12, 4, 0.2, Math.PI - 0.2); // Frown/Open
            ctx.stroke();
        } else if (this.isJumping) {
            ctx.ellipse(0, -11, 3, 2, 0, 0, Math.PI * 2); // Open mouth
            ctx.stroke();
        } else {
            ctx.arc(0, -12, 4, 0.2, Math.PI - 0.2); // Smile
            ctx.stroke();
        }

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
