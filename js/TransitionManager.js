/**
 * TransitionManager.js - Scene Transition Effects
 * 
 * Handles smooth fade in/out transitions between game states
 * (e.g., entering/exiting bonus levels, respawning).
 * @version 2.8.0
 */

import { CONFIG } from './Config.js?v=2.8.0';

export class TransitionManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;

        // Transition state
        this.active = false;
        this.type = null;          // 'fadeOut' | 'fadeIn'
        this.alpha = 0;
        this.duration = CONFIG.TRANSITION.FADE_DURATION;
        this.timer = 0;
        this.callback = null;
        this.color = '#000000';
    }

    /**
     * Start a fade out transition (screen goes dark)
     * @param {Function} callback - Called when fade out is complete
     * @param {string} color - Fade color (default black)
     */
    fadeOut(callback, color = '#000000') {
        this.active = true;
        this.type = 'fadeOut';
        this.alpha = 0;
        this.timer = 0;
        this.callback = callback;
        this.color = color;
    }

    /**
     * Start a fade in transition (screen clears)
     * @param {Function} callback - Called when fade in is complete
     */
    fadeIn(callback = null) {
        this.active = true;
        this.type = 'fadeIn';
        this.alpha = 1;
        this.timer = 0;
        this.callback = callback;
    }

    /**
     * Update transition state
     * @returns {boolean} True if transition is active
     */
    update() {
        if (!this.active) return false;

        this.timer++;
        const progress = Math.min(this.timer / this.duration, 1);

        if (this.type === 'fadeOut') {
            // Ease out: slow start, fast end
            this.alpha = this.easeInQuad(progress);

            if (progress >= 1) {
                this.alpha = 1;
                if (this.callback) {
                    this.callback();
                    this.callback = null;
                }
                // Auto-start fade in after callback
                this.fadeIn();
            }
        } else if (this.type === 'fadeIn') {
            // Ease in: fast start, slow end
            this.alpha = 1 - this.easeOutQuad(progress);

            if (progress >= 1) {
                this.alpha = 0;
                this.active = false;
                if (this.callback) {
                    this.callback();
                    this.callback = null;
                }
            }
        }

        return true;
    }

    /**
     * Draw the transition overlay
     */
    draw() {
        if (!this.active && this.alpha <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, 0, this.game.width, this.game.height);
        this.ctx.restore();
    }

    /**
     * Check if a transition is currently active
     */
    isActive() {
        return this.active;
    }

    /**
     * Force end the current transition
     */
    cancel() {
        this.active = false;
        this.alpha = 0;
        this.callback = null;
    }

    // ===== Easing Functions =====

    easeInQuad(t) {
        return t * t;
    }

    easeOutQuad(t) {
        return t * (2 - t);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
