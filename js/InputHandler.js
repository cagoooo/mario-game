export class InputHandler {
    constructor(jumpCallback) {
        this.keys = {};
        this.mouseX = 0;
        this.jumpCallback = jumpCallback;

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
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        canvas.addEventListener('click', () => this.jumpCallback());

        canvas.addEventListener('touchstart', (e) => {
            this.jumpCallback();
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
