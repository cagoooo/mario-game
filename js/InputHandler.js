export class InputHandler {
    constructor(jumpCallback) {
        this.keys = {};
        this.mouseX = null;
        this.jumpCallback = jumpCallback;
        this.canvasWidth = 800;

        // Touch direction: -1 = left, 0 = none, 1 = right
        this.touchDirection = 0;
        this.isTouching = false;

        window.addEventListener('keydown', e => this.handleKeyDown(e));
        window.addEventListener('keyup', e => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
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
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            this.mouseX = (e.clientX - rect.left) * scaleX;
        });

        // Click handler - jump and set direction
        canvas.addEventListener('click', (e) => {
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

        // Touch start - jump and set direction
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const touch = e.touches[0];
            const touchX = (touch.clientX - rect.left) * scaleX;
            const centerX = canvas.width / 2;

            this.isTouching = true;

            // Set direction based on touch position
            if (touchX < centerX - 50) {
                this.touchDirection = -1;
            } else if (touchX > centerX + 50) {
                this.touchDirection = 1;
            } else {
                this.touchDirection = 0;
            }

            // Update mouseX for player following
            this.mouseX = touchX;

            this.jumpCallback();
        }, { passive: false });

        // Touch move - update direction continuously
        canvas.addEventListener('touchmove', (e) => {
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

        // Touch end - stop moving
        canvas.addEventListener('touchend', (e) => {
            this.isTouching = false;
            this.touchDirection = 0;
        });

        document.body.addEventListener('touchmove', (e) => {
            if (e.target === canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    attachControls(leftBtn, rightBtn, jumpBtn) {
        const addInput = (elem, code) => {
            // Use Pointer Events for unified handling of mouse and touch
            elem.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // Prevent default touch actions/selection
                elem.setPointerCapture(e.pointerId); // Capture pointer to handle drag/slide off
                this.keys[code] = true;
            });

            elem.addEventListener('pointerup', (e) => {
                e.preventDefault();
                elem.releasePointerCapture(e.pointerId);
                this.keys[code] = false;
            });

            elem.addEventListener('pointercancel', (e) => {
                e.preventDefault();
                elem.releasePointerCapture(e.pointerId);
                this.keys[code] = false;
            });

            // Handle sliding off the button
            elem.addEventListener('pointerleave', (e) => {
                // Only reset if we're not capturing (though setPointerCapture usually handles this)
                // But for safety:
                if (this.keys[code]) {
                    this.keys[code] = false;
                }
            });
        };

        addInput(leftBtn, 'ArrowLeft');
        addInput(rightBtn, 'ArrowRight');

        // Jump button
        if (jumpBtn) {
            jumpBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                jumpBtn.setPointerCapture(e.pointerId);
                this.jumpCallback();
            });

            jumpBtn.addEventListener('pointerup', (e) => {
                e.preventDefault();
                jumpBtn.releasePointerCapture(e.pointerId);
            });
        }

        // Prevent default on all control buttons
        [leftBtn, rightBtn, jumpBtn].filter(Boolean).forEach(btn => {
            btn.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            btn.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
        });
    }
}
