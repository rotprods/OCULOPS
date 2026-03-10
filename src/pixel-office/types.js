// ═══════════════════════════════════════════════════
// Pixel Office — Types & Constants
// Ported from pixel-agents/webview-ui
// ═══════════════════════════════════════════════════

export const TILE_SIZE = 16

export const TileType = {
    WALL: 0, FLOOR_1: 1, FLOOR_2: 2, FLOOR_3: 3,
    FLOOR_4: 4, FLOOR_5: 5, FLOOR_6: 6, FLOOR_7: 7, VOID: 8
}

export const CharacterState = { IDLE: 'idle', WALK: 'walk', TYPE: 'type' }
export const Direction = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 }

// Animation constants
export const WALK_SPEED_PX_PER_SEC = 48
export const WALK_FRAME_DURATION_SEC = 0.15
export const TYPE_FRAME_DURATION_SEC = 0.3
export const WANDER_PAUSE_MIN_SEC = 2.0
export const WANDER_PAUSE_MAX_SEC = 20.0
export const WANDER_MOVES_BEFORE_REST_MIN = 3
export const WANDER_MOVES_BEFORE_REST_MAX = 6
export const SEAT_REST_MIN_SEC = 120.0
export const SEAT_REST_MAX_SEC = 240.0

// Rendering
export const CHARACTER_SITTING_OFFSET_PX = 6
export const CHARACTER_Z_SORT_OFFSET = 0.5
export const MAX_DELTA_TIME_SEC = 0.1
export const FALLBACK_FLOOR_COLOR = '#2a2a3a'

// Zoom
export const ZOOM_MIN = 1
export const ZOOM_MAX = 10
