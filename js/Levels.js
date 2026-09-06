/**
 * Levels.js - Fixed level definitions (v2.27.0)
 *
 * Each level locks a biome and defines metadata for the level-select UI.
 * Procedural generation still drives the actual layout — a level is essentially
 * (biome lock + display name + boss-defeat = cleared).
 *
 * Endless Mode bypasses this entirely (biome is randomized in Game.initGame).
 *
 * To add a new level: append an entry here, then bump LEVELS_VERSION (used to
 * invalidate stale localStorage.unlockedLevels if level IDs change).
 */

export const LEVELS = [
    {
        id: '1-1',
        name: 'World 1-1',
        subtitle: '草原',
        biome: 'PLAINS',
        emoji: '🌳'
    },
    {
        id: '1-2',
        name: 'World 1-2',
        subtitle: '沙漠',
        biome: 'DESERT',
        emoji: '🏜️'
    },
    {
        id: '1-3',
        name: 'World 1-3',
        subtitle: '雪地',
        biome: 'SNOW',
        emoji: '❄️'
    },
    {
        id: '1-4',
        name: 'World 1-4',
        subtitle: '鬼屋',
        biome: 'SPOOKY',
        emoji: '👻'
    }
];

import { idleSave, loadValue } from './saveHelper.js';

export const LEVELS_VERSION = 1;
const STORAGE_KEY = 'marioUnlockedLevels';
const STORAGE_VERSION_KEY = 'marioUnlockedLevelsVersion';

export function getUnlockedLevels() {
    try {
        const storedVersion = parseInt(loadValue(STORAGE_VERSION_KEY) || '0', 10);
        if (storedVersion !== LEVELS_VERSION) {
            // Schema bump — reset to defaults
            idleSave(STORAGE_VERSION_KEY, String(LEVELS_VERSION));
            idleSave(STORAGE_KEY, ['1-1']);
            return ['1-1'];
        }
        const raw = loadValue(STORAGE_KEY);
        if (!raw) return ['1-1'];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['1-1'];
    } catch (e) {
        return ['1-1'];
    }
}

export function unlockLevel(levelId) {
    try {
        const unlocked = getUnlockedLevels();
        if (!unlocked.includes(levelId)) {
            unlocked.push(levelId);
            idleSave(STORAGE_KEY, unlocked);
            idleSave(STORAGE_VERSION_KEY, String(LEVELS_VERSION));
        }
        return unlocked;
    } catch (e) {
        return getUnlockedLevels();
    }
}

export function getNextLevelId(currentId) {
    const idx = LEVELS.findIndex(l => l.id === currentId);
    if (idx < 0 || idx >= LEVELS.length - 1) return null;
    return LEVELS[idx + 1].id;
}

export function getLevelById(levelId) {
    return LEVELS.find(l => l.id === levelId) || null;
}
