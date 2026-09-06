const ALIASES = { KeyA: 'ArrowLeft', KeyD: 'ArrowRight', KeyS: 'ArrowDown', KeyW: 'Space', ArrowUp: 'Space' };
const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space', 'ShiftLeft', 'ShiftRight']);

export class InputHandler {
    constructor(jumpCallback, isActive = () => true) {
        this.jumpCallback = jumpCallback;
        this.isActive = isActive;
        this.controller = new AbortController();
        this.sources = new Map();
        this.reset();
        this.listen(window, 'keydown', e => this.handleKeyDown(e));
        this.listen(window, 'keyup', e => this.handleKeyUp(e));
        this.listen(window, 'blur', () => this.reset());
        this.listen(document, 'visibilitychange', () => { if (document.hidden) this.reset(); });
    }
    listen(target, event, handler, options = {}) {
        target.addEventListener(event, handler, { ...options, signal: this.controller.signal });
    }
    reset() {
        this.keys = {};
        this.sources.clear();
        this.mouseX = null;
        this.touchDirection = 0;
        this.isTouching = false;
        this.inputMode = 'KEYBOARD';
    }
    setSource(source, code, down) {
        const wasDown = !!this.keys[code];
        if (down) this.sources.set(source, code);
        else this.sources.delete(source);
        this.keys[code] = [...this.sources.values()].includes(code);
        if (code === 'Space' && !wasDown && this.keys[code]) this.jumpCallback();
    }
    handleKeyDown(e) {
        const code = ALIASES[e.code] || e.code;
        if (!GAME_KEYS.has(code) || !this.isActive() || e.target?.closest?.('button,input,select,textarea,[contenteditable]')) return;
        e.preventDefault();
        if (e.repeat) return;
        this.inputMode = 'KEYBOARD';
        this.mouseX = null;
        this.setSource(`key:${e.code}`, code, true);
    }
    handleKeyUp(e) {
        this.setSource(`key:${e.code}`, ALIASES[e.code] || e.code, false);
    }
    attachCanvas(canvas, logicalWidth = 800) {
        this.canvasWidth = logicalWidth;
        const position = e => (e.clientX - canvas.getBoundingClientRect().left) * logicalWidth / canvas.getBoundingClientRect().width;
        this.listen(canvas, 'pointerdown', e => {
            if (!this.isActive() || e.button !== 0) return;
            e.preventDefault();
            canvas.setPointerCapture(e.pointerId);
            this.inputMode = 'MOUSE';
            this.mouseX = position(e);
            this.setSource(`canvas:${e.pointerId}`, 'Space', true);
        });
        this.listen(canvas, 'pointermove', e => {
            if (canvas.hasPointerCapture(e.pointerId)) this.mouseX = position(e);
        });
        const release = e => {
            this.setSource(`canvas:${e.pointerId}`, 'Space', false);
            this.mouseX = null;
        };
        for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) this.listen(canvas, event, release);
    }
    attachControls(left, right, jump, down, sprint) {
        for (const [button, code] of [[left, 'ArrowLeft'], [right, 'ArrowRight'], [jump, 'Space'], [down, 'ArrowDown'], [sprint, 'ShiftLeft']]) {
            if (!button) continue;
            this.listen(button, 'pointerdown', e => {
                if (!this.isActive() || e.button !== 0) return;
                e.preventDefault();
                this.inputMode = 'KEYBOARD';
                this.mouseX = null;
                button.setPointerCapture(e.pointerId);
                this.setSource(`button:${e.pointerId}`, code, true);
            });
            for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                this.listen(button, event, e => this.setSource(`button:${e.pointerId}`, code, false));
            }
            this.listen(button, 'contextmenu', e => e.preventDefault());
        }
    }
    destroy() { this.reset(); this.controller.abort(); }
}
