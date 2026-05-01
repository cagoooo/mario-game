/**
 * Rewards.js — Achievement → permanent gameplay buffs (v2.31.0)
 *
 * Each unlocked achievement can grant a permanent passive effect.
 * `buildRewardModifiers(achievementSystem)` reads unlocked state once at
 * game start and returns a flat modifier object that effect sites
 * (Player.js / Enemy.freeze / Game.iceball / AchievementSystem) consult.
 *
 * Adding a new reward:
 *   1. Add an entry below keyed by achievement.id
 *   2. Pick a `type` — buildRewardModifiers maps it into modifier object
 *   3. Wire the effect at the relevant code site (read game.rewards.xxx)
 */

export const ACHIEVEMENT_REWARDS = {
    mega_destroy: {
        type: 'megaDurationMultiplier',
        value: 1.2,
        desc: '巨大化時間 +20%'
    },
    cape_flyer: {
        type: 'glideFallSpeedMultiplier',
        value: 0.8,
        desc: '披風滑翔下降速度 -20%'
    },
    freeze_master: {
        type: 'freezeDurationMultiplier',
        value: 1.3,
        desc: '冰凍時間 +30%'
    },
    streak_10: {
        type: 'streakOneUp',
        value: 10,
        desc: '連踩 10 隻敵人自動 +1UP'
    },
    high_score_5000: {
        type: 'startingScoreBonus',
        value: 500,
        desc: '遊戲開始時 +500 分'
    }
};

const DEFAULTS = {
    megaDurationMultiplier: 1.0,
    glideFallSpeedMultiplier: 1.0,
    freezeDurationMultiplier: 1.0,
    streakOneUpThreshold: Infinity,
    startingScoreBonus: 0
};

export function buildRewardModifiers(achievementSystem) {
    const mods = { ...DEFAULTS };
    if (!achievementSystem) return mods;
    for (const [achId, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
        if (!achievementSystem.isUnlocked(achId)) continue;
        if (reward.type === 'streakOneUp') {
            mods.streakOneUpThreshold = reward.value;
        } else if (reward.type in mods) {
            mods[reward.type] = reward.value;
        }
    }
    return mods;
}

export function getRewardForAchievement(achId) {
    return ACHIEVEMENT_REWARDS[achId] || null;
}
