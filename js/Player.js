import { checkCollision } from './utils.js';
import { Idle, Running, Jumping, Falling, Dead, PipeState } from './PlayerStates.js';
import { createMarioAnimator } from './SpriteAnimator.js';

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
        this.baseMaxSpeed = 3.5; // Normal speed
        this.sprintMaxSpeed = 5.5; // Sprint speed (1.5x)
        this.maxSpeed = this.baseMaxSpeed;
        this.acceleration = 0.3; // Reduced from 0.5
        this.friction = 0.9; // Increased from 0.85 (less slippery)
        this.isSprinting = false;

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
            new Dead(this),
            new PipeState(this)
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

        // Projectile power-ups
        this.firePower = false;
        this.icePower = false;

        // Invincibility frames (when hit)
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 90; // frames
        this.flashTimer = 0;

        // Magnet Power
        this.magnetPower = false;
        this.magnetTimer = 0;

        // Mega Mushroom
        this.isMega = false;
        this.megaTimer = 0;

        // Cape Power
        this.hasCape = false;
        this.isGliding = false;
        this.glideGravity = 0.1; // Reduced gravity while gliding
        this.glideFallSpeed = 1.5; // Max fall speed while gliding

        // Wall Jump
        this.wallSliding = false;
        this.wallDirection = 0; // -1 = left wall, 1 = right wall
        this.wallJumpForce = { x: 6, y: -14 }; // Horizontal and vertical force
        this.wallSlideSpeed = 2; // Slower fall when sliding

        // Crouch
        this.isCrouching = false;
        this.crouchHeight = 30; // Reduced height when crouching
        this.standingHeight = 50; // Normal height

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

        // Pipe Animation
        this.isEnteringPipe = false;
        this.isExitingPipe = false;
        this.pipeTimer = 0;

        // Auto-walk properties
        this.autoMoveTargetX = null;
        this.autoMovePipe = null;

        // Sprite Animator
        this.animator = createMarioAnimator();
        this.animator.play('idle');
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
        // Auto-walk Logic
        if (this.autoMoveTargetX !== null) {
            const diff = this.autoMoveTargetX - this.x;

            // If close enough, snap and enter
            if (Math.abs(diff) < 4) {
                this.x = this.autoMoveTargetX;
                this.velX = 0;
                this.autoMoveTargetX = null;

                if (this.autoMovePipe) {
                    // Snap to top of pipe to ensure entry animation plays correctly
                    // This handles cases where player walked from ground to the pipe base
                    this.y = this.autoMovePipe.y - this.height;

                    // Ensure game reference exists and method is callable
                    if (this.game && typeof this.game.enterBonusLevel === 'function') {
                        // Check if it's an entrance or exit pipe
                        if (this.game.gameState === 'OVERWORLD') {
                            this.game.enterBonusLevel(this.autoMovePipe);
                        } else {
                            this.game.returnToOverworld();
                        }
                    } else {
                        console.error('Game reference or enterBonusLevel missing in Player auto-walk');
                    }
                    // DO NOT clear autoMovePipe here, it's needed for PipeState logic
                }
                return;
            }

            // Otherwise move towards target
            // Simulate input
            const direction = Math.sign(diff);
            this.direction = direction;

            // Manually apply movement logic for smoothness
            this.velX += direction * this.acceleration;
            if (Math.abs(this.velX) > this.maxSpeed) {
                this.velX = Math.sign(this.velX) * this.maxSpeed;
            }
            this.isMoving = true;

            // Update animation
            this.animationTick++;
            if (this.animationTick >= 5) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationTick = 0;
            }

            // Apply physics
            this.x += this.velX;
            this.velY += this.GRAVITY;
            this.y += this.velY;

            // Ground collision (simplified for auto-walk)
            if (this.y + this.height > this.GROUND_Y) {
                this.y = this.GROUND_Y - this.height;
                this.velY = 0;
                this.grounded = true;
            }

            // Check if we walked off a ledge or hit a wall?
            // For now, assume simple path to pipe.
            // If we hit a wall, we might get stuck.
            // Let's add a timeout or stuck check if needed, but for now simple is fine.

            return; // Skip normal update
        }
        // Pipe Animation Logic (Delegated to State)
        if (this.currentState instanceof PipeState) {
            this.currentState.update();
            return;
        }

        // Update State Input
        this.currentState.handleInput(input);
        this.currentState.update();

        // Death Animation Logic (Physics only)
        if (this.currentState instanceof Dead) {
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

        // Update Magnet Power
        if (this.magnetPower) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) {
                this.magnetPower = false;
                if (this.game) this.game.playSound('powerdown');
            }
        }

        // Update Mega Mushroom
        if (this.isMega) {
            this.megaTimer--;
            if (this.megaTimer <= 0) {
                this.isMega = false;
                // Revert size
                this.powerScale = this.isPowered ? 1.6 : 1.0;
                const oldHeight = this.height;
                this.width = this.baseWidth * this.powerScale;
                this.height = this.baseHeight * this.powerScale;
                this.y += (oldHeight - this.height); // Keep feet on ground

                if (this.game) this.game.playSound('powerdown');
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
        // Only use mouseX when in MOUSE mode to avoid keyboard/mouse interference
        else if (input.inputMode === 'MOUSE' && input.mouseX !== null && camera) {
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

        // Sprint handling (Shift key) - starPower overrides!
        if (this.starPower) {
            // Star power grants major speed boost (7.5)
            this.maxSpeed = 7.5;
        } else if (input.keys['ShiftLeft'] || input.keys['ShiftRight']) {
            this.isSprinting = true;
            this.maxSpeed = this.sprintMaxSpeed;
        } else {
            this.isSprinting = false;
            this.maxSpeed = this.baseMaxSpeed;
        }

        // Crouch handling (ArrowDown or S key)
        if ((input.keys['ArrowDown'] || input.keys['KeyS']) && this.grounded) {
            if (!this.isCrouching) {
                this.isCrouching = true;
                const heightDiff = this.standingHeight - this.crouchHeight;
                this.y += heightDiff; // Move down to keep feet on ground
                this.height = this.crouchHeight;
            }
            // Slow down while crouching (but starPower maintains speed)
            this.velX *= 0.85;
            this.isSprinting = false;
            if (!this.starPower) {
                this.maxSpeed = this.baseMaxSpeed * 0.5;
            }
        } else {
            if (this.isCrouching) {
                this.isCrouching = false;
                const heightDiff = this.standingHeight - this.crouchHeight;
                this.y -= heightDiff; // Move up when standing
                this.height = this.standingHeight;
            }
        }

        if (moveInput !== 0) {
            // Check for skid (moving opposite to velocity)
            if (this.grounded && Math.abs(this.velX) > 2 && Math.sign(moveInput) !== Math.sign(this.velX)) {
                this.spawnDust('skid');
            }

            // Spawn running dust when sprinting
            if (this.isSprinting && this.grounded && Math.random() < 0.1) {
                this.spawnDust('run');
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
            this.animator.play('run');
        } else if (this.currentState instanceof Idle) {
            this.animationFrame = 0;
            this.animationTick = 0;
            this.animator.play('idle');
        } else if (this.currentState instanceof Jumping) {
            this.animator.play('jump');
        } else if (this.currentState instanceof Falling) {
            this.animator.play('fall');
        }

        // Update animator
        this.animator.update();
        this.animator.setFlipX(this.direction === -1);

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

        // === GRAVITY & GLIDING ===
        // Check for gliding (Cape + falling + holding jump)
        if (this.hasCape && !this.grounded && this.velY > 0 && input.keys['Space']) {
            this.isGliding = true;
            // Apply reduced gravity
            this.velY += this.glideGravity;
            // Cap fall speed
            if (this.velY > this.glideFallSpeed) {
                this.velY = this.glideFallSpeed;
            }
            // Track for "Cape Flyer" achievement (10 seconds = 600 frames)
            if (this.game && this.game.achievementSystem) {
                this.game.achievementSystem.trackGlideFrame();
            }
        } else {
            this.isGliding = false;
            this.velY += this.GRAVITY;
        }
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
        let hitWall = false;
        if (this.x < 0) {
            this.x = 0;
            if (!this.grounded && this.velY > 0) {
                hitWall = true;
                this.wallDirection = -1;
            }
        }
        if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
            if (!this.grounded && this.velY > 0) {
                hitWall = true;
                this.wallDirection = 1;
            }
        }

        // === WALL SLIDE ===
        if (hitWall && !this.grounded && this.velY > 0) {
            this.wallSliding = true;
            this.velY = Math.min(this.velY, this.wallSlideSpeed); // Slower fall
            this.jumpCount = 1; // Allow one more jump (wall jump)
        } else {
            this.wallSliding = false;
            if (this.grounded) this.wallDirection = 0;
        }

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
        this.maxSpeed = 7.5; // Major speed boost! (normal=3.5, sprint=5.5)
    }

    getMagnetPower() {
        this.magnetPower = true;
        this.magnetTimer = 900; // 15 seconds
    }

    getMegaMushroom() {
        this.isMega = true;
        // Apply achievement reward (v2.31.0): MEGA_DESTROY → +20% duration
        const megaMul = this.game?.rewards?.megaDurationMultiplier || 1;
        this.megaTimer = Math.floor(600 * megaMul);
        this.invincible = true;
        this.invincibleTime = this.megaTimer;

        // Grow HUGE
        this.powerScale = 3.0;
        const oldHeight = this.height;
        this.width = this.baseWidth * this.powerScale;
        this.height = this.baseHeight * this.powerScale;
        this.y -= (this.height - oldHeight);
    }

    getFirePower() {
        this.firePower = true;
        this.icePower = false; // Can't have both
        this.powerUp(); // Also grow if not already
    }

    getIcePower() {
        this.icePower = true;
        this.firePower = false; // Can't have both
        this.powerUp(); // Also grow if not already
    }

    getCape() {
        this.hasCape = true;
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
        // Remove fire/ice power first
        if (this.firePower) {
            this.firePower = false;
        }
        if (this.icePower) {
            this.icePower = false;
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

        if (this.firePower || this.icePower || this.isPowered) {
            this.shrink();
            return 'shrink';
        }

        return 'dead';
    }

    takeDamage() {
        const result = this.hit();
        if (result === 'dead') {
            this.die();
        }
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
        // Wall jump - if sliding on wall, jump away from it
        if (this.wallSliding && this.wallDirection !== 0) {
            this.velY = this.wallJumpForce.y;
            this.velX = -this.wallDirection * this.wallJumpForce.x; // Jump away from wall
            this.direction = -this.wallDirection;
            this.jumpHeld = true;
            this.jumpHoldTime = 0;
            this.jumpCount = 2; // Counts as double jump
            this.wallSliding = false;
            this.grounded = false;

            // Stretch on wall jump
            this.scaleX = 0.8;
            this.scaleY = 1.2;

            // Spawn dust effect on wall
            this.spawnDust('skid');

            return true;
        }

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
                // Enhanced double jump effect - more visible!
                this.spawnDust('land'); // Bigger dust burst
                this.spawnDust('run');  // Extra particles
                // Add colorful particles via game
                if (this.game && this.game.addParticles) {
                    this.game.addParticles(this.x + this.width / 2, this.y + this.height, 10, '#FFD700'); // Gold
                    this.game.addParticles(this.x + this.width / 2, this.y + this.height, 8, '#FFFFFF');  // White
                }
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

    enterPipe() {
        this.isEnteringPipe = true;
        this.setState(5); // PIPE state
    }

    exitPipe() {
        this.isExitingPipe = true;
        this.setState(5); // PIPE state
    }

    draw(ctx, camera) {
        ctx.save();

        // Magnet Aura
        if (this.magnetPower) {
            const screenX = this.x - camera.x + this.width / 2;
            const screenY = this.y + this.height / 2;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 40 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = `rgba(200, 200, 255, ${0.3 + Math.cos(Date.now() / 150) * 0.2})`;
            ctx.beginPath();
            ctx.arc(0, 0, 30 + Math.cos(Date.now() / 200) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Enhanced Flashing effect when invincible
        if (this.invincible && !this.starPower) {
            // Faster flash rate for better visibility (every 3 frames instead of 4)
            const flashRate = 3;
            const flashPhase = Math.floor(this.flashTimer / flashRate) % 2;

            if (flashPhase === 0) {
                ctx.globalAlpha = 0.3; // More transparent for visibility
            } else {
                ctx.globalAlpha = 1.0;
            }

            // Add white outline glow effect
            const screenX = this.x - camera.x + this.width / 2;
            const screenY = this.y + this.height / 2;

            if (flashPhase === 1) {
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(this.flashTimer * 0.3) * 0.3})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.width * 0.6, this.height * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        const drawX = this.x - camera.x + this.width / 2;
        const drawY = this.y + this.height; // Pivot at bottom

        ctx.translate(drawX, drawY);

        // Death spin effect
        if (this.isDead && this.deathSpinAngle) {
            ctx.rotate(this.deathSpinAngle);
            // Flash effect during death
            if (this.deathFlashPhase === 1) {
                ctx.globalAlpha = 0.5;
            }
        }

        // Apply powerScale to visual drawing as well
        ctx.scale(this.direction * this.scaleX * this.powerScale, this.scaleY * this.powerScale);

        // Sprite Sheet Drawing Logic
        let animationName = 'idle';
        if (this.isDead) animationName = 'dead';
        else if (this.isJumping) animationName = 'jump';
        else if (this.isMoving) animationName = 'run';

        // Check if animation exists in AssetLoader
        const animation = this.game.assetLoader.getAnimation(animationName);

        if (animation) {
            // Calculate current frame based on game time or internal tick
            // Using this.animationTick which is updated in update()
            // We need a continuous timer for smooth animation independent of state switches if needed
            // For now, use a simple frame index derived from a global timer or internal counter
            const totalFrames = animation.frames.length;
            const frameIndex = Math.floor(Date.now() / (animation.frameDuration * 16)) % totalFrames;
            // *16 to convert roughly frames to ms if frameDuration is in frames (60fps)
            // Or if frameDuration is ms, remove *16. Let's assume frameDuration is frames (e.g. 10 frames)

            const spriteName = animation.frames[frameIndex];
            const sprite = this.game.assetLoader.getSprite(spriteName);

            if (sprite) {
                ctx.translate(0, -this.baseHeight); // Adjust for sprite origin (top-left vs bottom-center)
                // Draw sprite centered horizontally
                ctx.drawImage(
                    sprite.image,
                    sprite.x, sprite.y, sprite.width, sprite.height,
                    -this.baseWidth / 2, 0, this.baseWidth, this.baseHeight
                );
                ctx.restore();
                return; // Skip procedural drawing
            }
        }

        // Fallback to Procedural Drawing
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

        if (this.icePower) {
            pantsColor = '#FFFFFF'; // White
            shirtColor = '#87CEEB'; // Light blue
            hatColor = '#00BFFF';   // Deep sky blue
            overallColor = '#4169E1'; // Royal blue overalls
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
