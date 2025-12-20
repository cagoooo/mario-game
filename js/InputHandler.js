export class InputHandler {
    constructor(jumpCallback) {
        this.keys = {};
        this.mouseX = null;
        this.jumpCallback = jumpCallback;
        this.canvasWidth = 800;

        // Input mode: 'KEYBOARD' or 'MOUSE'
        // Automatically switches based on user input
        this.inputMode = 'MOUSE';

        // Touch direction: -1 = left, 0 = none, 1 = right
        this.touchDirection = 0;
        this.isTouching = false;
        this.lastTouchTime = 0;

        window.addEventListener('keydown', e => this.handleKeyDown(e));
        window.addEventListener('keyup', e => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        // Switch to KEYBOARD mode when movement keys are pressed
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
            this.inputMode = 'KEYBOARD';
        }
        this.keys[e.code] = true;
        if (e.code === 'Space') {
            this.jumpCallback();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    attachCanvas(canvas) {
        this.canvasWidth = canvas.width;

        // Mouse move for position tracking - use window to track even outside canvas/over UI
        window.addEventListener('mousemove', e => {
            const oldMouseX = this.mouseX;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            this.mouseX = (e.clientX - rect.left) * scaleX;

            // Switch to MOUSE mode when mouse moves significantly
            if (oldMouseX !== null && Math.abs(this.mouseX - oldMouseX) > 10) {
                this.inputMode = 'MOUSE';
            }
        });

        // Mouse down handler - jump and set direction (replaces click for better responsiveness and to avoid conflicts)
        canvas.addEventListener('mousedown', (e) => {
            // Ignore if touch just happened (prevent ghost clicks)
            if (this.lastTouchTime && Date.now() - this.lastTouchTime < 500) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const clickX = (e.clientX - rect.left) * scaleX;
            const centerX = canvas.width / 2;

            // Set direction based on click position
            if (clickX < centerX - 50) {
                this.touchDirection = -1;
            } else if (clickX > centerX + 50) {
                this.touchDirection = 1;
            }

            this.jumpCallback();

            // Keep moving for a short time after click
            setTimeout(() => {
                this.touchDirection = 0;
            }, 500);
        });

        // Touch start - jump and set direction (Global listener for full screen touch)
        window.addEventListener('touchstart', (e) => {
            // Ignore if touching a button or UI element
            if (e.target.tagName === 'BUTTON' || e.target.closest('.controlButton') || e.target.closest('#gameUI')) {
                return;
            }

            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const touch = e.touches[0];
            const touchX = (touch.clientX - rect.left) * scaleX;
            const centerX = canvas.width / 2;

            this.isTouching = true;
            this.lastTouchTime = Date.now();

            // Set direction based on touch position (relative to canvas center)
            if (touchX < centerX - 50) {
                this.touchDirection = -1;
            } else if (touchX > centerX + 50) {
                this.touchDirection = 1;
            } else {
                this.touchDirection = 0;
            }

            // Update mouseX for player following
            this.mouseX = touchX;

            // Simulate Space key for variable jump height
            this.keys['Space'] = true;
            this.jumpCallback();
        }, { passive: false });

        // Touch move - update direction continuously
        window.addEventListener('touchmove', (e) => {
            // Ignore if touching a button or UI element
            if (e.target.tagName === 'BUTTON' || e.target.closest('.controlButton') || e.target.closest('#gameUI')) {
                return;
            }

            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const touch = e.touches[0];
            const touchX = (touch.clientX - rect.left) * scaleX;
            const centerX = canvas.width / 2;

            // Update direction based on touch position
            if (touchX < centerX - 50) {
                this.touchDirection = -1;
            } else if (touchX > centerX + 50) {
                this.touchDirection = 1;
            }

            this.mouseX = touchX;
        }, { passive: false });

        // Touch end - stop moving and release jump
        window.addEventListener('touchend', (e) => {
            this.isTouching = false;
            this.touchDirection = 0;
            this.keys['Space'] = false; // Release jump button
        });

        document.body.addEventListener('touchmove', (e) => {
            if (e.target === canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    attachControls(leftBtn, rightBtn, jumpBtn) {
        const addInput = (elem, code) => {
            // Touch events - prevent default to stop mouse emulation
            elem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[code] = true;
            }, { passive: false });

            elem.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[code] = false;
            });

            // Mouse events - for desktop support
            elem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys[code] = true;
            });

            elem.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys[code] = false;
            });

            elem.addEventListener('mouseleave', (e) => {
                if (this.keys[code]) {
                    this.keys[code] = false;
                }
            });
        };

        addInput(leftBtn, 'ArrowLeft');
        addInput(rightBtn, 'ArrowRight');
        // Add Down key support (no UI button for now, but keyboard works)
        // We can add a virtual button later if needed, or use a gesture.

        // Also map 's' and 'ArrowDown' in the main key listener (already handled by generic keydown)
        // But for touch controls, we might need a way to crouch.
        // For now, let's assume keyboard 'ArrowDown' or 's' is enough for testing.

        // Jump button
        if (jumpBtn) {
            // Touch - Simulate Space key for variable jump height
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['Space'] = true; // Simulate holding jump button
                this.jumpCallback();
            }, { passive: false });

            jumpBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['Space'] = false; // Release jump button
            });

            // Mouse
            jumpBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.jumpCallback();
            });
        }

        // Prevent default on all control buttons
        [leftBtn, rightBtn, jumpBtn].filter(Boolean).forEach(btn => {
            btn.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            btn.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
        });
    }
}
