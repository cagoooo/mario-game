import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scope = 'https://example.test/mario-game/';
function worker() {
    const handlers = {}, stores = new Map(); let offline = false, skipped = 0;
    const key = req => typeof req === 'string' ? new URL(req, scope).href : req.url;
    const fetch = async req => {
        if (offline) throw new Error('offline');
        const file = new URL(key(req)).pathname.replace('/mario-game/', '') || 'index.html';
        const target = path.join(root, file);
        return new Response(fs.readFileSync(target), { status: 200 });
    };
    const caches = {
        async open(name) {
            if (!stores.has(name)) stores.set(name, new Map());
            const data = stores.get(name);
            return { async addAll(urls) { assert.equal(new Set(urls.map(key)).size, urls.length, 'Cache.addAll rejects duplicate request keys'); for (const url of urls) data.set(key(url), await fetch(url)); }, async match(req) { return data.get(key(req))?.clone(); }, async put(req, res) { data.set(key(req), res); } };
        },
        async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); }
    };
    const self = { registration: { scope }, location: { origin:'https://example.test' }, clients: { async claim() {} }, skipWaiting() { skipped++; }, addEventListener(type, fn) { handlers[type] = fn; } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), { self, caches, fetch, URL, console });
    return { stores, handlers, offline: () => offline = true, skipped: () => skipped, async event(name) { let wait; handlers[name]({ waitUntil(p) { wait = p; } }); await wait; }, async request(url, mode = 'cors') { let result; handlers.fetch({ request: { url:new URL(url,scope).href, method:'GET', mode }, respondWith(p) { result = p; } }); return result; } };
}
test('all precache files exist, and every import-map module is available offline', async () => {
    const w = worker(); await w.event('install'); w.offline();
    const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
    const map = JSON.parse(html.match(/id="game-imports">(.*?)<\/script>/)[1]);
    for (const url of Object.values(map.imports)) assert.equal((await w.request(url)).status, 200, url);
    assert.equal(w.skipped(), 0, 'install must wait for user update choice');
});
test('first offline navigation falls back to precached HTML', async () => {
    const w = worker(); await w.event('install'); w.offline();
    const response = await w.request('./?pwa=1', 'navigate');
    assert.match(await response.text(), /game-imports/);
});
test('activation preserves unrelated caches; update message activates waiting worker', async () => {
    const w = worker(); w.stores.set('school-other-app',new Map()); w.stores.set('mario-static-v1',new Map());
    await w.event('install'); await w.event('activate');
    assert.equal(w.stores.has('school-other-app'), true); assert.equal(w.stores.has('mario-static-v1'), false);
    w.handlers.message({ data: { type:'SKIP_WAITING' } }); assert.equal(w.skipped(), 1);
});
test('version polling does not grow caches, requests outside scope pass through', async () => {
    const w = worker(); await w.event('install');
    await w.request('version.json?t=1'); await w.request('version.json?t=2');
    const keys = [...w.stores.values()].flatMap(m => [...m.keys()]);
    assert.equal(keys.some(k => k.includes('version.json?t=')), false);
    assert.equal(await w.request('https://example.test/another-app/main.js'), undefined);
});
