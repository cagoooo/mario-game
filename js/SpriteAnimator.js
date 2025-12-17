// SpriteAnimator - Handles sprite animation states and transitions
export class SpriteAnimator {
    constructor() {
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.animations = {};
        this.sprites = {};
        this.flipX = false;
    }

    // Define an animation with frames
    defineAnimation(name, config) {
        this.animations[name] = {
            frames: config.frames || [],           // Array of sprite names or draw functions
            frameDuration: config.frameDuration || 8,  // Frames per animation frame
            loop: config.loop !== false,           // Loop by default
            onComplete: config.onComplete || null, // Callback when non-looping animation ends
            type: config.type || 'sprite'          // 'sprite' or 'programmatic'
        };
    }

    // Define a programmatic sprite (canvas drawing function)
    defineProgrammaticSprite(name, drawFunction) {
        this.sprites[name] = {
            type: 'programmatic',
            draw: drawFunction
        };
    }

    // Define a sprite from a sprite sheet
    defineSprite(name, image, x, y, width, height) {
        this.sprites[name] = {
            type: 'image',
            image,
            sx: x,
            sy: y,
            sw: width,
            sh: height
        };
    }

    // Play an animation
    play(animationName, force = false) {
        if (this.currentAnimation === animationName && !force) return;

        if (!this.animations[animationName]) {
            console.warn(`Animation '${animationName}' not found`);
            return;
        }

        this.currentAnimation = animationName;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    // Update the animation (call each game frame)
    update() {
        const anim = this.animations[this.currentAnimation];
        if (!anim || anim.frames.length === 0) return;

        this.frameTimer++;
        if (this.frameTimer >= anim.frameDuration) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frames.length - 1;
                    if (anim.onComplete) anim.onComplete();
                }
            }
        }
    }

    // Get current frame info
    getCurrentFrame() {
        const anim = this.animations[this.currentAnimation];
        if (!anim || anim.frames.length === 0) return null;

        const frameName = anim.frames[this.currentFrame];
        return this.sprites[frameName] || null;
    }

    // Draw the current frame
    draw(ctx, x, y, width, height) {
        const anim = this.animations[this.currentAnimation];
        if (!anim || anim.frames.length === 0) return;

        const frameName = anim.frames[this.currentFrame];
        const sprite = this.sprites[frameName];

        if (!sprite) return;

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);

        if (this.flipX) {
            ctx.scale(-1, 1);
        }

        if (sprite.type === 'programmatic') {
            sprite.draw(ctx, -width / 2, -height / 2, width, height, this.currentFrame);
        } else if (sprite.type === 'image' && sprite.image) {
            ctx.drawImage(
                sprite.image,
                sprite.sx, sprite.sy, sprite.sw, sprite.sh,
                -width / 2, -height / 2, width, height
            );
        }

        ctx.restore();
    }

    // Set horizontal flip
    setFlipX(flip) {
        this.flipX = flip;
    }

    // Check if playing specific animation
    isPlaying(animationName) {
        return this.currentAnimation === animationName;
    }

    // Get current animation name
    getCurrentAnimationName() {
        return this.currentAnimation;
    }
}

// Factory to create Mario-style character animator with programmatic sprites
export function createMarioAnimator() {
    const animator = new SpriteAnimator();

    // Define programmatic sprites for Mario
    // Idle frame
    animator.defineProgrammaticSprite('mario_idle_1', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'idle', 0);
    });

    // Run frames
    animator.defineProgrammaticSprite('mario_run_1', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'run', 0);
    });
    animator.defineProgrammaticSprite('mario_run_2', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'run', 1);
    });
    animator.defineProgrammaticSprite('mario_run_3', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'run', 2);
    });

    // Jump frame
    animator.defineProgrammaticSprite('mario_jump_1', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'jump', 0);
    });

    // Fall frame
    animator.defineProgrammaticSprite('mario_fall_1', (ctx, x, y, w, h) => {
        drawMarioFrame(ctx, x, y, w, h, 'fall', 0);
    });

    // Define animations
    animator.defineAnimation('idle', {
        frames: ['mario_idle_1'],
        frameDuration: 10,
        loop: true
    });

    animator.defineAnimation('run', {
        frames: ['mario_run_1', 'mario_run_2', 'mario_run_3', 'mario_run_2'],
        frameDuration: 5,
        loop: true
    });

    animator.defineAnimation('jump', {
        frames: ['mario_jump_1'],
        frameDuration: 10,
        loop: true
    });

    animator.defineAnimation('fall', {
        frames: ['mario_fall_1'],
        frameDuration: 10,
        loop: true
    });

    return animator;
}

