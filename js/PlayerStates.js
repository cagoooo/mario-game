const states = {
    IDLE: 0,
    RUNNING: 1,
    JUMPING: 2,
    FALLING: 3,
    DEAD: 4,
    PIPE: 5
};

class State {
    constructor(state, player) {
        this.state = state;
        this.player = player;
    }
    enter() { }
    handleInput(input) { }
    update() { } // Physics & Logic
}

export class Idle extends State {
    constructor(player) {
        super(states.IDLE, player);
    }

    enter() {
        this.player.frameX = 0;
        this.player.maxFrame = 0;
        this.player.animationFrame = 0;
        this.player.velX = 0; // Ensure stop
    }

    handleInput(input) {
        // Horizontal movement
        // Only use mouseX when in MOUSE mode to avoid keyboard/mouse interference
        const mouseMoving = input.inputMode === 'MOUSE' && input.mouseX !== null && Math.abs(input.mouseX - (this.player.x - this.player.game.camera.x + this.player.width / 2)) > 30;
        if (input.keys['ArrowLeft'] || input.keys['ArrowRight'] || input.touchDirection !== 0 || mouseMoving) {
            this.player.setState(states.RUNNING);
        }
        // Jump
        else if (input.keys['Space'] || input.isTouching) {
            if (this.player.jump()) {
                this.player.setState(states.JUMPING);
            }
        }
        // Fall (if platform disappears or walked off edge)
        else if (!this.player.grounded) {
            this.player.setState(states.FALLING);
        }
        // Pipe
        else if (this.player.isEnteringPipe) {
            this.player.setState(states.PIPE);
        }
    }

    update() {
        // Apply friction to ensure full stop
        this.player.velX *= this.player.friction;
        if (Math.abs(this.player.velX) < 0.1) this.player.velX = 0;
    }
}

export class Running extends State {
    constructor(player) {
        super(states.RUNNING, player);
    }

    enter() {
        this.player.maxFrame = 3;
    }

    handleInput(input) {
        // Stop moving
        let isMoving = false;
        if (input.keys['ArrowLeft'] || input.keys['ArrowRight'] || input.touchDirection !== 0) {
            isMoving = true;
        } else if (input.inputMode === 'MOUSE' && input.mouseX !== null && Math.abs(input.mouseX - (this.player.x - this.player.game.camera.x + this.player.width / 2)) > 30) {
            // Only use mouseX when in MOUSE mode to avoid keyboard/mouse interference
            isMoving = true;
        }

        if (!isMoving && Math.abs(this.player.velX) < 0.1) {
            this.player.setState(states.IDLE);
        }
        // Jump
        else if (input.keys['Space'] || input.isTouching) {
            if (this.player.jump()) {
                this.player.setState(states.JUMPING);
            }
        }
        // Fall
        else if (!this.player.grounded) {
            this.player.setState(states.FALLING);
        }
        // Pipe
        else if (this.player.isEnteringPipe) {
            this.player.setState(states.PIPE);
        }
    }

    update() {
        // Physics handled in Player.update for now (shared logic), 
        // but state specific stuff like dust can go here
        if (this.player.grounded) {
            this.player.runDustTimer++;
            if (this.player.runDustTimer > 10) {
                this.player.spawnDust('run');
                this.player.runDustTimer = 0;
            }
        }
    }
}

export class Jumping extends State {
    constructor(player) {
        super(states.JUMPING, player);
    }

    enter() {
        this.player.animationFrame = 1; // Jump frame
    }

    handleInput(input) {
        // Double jump logic is handled inside player.jump(), but we need to trigger it
        if ((input.keys['Space'] || input.isTouching) && !this.player.jumpHeld) {
            // Attempt double jump
            if (this.player.jump()) {
                // Remain in jumping state, but re-enter to reset animation/particles if needed
                this.enter();
            }
        }

        if (this.player.velY > 0) {
            this.player.setState(states.FALLING);
        }
    }

    update() {
        // Variable jump height logic could move here
    }
}

export class Falling extends State {
    constructor(player) {
        super(states.FALLING, player);
    }

    enter() {
        this.player.animationFrame = 2; // Fall frame (if exists, or reuse jump)
    }

    handleInput(input) {
        // Double jump allowed while falling? Usually yes in this game
        if ((input.keys['Space'] || input.isTouching) && !this.player.jumpHeld) {
            if (this.player.jump()) {
                this.player.setState(states.JUMPING);
            }
        }

        if (this.player.grounded) {
            this.player.setState(states.IDLE); // Or Running if keys held, but Idle is safe default, it will switch next frame
        }
    }

    update() {
    }
}

export class Dead extends State {
    constructor(player) {
        super(states.DEAD, player);
        this.spinAngle = 0;
        this.spinSpeed = 0.3;
        this.deathFlashTimer = 0;
    }

    enter() {
        this.player.isDead = true;
        this.player.velX = 0;
        this.player.velY = -15; // Higher death hop for drama
        this.spinAngle = 0;
        this.deathFlashTimer = 0;
        this.player.game.playSound('death');

        // Death particle burst
        if (this.player.game && this.player.game.addParticles) {
            this.player.game.addParticles(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                15, '#FF4444'
            );
            this.player.game.addParticles(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                10, '#FFFFFF'
            );
        }
    }

    handleInput(input) {
        // No input handling, just wait for game over
    }

    update() {
        // Physics for death hop
        this.player.velY += this.player.GRAVITY;
        this.player.y += this.player.velY;

        // Spin animation
        this.spinAngle += this.spinSpeed;
        this.player.deathSpinAngle = this.spinAngle;

        // Death flash timer
        this.deathFlashTimer++;
        this.player.deathFlashPhase = Math.floor(this.deathFlashTimer / 4) % 2;
    }
}

export class PipeState extends State {
    constructor(player) {
        super(states.PIPE, player);
    }

    enter() {
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.pipeTimer = 0;
        this.player.game.playSound('powerup_mushroom');

        // Center player on pipe
        if (this.player.autoMovePipe) {
            const pipeCenter = this.player.autoMovePipe.x + this.player.autoMovePipe.width / 2;
            this.player.x = pipeCenter - this.player.width / 2;
        }
    }

    handleInput(input) {
        // No input allowed
    }

    update() {
        if (this.player.isEnteringPipe) {
            this.player.y += 1; // Move down
            this.player.pipeTimer++;
            if (this.player.pipeTimer > 60) {
                // Trigger level transition with fade effect
                if (this.player.game && typeof this.player.game.loadBonusLevel === 'function') {
                    const game = this.player.game;
                    const player = this.player;

                    if (game.gameState === 'BONUS') {
                        // Returning to Overworld - use fade transition
                        game.transitionManager.fadeOut(() => {
                            game.unloadBonusLevel();
                            player.isEnteringPipe = false;
                            player.setState(states.IDLE);
                        });
                    } else if (player.autoMovePipe) {
                        // Entering Bonus Level - use fade transition
                        game.transitionManager.fadeOut(() => {
                            game.loadBonusLevel();
                            player.autoMovePipe = null;
                            player.isEnteringPipe = false;
                            // Force falling state so physics resume
                            player.setState(states.FALLING);
                        });
                    }
                }
            }
        } else if (this.player.isExitingPipe) {
            this.player.y -= 1; // Move up
            this.player.pipeTimer++;
            if (this.player.pipeTimer > 60) {
                this.player.isExitingPipe = false;
                this.player.grounded = true;
                this.player.setState(states.IDLE);
            }
        }
    }
}
