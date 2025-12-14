export class InputHandler {
    constructor(jumpCallback) {
        this.keys = {};
        this.mouseX = null;
        this.jumpCallback = jumpCallback;
        this.canvasWidth = 800;

        // Touch direction: -1 = left, 0 = none, 1 = right
        this.touchDirection = 0;
        this.isTouching = false;
        this.lastTouchTime = 0;

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

        // Cache rect to avoid layout thrashing
        this.rect = canvas.getBoundingClientRect();

        // Update rect on resize or scroll
        const updateRect = () => {
            this.rect = canvas.getBoundingClientRect();
        };
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        // Mouse move for position tracking - use window to track even outside canvas/over UI
        window.addEventListener('mousemove', e => {
            // Use cached rect
            const scaleX = canvas.width / this.rect.width;
            this.mouseX = (e.clientX - this.rect.left) * scaleX;
        });

        // Mouse down handler - jump and set direction (replaces click for better responsiveness and to avoid conflicts)
        canvas.addEventListener('mousedown', (e) => {
            // Ignore if touch just happened (prevent ghost clicks)
            if (this.lastTouchTime && Date.now() - this.lastTouchTime < 500) {
                return;
            }

            // Use cached rect
            const scaleX = canvas.width / this.rect.width;
            const clickX = (e.clientX - this.rect.left) * scaleX;
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
            // Use cached rect
            const scaleX = canvas.width / this.rect.width;
            const touch = e.touches[0];
            const touchX = (touch.clientX - this.rect.left) * scaleX;
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
            // Use cached rect
            const scaleX = canvas.width / this.rect.width;
            const touch = e.touches[0];
            const touchX = (touch.clientX - this.rect.left) * scaleX;
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
