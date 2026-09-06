// Existing physics use 60 Hz ticks; rendering can run at any refresh rate.
export class FixedStepLoop {
    constructor(update, draw, active, request = callback => requestAnimationFrame(callback), cancel = id => cancelAnimationFrame(id)) {
        Object.assign(this, { update, draw, active, request, cancel });
        this.id = null;
        this.last = null;
        this.accumulator = 0;
        this.step = 1000 / 60;
        this.tick = this.tick.bind(this);
    }
    start() {
        if (this.id !== null) return;
        this.last = null;
        this.accumulator = 0;
        this.id = this.request(this.tick);
    }
    stop() {
        if (this.id !== null) this.cancel(this.id);
        this.id = null;
        this.last = null;
        this.accumulator = 0;
    }
    tick(time) {
        this.id = null;
        if (!this.active()) return;
        if (this.last !== null) this.accumulator += Math.max(0, Math.min(100, time - this.last));
        this.last = time;
        while (this.accumulator + 1e-7 >= this.step && this.active()) {
            this.accumulator -= this.step;
            this.update();
        }
        this.draw();
        if (this.active() && this.id === null) this.id = this.request(this.tick);
    }
}
