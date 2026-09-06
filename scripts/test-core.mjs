import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedStepLoop } from '../js/FixedStepLoop.js';
import { idleSave, loadValue, flushSaves } from '../js/saveHelper.js';
import { getUnlockedLevels, unlockLevel } from '../js/Levels.js';
import { getCourseRecord, saveCourseRecord } from '../js/AdventureCourse.js';
import { InputHandler } from '../js/InputHandler.js';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();

for (const hz of [30, 60, 120, 144]) test(`10 seconds at ${hz} Hz produce 600 physics ticks`, () => {
    let ticks = 0;
    const callbacks = new Map(); let next = 0;
    const loop = new FixedStepLoop(() => ticks++, () => {}, () => true, cb => { callbacks.set(++next, cb); return next; }, id => callbacks.delete(id));
    loop.start(); loop.start();
    assert.equal(callbacks.size, 1);
    for (let i = 0; i <= hz * 10; i++) { const [id, cb] = callbacks.entries().next().value; callbacks.delete(id); cb(i * 1000 / hz); }
    assert.equal(ticks, 600);
    loop.stop(); assert.equal(callbacks.size, 0);
});
test('resume does not catch up hidden time and long frames are bounded', () => {
    let ticks = 0, callback;
    const loop = new FixedStepLoop(() => ticks++, () => {}, () => true, cb => { callback = cb; return 1; }, () => {});
    loop.start(); callback(0); callback(10000); assert.equal(ticks, 6);
    loop.stop(); loop.start(); callback(50000); assert.equal(ticks, 6);
});
test('save reads include queued changes; rapid unlocks are retained', () => {
    idleSave('marioUnlockedLevelsVersion', '1'); idleSave('marioUnlockedLevels', ['1-1']);
    unlockLevel('1-2'); unlockLevel('1-3');
    assert.deepEqual(getUnlockedLevels(), ['1-1', '1-2', '1-3']);
    assert.equal(loadValue('marioUnlockedLevelsVersion'), '1');
    flushSaves(); assert.match(storage.get('marioUnlockedLevels'), /1-3/);
});
test('personal bests never regress and malformed data is safe', () => {
    saveCourseRecord('test', 3, 41); saveCourseRecord('test', 1, 58);
    assert.deepEqual(getCourseRecord('test'), { stars: 3, bestTime: 41, clears: 2 });
    idleSave('marioCourse:bad', '{'); assert.equal(getCourseRecord('bad'), null);
    idleSave('marioCourse:bad', { bestTime: 'oops' }); assert.equal(getCourseRecord('bad'), null);
});
test('keyboard aliases, repeats, blur and paused input', () => {
    let jumps = 0, active = true;
    const input = new InputHandler(() => jumps++, () => active);
    const event = code => ({ code, preventDefault() {} });
    input.handleKeyDown(event('KeyD')); assert.equal(input.keys.ArrowRight, true);
    input.handleKeyDown(event('ArrowRight')); input.handleKeyUp(event('KeyD'));
    assert.equal(input.keys.ArrowRight, true);
    input.handleKeyDown(event('KeyW')); input.handleKeyDown({ ...event('KeyW'), repeat: true }); assert.equal(jumps, 1);
    window.dispatchEvent(new Event('blur')); assert.deepEqual(input.keys, {});
    active = false; input.handleKeyDown(event('Space')); assert.equal(jumps, 1);
    input.destroy();
});
test('multi-touch releases only its own source', () => {
    const input = new InputHandler(() => {});
    input.setSource('button:1', 'ArrowRight', true); input.setSource('button:2', 'Space', true);
    input.setSource('button:1', 'ArrowRight', false);
    assert.equal(input.keys.ArrowRight, false); assert.equal(input.keys.Space, true);
    input.destroy();
});

test('mouse follows without clicking; keyboard locks it until deliberate movement after release', () => {
    let active = true, jumps = 0;
    const input = new InputHandler(() => jumps++, () => active);
    const canvas = new EventTarget();
    canvas.getBoundingClientRect = () => ({ left: 100, width: 400 });
    canvas.hasPointerCapture = () => false;
    canvas.setPointerCapture = () => {};
    input.attachCanvas(canvas, 800);
    const pointer = (target, type, clientX) => target.dispatchEvent(Object.assign(new Event(type), { pointerType: 'mouse', pointerId: 1, clientX, button: 0 }));
    pointer(window, 'pointermove', 150); pointer(window, 'pointermove', 300);
    assert.equal(input.inputMode, 'MOUSE'); assert.equal(input.mouseX, 400); assert.equal(jumps, 0);
    input.handleKeyDown({ code: 'KeyD', preventDefault() {} });
    pointer(window, 'pointermove', 450);
    assert.equal(input.inputMode, 'KEYBOARD'); assert.equal(input.mouseX, null);
    pointer(canvas, 'pointerdown', 450); pointer(canvas, 'pointerup', 450);
    assert.equal(input.inputMode, 'KEYBOARD'); assert.equal(jumps, 1);
    input.handleKeyUp({ code: 'KeyD' });
    pointer(window, 'pointermove', 455);
    assert.equal(input.inputMode, 'KEYBOARD');
    pointer(window, 'pointermove', 420);
    assert.equal(input.inputMode, 'MOUSE'); assert.equal(input.mouseX, 640);
    pointer(canvas, 'pointerdown', 420); pointer(canvas, 'pointerup', 420);
    assert.equal(input.mouseX, 640); assert.equal(jumps, 2);
    active = false; input.reset(); pointer(window, 'pointermove', 200); pointer(window, 'pointermove', 350);
    assert.equal(input.mouseX, null);
    input.destroy();
});
