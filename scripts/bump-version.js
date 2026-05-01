#!/usr/bin/env node
/**
 * scripts/bump-version.js — single-source version bump (v2.27.1+)
 *
 * Usage:
 *   node scripts/bump-version.js              # auto-bump patch (2.27.1 → 2.27.2)
 *   node scripts/bump-version.js minor        # 2.27.1 → 2.28.0
 *   node scripts/bump-version.js major        # 2.27.1 → 3.0.0
 *   node scripts/bump-version.js 2.30.0       # explicit version
 *   node scripts/bump-version.js 2.30.0 "新增 Boss 戰深度"   # with release notes
 *
 * Updates 4 files atomically:
 *   - js/version.js       (GAME_VERSION constant)
 *   - sw.js               (CACHE_VERSION constant)
 *   - version.json        (version + notes)
 *   - index.html          (?v= query strings on style.css and main.js)
 *
 * Does NOT auto-commit. Run `git diff` to review, then commit manually.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION_JS = path.join(ROOT, 'js', 'version.js');
const SW_JS = path.join(ROOT, 'sw.js');
const VERSION_JSON = path.join(ROOT, 'version.json');
const INDEX_HTML = path.join(ROOT, 'index.html');

function readCurrentVersion() {
    const src = fs.readFileSync(VERSION_JS, 'utf8');
    const m = src.match(/GAME_VERSION\s*=\s*['"]([\d.]+)['"]/);
    if (!m) throw new Error('Cannot parse GAME_VERSION from js/version.js');
    return m[1];
}

function bumpSemver(current, bumpType) {
    const [major, minor, patch] = current.split('.').map(Number);
    if (bumpType === 'major') return `${major + 1}.0.0`;
    if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

function isExplicitVersion(s) {
    return /^\d+\.\d+\.\d+$/.test(s);
}

function replaceInFile(file, regex, replacement) {
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(regex, replacement);
    if (before === after) {
        console.warn(`⚠️  No replacement made in ${path.relative(ROOT, file)} (pattern not found)`);
        return false;
    }
    fs.writeFileSync(file, after);
    return true;
}

function main() {
    const args = process.argv.slice(2);
    const arg0 = args[0];
    const notes = args.slice(1).join(' ');

    const current = readCurrentVersion();
    let next;

    if (!arg0 || arg0 === 'patch') {
        next = bumpSemver(current, 'patch');
    } else if (arg0 === 'minor' || arg0 === 'major') {
        next = bumpSemver(current, arg0);
    } else if (isExplicitVersion(arg0)) {
        next = arg0;
    } else {
        console.error(`✗ Invalid argument: ${arg0}`);
        console.error('  Usage: node scripts/bump-version.js [patch|minor|major|X.Y.Z] [notes]');
        process.exit(1);
    }

    if (next === current) {
        console.error(`✗ Refusing to bump to same version (${current})`);
        process.exit(1);
    }

    console.log(`\n📦 Bumping ${current} → ${next}\n`);

    const results = [];

    // 1. js/version.js
    results.push(['js/version.js', replaceInFile(
        VERSION_JS,
        /GAME_VERSION\s*=\s*['"][\d.]+['"]/,
        `GAME_VERSION = '${next}'`
    )]);

    // 2. sw.js
    results.push(['sw.js', replaceInFile(
        SW_JS,
        /CACHE_VERSION\s*=\s*['"][\d.]+['"]/,
        `CACHE_VERSION = '${next}'`
    )]);

    // 3. version.json
    const json = { version: next };
    if (notes) json.notes = notes;
    fs.writeFileSync(VERSION_JSON, JSON.stringify(json, null, 4) + '\n');
    results.push(['version.json', true]);

    // 4. index.html — bump every ?v= query string
    let html = fs.readFileSync(INDEX_HTML, 'utf8');
    const before = html;
    html = html.replace(/\?v=[\d.]+/g, `?v=${next}`);
    if (html !== before) {
        fs.writeFileSync(INDEX_HTML, html);
        results.push(['index.html', true]);
    } else {
        results.push(['index.html', false]);
    }

    // Summary
    console.log('  Files updated:');
    for (const [name, ok] of results) {
        console.log(`    ${ok ? '✓' : '✗'} ${name}`);
    }
    console.log(`\n✅ Version bumped to ${next}`);
    if (notes) console.log(`📝 Notes: ${notes}`);
    console.log('\nNext steps:');
    console.log('  1. git diff           # review changes');
    console.log('  2. test locally       # node server.js');
    console.log(`  3. git commit -am "v${next}: ..."`);
    console.log('  4. git push');
}

try {
    main();
} catch (err) {
    console.error('\n✗ bump-version failed:', err.message);
    process.exit(1);
}