// Helper function to draw Mario programmatically with animation variations
function drawMarioFrame(ctx, x, y, w, h, state, frame) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // Scale factors for the character
    const scale = Math.min(w, h) / 50; // Base size is 50

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // Body positioning based on state
    let legOffset = 0;
    let armAngle = 0;
    let bodySquash = 1;

    if (state === 'run') {
        // Running animation - legs moving
        const runCycle = [0, 6, 0, -6];
        legOffset = runCycle[frame % 4];
        armAngle = legOffset * 0.1;
    } else if (state === 'jump') {
        // Jumping - arms up, stretched body
        armAngle = -0.4;
        bodySquash = 1.1;
    } else if (state === 'fall') {
        // Falling - arms out, squashed body
        armAngle = 0.3;
        bodySquash = 0.95;
    }

    // Draw character
    ctx.save();
    ctx.scale(1, bodySquash);

    // Body (blue overalls)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.roundRect(-12, -5, 24, 22, 4);
    ctx.fill();

    // Overall straps
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(-10, -15, 6, 12);
    ctx.fillRect(4, -15, 6, 12);

    // Shirt (red)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.roundRect(-10, -18, 20, 15, 3);
    ctx.fill();

    // Head (skin color)
    ctx.fillStyle = '#FFD8B0';
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cap (red)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.ellipse(0, -32, 14, 8, 0, Math.PI, 0);
    ctx.fill();
    // Cap brim
    ctx.fillRect(-16, -32, 32, 4);

    // Cap emblem (white M)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, -32, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 0, -32);

    // Eyes
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.ellipse(-4, -26, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -26, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mustache
    ctx.fillStyle = '#3D2314';
    ctx.beginPath();
    ctx.ellipse(-5, -20, 6, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(5, -20, 6, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FFD8B0';
    ctx.beginPath();
    ctx.ellipse(0, -22, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Arms (with rotation based on animation)
    ctx.fillStyle = '#FF0000';
    ctx.save();
    ctx.rotate(armAngle);
    ctx.beginPath();
    ctx.ellipse(-16, -8, 5, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(-armAngle);
    ctx.beginPath();
    ctx.ellipse(16, -8, 5, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Hands
    ctx.fillStyle = '#FFD8B0';
    ctx.beginPath();
    ctx.arc(-18, -2, 4, 0, Math.PI * 2);
    ctx.arc(18, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Legs (with offset for running)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.roundRect(-10 + legOffset, 15, 8, 12, 2);
    ctx.roundRect(2 - legOffset, 15, 8, 12, 2);
    ctx.fill();

    // Shoes (brown)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(-6 + legOffset, 28, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(6 - legOffset, 28, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Factory to create Goomba animator
export function createGoombaAnimator() {
    const animator = new SpriteAnimator();

    animator.defineProgrammaticSprite('goomba_walk_1', (ctx, x, y, w, h) => {
        drawGoombaFrame(ctx, x, y, w, h, 0);
    });
    animator.defineProgrammaticSprite('goomba_walk_2', (ctx, x, y, w, h) => {
        drawGoombaFrame(ctx, x, y, w, h, 1);
    });

    animator.defineAnimation('walk', {
        frames: ['goomba_walk_1', 'goomba_walk_2'],
        frameDuration: 10,
        loop: true
    });

    return animator;
}

function drawGoombaFrame(ctx, x, y, w, h, frame) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const scale = Math.min(w, h) / 30;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // Body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(0, 5, 13, 0, Math.PI * 2);
    ctx.fill();

    // Mushroom cap
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(0, -6, 16, 11, 0, Math.PI, 0);
    ctx.fill();

    // Eyes (angry)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-5, 0, 4, 0, Math.PI * 2);
    ctx.arc(5, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-4, 0, 2, 0, Math.PI * 2);
    ctx.arc(6, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(-2, -2);
    ctx.moveTo(9, -4);
    ctx.lineTo(2, -2);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#000';
    const footOffset = frame === 0 ? -2 : 2;
    ctx.fillRect(-11 + footOffset, 14, 7, 4);
    ctx.fillRect(4 - footOffset, 14, 7, 4);

    ctx.restore();
}

// Factory to create Koopa animator  
export function createKoopaAnimator() {
    const animator = new SpriteAnimator();

    animator.defineProgrammaticSprite('koopa_walk_1', (ctx, x, y, w, h) => {
        drawKoopaFrame(ctx, x, y, w, h, 0);
    });
    animator.defineProgrammaticSprite('koopa_walk_2', (ctx, x, y, w, h) => {
        drawKoopaFrame(ctx, x, y, w, h, 1);
    });

    animator.defineAnimation('walk', {
        frames: ['koopa_walk_1', 'koopa_walk_2'],
        frameDuration: 10,
        loop: true
    });

    return animator;
}

function drawKoopaFrame(ctx, x, y, w, h, frame) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const scale = Math.min(w, h) / 40;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // Shell
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(0, 3, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell pattern
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 3, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(10, -6, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(13, -7, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(14, -7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#FFEB3B';
    const footOffset = frame === 0 ? -2 : 2;
    ctx.fillRect(-9 + footOffset, 12, 7, 5);
    ctx.fillRect(2 - footOffset, 12, 7, 5);

    ctx.restore();
}
