/**
 * Config.js - Centralized Game Configuration & Constants
 * 
 * All magic numbers and game settings are consolidated here for easy tuning.
 * @version 2.8.0
 */

export const CONFIG = {
    // ===== Physics =====
    PHYSICS: {
        GRAVITY: 0.6,
        FRICTION: 0.9,
        MAX_FALL_SPEED: 12
    },

    // ===== Player Settings =====
    PLAYER: {
        BASE_WIDTH: 30,
        BASE_HEIGHT: 50,
        JUMP_FORCE: -16,
        MAX_SPEED: 3.5,
        ACCELERATION: 0.3,
        MAX_JUMPS: 2,
        COYOTE_FRAMES: 6,

        // Power-ups
        POWER_SCALE: 1.6,
        MEGA_SCALE: 3.0,
        STAR_DURATION: 600,      // 10 seconds at 60fps
        MEGA_DURATION: 600,
        MAGNET_DURATION: 900,    // 15 seconds
        INVINCIBLE_DURATION: 90,

        // Animation
        FRAME_WIDTH: 32,
        FRAME_HEIGHT: 32
    },

    // ===== World Settings =====
    WORLD: {
        GROUND_OFFSET: 50,       // canvas.height - GROUND_OFFSET = GROUND_Y
        CHUNK_SIZE: 2000,
        RENDER_DISTANCE: 2000,
        CLEANUP_MARGIN: 500,
        BIOME_LENGTH: 3000,
        INITIAL_LEVEL_WIDTH: 4000
    },

    // ===== Game Rules =====
    GAME: {
        INITIAL_LIVES: 3,
        MAX_LIVES: 99,
        BOSS_TRIGGER_DISTANCE: 5000,
        DEATH_ANIMATION_MS: 2000,
        RESPAWN_INVINCIBILITY: 120,
        SCORE_POPUP_DURATION: 60
    },

    // ===== UI Settings =====
    UI: {
        BOSS_BAR_WIDTH: 300,
        BOSS_BAR_HEIGHT: 25,
        BOSS_BAR_Y: 50,
        LIVES_POSITION: { x: 15, y: 30 },
        FONT_FAMILY: 'Arial, sans-serif'
    },

    // ===== Audio Settings =====
    AUDIO: {
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_SFX_VOLUME: 0.7
    },

    // ===== Colors =====
    COLORS: {
        BONUS_BG_DEFAULT: '#000000',
        MARIO_RED: '#FF0000',
        MARIO_BLUE: '#1E90FF',
        MARIO_SKIN: '#FFD8B0',
        GOLD: '#FFD700',

        // Biome Colors
        PLAINS: {
            SKY: '#87CEEB',
            GROUND: '#8B4513'
        },
        DESERT: {
            SKY: '#FFE4B5',
            GROUND: '#D2691E'
        },
        SNOW: {
            SKY: '#E0FFFF',
            GROUND: '#FFFAFA'
        },
        HAUNTED: {
            SKY: '#2F2F4F',
            GROUND: '#1A1A2E'
        }
    },

    // ===== Item Spawn Rates =====
    SPAWN_RATES: {
        COIN: 0.3,
        QUESTION_BLOCK: 0.15,
        ENEMY: 0.1,
        PIPE: 0.08,
        CANNON: 0.05
    },

    // ===== Enemy Settings =====
    ENEMIES: {
        GOOMBA: { WIDTH: 30, HEIGHT: 30, SPEED: 1 },
        KOOPA: { WIDTH: 30, HEIGHT: 40, SPEED: 1.5 },
        PIRANHA: { WIDTH: 40, HEIGHT: 60, EMERGE_SPEED: 1 },
        HAMMERBRO: { WIDTH: 35, HEIGHT: 50, THROW_RATE: 90 },
        GHOST: { WIDTH: 40, HEIGHT: 40, SPEED: 1.2 }
    },

    // ===== Transition Settings =====
    TRANSITION: {
        FADE_DURATION: 30,       // Frames for fade in/out
        LIVES_SCREEN_DURATION: 1500  // ms
    }
};

// Helper function for getting ground Y from canvas height
export function getGroundY(canvasHeight) {
    return canvasHeight - CONFIG.WORLD.GROUND_OFFSET;
}
