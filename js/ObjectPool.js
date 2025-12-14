export class ObjectPool {
    constructor(factoryFn, resetFn) {
        this.factoryFn = factoryFn;
        this.resetFn = resetFn;
        this.pool = [];
    }

    get(...args) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factoryFn();
        }

        if (this.resetFn) {
            this.resetFn(obj, ...args);
        }

        return obj;
    }

    release(obj) {
        this.pool.push(obj);
    }

    clear() {
        this.pool = [];
    }
}
