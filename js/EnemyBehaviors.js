/**
 * EnemyBehaviors.js — Reusable behavior helpers (v2.33.0)
 *
 * After auditing Enemy.js (1280 lines, 9+ classes), the existing
 * inheritance design is actually clean. The "behavior tree" approach
 * mentioned in the original task plan would be over-engineering for this
 * scale. The actual duplication that's ripe to extract:
 *
 *  1. Ice-crystal overlay drawing — 4 enemy classes copy/pasted same code
 *  2. Player-distance / proximity check — Ghost / Lakitu / HammerBro
 *     each compute it slightly differently
 *
 * These helpers live separately so future enemies (and future refactors of
 * existing ones) can lean on a single tested implementation.
 */

/**
 * Draw the standard ice-crystal overlay used when an enemy is frozen.
 * Caller must already have ctx.translate'd to the enemy center and
 * ctx.scale'd to the desired direction. Caller should ctx.save / restore
 * around this if they want to leave their context untouched.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} radius — circle radius (~enemy halfwidth + a bit)
 * @param {Array<[number, number]>} sparklePositions — 3 ~ 5 [x, y] points relative to center
 */
export function drawFrozenOverlay(ctx, radius = 20, sparklePositions = [[-8, -10], [10, -5], [-5, 8]]) {
    ctx.filter = 'none';

    // Outer ice glow
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // White sparkles
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    for (const [sx, sy] of sparklePositions) {
        ctx.moveTo(sx + 2, sy);
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    }
    ctx.fill();
}

/**
 * Horizontal distance between an enemy's center and the player's center.
 * Returns 0 if either is missing.
 */
export function getPlayerDistance(enemy, player) {
    if (!enemy || !player) return 0;
    const ex = enemy.x + (enemy.width || 0) / 2;
    const px = player.x + (player.width || 0) / 2;
    return Math.abs(px - ex);
}

/**
 * Direction (-1 / 0 / +1) from enemy toward player on the X axis.
 */
export function getPlayerDirection(enemy, player) {
    if (!enemy || !player) return 0;
    const dx = (player.x + (player.width || 0) / 2) - (enemy.x + (enemy.width || 0) / 2);
    return Math.sign(dx);
}

/**
 * Move the enemy toward the player horizontally if within `range`.
 * Returns true if the enemy chased this frame, false otherwise.
 *
 * @param {Object} enemy — must have x, width, direction
 * @param {Object} player — must have x, width
 * @param {number} speed — chase speed (px/frame)
 * @param {number} range — max distance for chase to engage
 */
export function chasePlayerIfNear(enemy, player, speed, range = 400) {
    const dist = getPlayerDistance(enemy, player);
    if (dist > range) return false;
    const dir = getPlayerDirection(enemy, player);
    enemy.x += dir * speed;
    enemy.direction = dir || enemy.direction;
    return true;
}
