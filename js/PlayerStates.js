const states = {
    IDLE: 0,
    RUNNING: 1,
    JUMPING: 2,
    FALLING: 3,
    DEAD: 4
};

class State {
    constructor(state, player) {
        this.state = state;
        this.player = player;
    }
    enter() { }
    handleInput(input) { }
}

export class Idle extends State {
    constructor(player) {
        super(states.IDLE, player);
    }

    enter() {
        this.player.frameX = 0;
        this.player.maxFrame = 0;
        this.player.animationFrame = 0;
    }

    handleInput(input) {
        // Horizontal movement
        if (input.keys['ArrowLeft'] || input.keys['ArrowRight'] || input.touchDirection !== 0 || (input.mouseX !== null && Math.abs(input.mouseX - (this.player.x - this.player.game.camera.x + this.player.width / 2)) > 30)) {
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
        } else if (input.mouseX !== null && Math.abs(input.mouseX - (this.player.x - this.player.game.camera.x + this.player.width / 2)) > 30) {
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

        // Allow horizontal movement control in air
        // (Logic remains in Player.update for physics, state just monitors transitions)
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
}

export class Dead extends State {
    constructor(player) {
        super(states.DEAD, player);
    }

    enter() {
        this.player.isDead = true;
        this.player.velX = 0;
        this.player.velY = -12; // Death hop
        this.player.game.playSound('death');
    }

    handleInput(input) {
        // No input handling, just wait for game over
    }
}
