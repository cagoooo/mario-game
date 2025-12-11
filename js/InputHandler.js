export class InputHandler {
    constructor(jumpCallback) {
        this.keys = {};
        this.mouseX = 0;
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

        // Mouse move for position tracking
        canvas.addEventListener('mousemove', e => {
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
        const addTouch = (elem, code) => {
            elem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[code] = true;
            });
            elem.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[code] = false;
            });
        };

        addTouch(leftBtn, 'ArrowLeft');
        addTouch(rightBtn, 'ArrowRight');

        // Jump button
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jumpCallback();
            });
        }

        // Prevent default on all control buttons
        [leftBtn, rightBtn, jumpBtn].filter(Boolean).forEach(btn => {
            btn.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        });
    }
}
