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
        this.lastMouseClientX = null;
        this.mouseSwitchOrigin = null;
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
        this.mouseSwitchOrigin = this.lastMouseClientX;
        this.setSource(`key:${e.code}`, code, true);
    }
    handleKeyUp(e) {
        this.setSource(`key:${e.code}`, ALIASES[e.code] || e.code, false);
        this.mouseSwitchOrigin = this.lastMouseClientX;
    }
    get keyboardActive() {
        return [...this.sources.keys()].some(source => source.startsWith('key:'));
    }
    attachCanvas(canvas, logicalWidth = 800) {
        this.canvasWidth = logicalWidth;
        const position = e => (e.clientX - canvas.getBoundingClientRect().left) * logicalWidth / canvas.getBoundingClientRect().width;
        this.listen(canvas, 'pointerdown', e => {
            if (!this.isActive() || e.button !== 0) return;
            e.preventDefault();
            canvas.setPointerCapture(e.pointerId);
            if (!this.keyboardActive) {
                this.inputMode = 'MOUSE';
                this.mouseX = position(e);
            }
            this.setSource(`canvas:${e.pointerId}`, 'Space', true);
        });
        this.listen(window, 'pointermove', e => {
            if (e.pointerType === 'mouse') this.lastMouseClientX = e.clientX;
            if (!this.isActive() || this.keyboardActive) return;
            if (e.pointerType === 'mouse' && this.inputMode !== 'MOUSE') {
                this.mouseSwitchOrigin ??= e.clientX;
                if (Math.abs(e.clientX - this.mouseSwitchOrigin) <= 10) return;
            }
            if (e.pointerType === 'mouse' || canvas.hasPointerCapture(e.pointerId)) {
                this.inputMode = 'MOUSE';
                this.mouseX = position(e);
            }
        });
        const release = e => {
            this.setSource(`canvas:${e.pointerId}`, 'Space', false);
            if (e.pointerType !== 'mouse' || e.type === 'pointercancel' || !this.isActive()) this.mouseX = null;
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
