// Enhanced Camera System with smooth tracking, zoom, and effects
export class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;

        // Smoothing
        this.easing = 0.08;
        this.leadAmount = 100; // How far ahead to look

        // Zoom
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.zoomSpeed = 0.02;

        // Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.92;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        // Bounds
        this.minX = 0;
        this.maxX = Infinity;

        // Slow motion
        this.slowMotion = 1.0;
        this.targetSlowMotion = 1.0;
    }

    update(target, canvasWidth, canvasHeight) {
        if (!target) return;

        // Calculate target position with lead
        const leadX = target.velX * this.leadAmount * 0.1;
        this.targetX = target.x - canvasWidth / 3 + leadX;

        // Clamp to bounds
        this.targetX = Math.max(this.minX, this.targetX);
        if (this.maxX < Infinity) {
            this.targetX = Math.min(this.maxX - canvasWidth, this.targetX);
        }

        // Smooth interpolation
        this.x += (this.targetX - this.x) * this.easing;
        this.y += (this.targetY - this.y) * this.easing;

        // Ensure x doesn't go negative
        this.x = Math.max(0, this.x);

        // Update shake
        this.updateShake();

        // Update zoom
        if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
            this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;
        }

        // Update slow motion
        if (Math.abs(this.slowMotion - this.targetSlowMotion) > 0.01) {
            this.slowMotion += (this.targetSlowMotion - this.slowMotion) * 0.1;
        }
    }

    updateShake() {
        if (this.shakeIntensity > 0.1) {
            // Generate random offset
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;

            // Decay
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    shake(intensity, decayRate = 0.92) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDecay = decayRate;
    }

    // Different shake patterns
    shakeExplosion(intensity = 15) {
        this.shake(intensity, 0.88);
    }

    shakeImpact(intensity = 8) {
        this.shake(intensity, 0.95);
    }

    shakeRumble(intensity = 3) {
        this.shake(intensity, 0.98);
    }

    // Zoom controls
    zoomTo(level, instant = false) {
        this.targetZoom = Math.max(0.5, Math.min(2, level));
        if (instant) this.zoom = this.targetZoom;
    }

    zoomIn(amount = 0.1) {
        this.zoomTo(this.targetZoom + amount);
    }

    zoomOut(amount = 0.1) {
        this.zoomTo(this.targetZoom - amount);
    }

    resetZoom() {
        this.targetZoom = 1.0;
    }

    // Slow motion controls
    setSlowMotion(factor, instant = false) {
        this.targetSlowMotion = Math.max(0.1, Math.min(1, factor));
        if (instant) this.slowMotion = this.targetSlowMotion;
    }

    resetSlowMotion() {
        this.targetSlowMotion = 1.0;
    }

    // Get final position with all effects applied
    getFinalX() {
        return this.x + this.shakeOffsetX;
    }

    getFinalY() {
        return this.y + this.shakeOffsetY;
    }

    // Apply camera transform to context
    applyTransform(ctx, canvasWidth, canvasHeight) {
        ctx.save();

        // Apply shake
        ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

        // Apply zoom (centered)
        if (this.zoom !== 1.0) {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-centerX, -centerY);
        }
    }

    restoreTransform(ctx) {
        ctx.restore();
    }

    // Focus on a specific point
    focusOn(x, y, instant = false) {
        this.targetX = x - this.game.width / 2;
        this.targetY = y - this.game.height / 2;

        if (instant) {
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }

    // Set camera bounds
    setBounds(minX, maxX) {
        this.minX = minX;
        this.maxX = maxX;
    }

    // Reset camera
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.shakeIntensity = 0;
        this.slowMotion = 1.0;
        this.targetSlowMotion = 1.0;
    }
}
