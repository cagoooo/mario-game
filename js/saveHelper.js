/**
 * saveHelper.js — Coalesced, idle-scheduled localStorage writes (v2.32.0)
 *
 * Why: localStorage.setItem is sync I/O — calling it during a frame can drop
 * frames. We coalesce multiple writes per key, defer to requestIdleCallback,
 * and force-flush on tab hide / pause so nothing is lost.
 *
 * Reads stay sync (cheap and infrequent). Writes go through idleSave().
 *
 * Public API:
 *   idleSave(key, value)  → schedule a write (newest value wins per key)
 *   flushSaves()          → write pending values immediately (synchronous)
 *   loadValue(key)        → sync read (just sugar around getItem)
 *
 * Wire-up:
 *   - main.js installs visibilitychange + pagehide → flushSaves()
 *   - Game.pause() also calls flushSaves() for safety
 */

const pending = new Map();  // key → string value
let scheduled = false;

const RIC = (typeof requestIdleCallback === 'function')
    ? requestIdleCallback
    : (cb) => setTimeout(() => cb({ timeRemaining: () => 50, didTimeout: false }), 0);

function flushSync() {
    if (pending.size === 0) {
        scheduled = false;
        return;
    }
    for (const [key, value] of pending) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('[saveHelper] localStorage.setItem failed:', key, e);
        }
    }
    pending.clear();
    scheduled = false;
}

export function idleSave(key, value) {
    // Stringify if not already a string
    const v = (typeof value === 'string') ? value : JSON.stringify(value);
    pending.set(key, v);
    if (scheduled) return;
    scheduled = true;
    RIC(flushSync, { timeout: 2000 });
}

export function flushSaves() {
    flushSync();
}

export function loadValue(key) {
    try {
        return pending.has(key) ? pending.get(key) : localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}
