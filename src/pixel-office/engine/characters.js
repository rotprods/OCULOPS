// ═══════════════════════════════════════════════════
// Pixel Office — Character State Machine
// ═══════════════════════════════════════════════════

import {
    CharacterState, Direction, TILE_SIZE,
    WALK_SPEED_PX_PER_SEC, WALK_FRAME_DURATION_SEC, TYPE_FRAME_DURATION_SEC,
    WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC,
    WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX,
    SEAT_REST_MIN_SEC, SEAT_REST_MAX_SEC,
} from '../types.js'
import { findPath } from './tileMap.js'

function randomRange(min, max) { return min + Math.random() * (max - min) }
function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)) }
function tileCenter(col, row) { return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 } }

function directionBetween(fromCol, fromRow, toCol, toRow) {
    const dc = toCol - fromCol, dr = toRow - fromRow
    if (dc > 0) return Direction.RIGHT
    if (dc < 0) return Direction.LEFT
    if (dr > 0) return Direction.DOWN
    return Direction.UP
}

export function createCharacter(id, palette, seatId, seat, hueShift = 0) {
    const col = seat ? seat.seatCol : 1
    const row = seat ? seat.seatRow : 1
    const center = tileCenter(col, row)
    return {
        id, state: CharacterState.TYPE, dir: seat ? seat.facingDir : Direction.DOWN,
        x: center.x, y: center.y, tileCol: col, tileRow: row,
        path: [], moveProgress: 0, currentTool: null, palette, hueShift,
        frame: 0, frameTimer: 0, wanderTimer: 0, wanderCount: 0,
        wanderLimit: randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX),
        isActive: true, seatId, bubbleType: null, bubbleTimer: 0, seatTimer: 0,
        isSubagent: false, parentAgentId: null, matrixEffect: null, matrixEffectTimer: 0,
        matrixEffectSeeds: [],
    }
}

export function updateCharacter(ch, dt, walkableTiles, seats, tileMap, blockedTiles) {
    ch.frameTimer += dt
    switch (ch.state) {
        case CharacterState.TYPE: {
            if (ch.frameTimer >= TYPE_FRAME_DURATION_SEC) {
                ch.frameTimer -= TYPE_FRAME_DURATION_SEC
                ch.frame = (ch.frame + 1) % 2
            }
            if (!ch.isActive) {
                if (ch.seatTimer > 0) { ch.seatTimer -= dt; break }
                ch.seatTimer = 0
                ch.state = CharacterState.IDLE; ch.frame = 0; ch.frameTimer = 0
                ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC)
                ch.wanderCount = 0
                ch.wanderLimit = randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX)
            }
            break
        }
        case CharacterState.IDLE: {
            ch.frame = 0
            if (ch.seatTimer < 0) ch.seatTimer = 0
            if (ch.isActive) {
                if (!ch.seatId) { ch.state = CharacterState.TYPE; ch.frame = 0; ch.frameTimer = 0; break }
                const seat = seats.get(ch.seatId)
                if (seat) {
                    const path = findPath(ch.tileCol, ch.tileRow, seat.seatCol, seat.seatRow, tileMap, blockedTiles)
                    if (path.length > 0) {
                        ch.path = path; ch.moveProgress = 0; ch.state = CharacterState.WALK; ch.frame = 0; ch.frameTimer = 0
                    } else {
                        ch.state = CharacterState.TYPE; ch.dir = seat.facingDir; ch.frame = 0; ch.frameTimer = 0
                    }
                }
                break
            }
            ch.wanderTimer -= dt
            if (ch.wanderTimer <= 0) {
                if (ch.wanderCount >= ch.wanderLimit && ch.seatId) {
                    const seat = seats.get(ch.seatId)
                    if (seat) {
                        const path = findPath(ch.tileCol, ch.tileRow, seat.seatCol, seat.seatRow, tileMap, blockedTiles)
                        if (path.length > 0) { ch.path = path; ch.moveProgress = 0; ch.state = CharacterState.WALK; ch.frame = 0; ch.frameTimer = 0; break }
                    }
                }
                if (walkableTiles.length > 0) {
                    const target = walkableTiles[Math.floor(Math.random() * walkableTiles.length)]
                    const path = findPath(ch.tileCol, ch.tileRow, target.col, target.row, tileMap, blockedTiles)
                    if (path.length > 0) { ch.path = path; ch.moveProgress = 0; ch.state = CharacterState.WALK; ch.frame = 0; ch.frameTimer = 0; ch.wanderCount++ }
                }
                ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC)
            }
            break
        }
        case CharacterState.WALK: {
            if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) { ch.frameTimer -= WALK_FRAME_DURATION_SEC; ch.frame = (ch.frame + 1) % 4 }
            if (ch.path.length === 0) {
                const center = tileCenter(ch.tileCol, ch.tileRow); ch.x = center.x; ch.y = center.y
                if (ch.isActive) {
                    if (!ch.seatId) { ch.state = CharacterState.TYPE }
                    else {
                        const seat = seats.get(ch.seatId)
                        if (seat && ch.tileCol === seat.seatCol && ch.tileRow === seat.seatRow) { ch.state = CharacterState.TYPE; ch.dir = seat.facingDir }
                        else ch.state = CharacterState.IDLE
                    }
                } else {
                    if (ch.seatId) {
                        const seat = seats.get(ch.seatId)
                        if (seat && ch.tileCol === seat.seatCol && ch.tileRow === seat.seatRow) {
                            ch.state = CharacterState.TYPE; ch.dir = seat.facingDir
                            if (ch.seatTimer < 0) ch.seatTimer = 0
                            else ch.seatTimer = randomRange(SEAT_REST_MIN_SEC, SEAT_REST_MAX_SEC)
                            ch.wanderCount = 0; ch.wanderLimit = randomInt(WANDER_MOVES_BEFORE_REST_MIN, WANDER_MOVES_BEFORE_REST_MAX)
                            ch.frame = 0; ch.frameTimer = 0; break
                        }
                    }
                    ch.state = CharacterState.IDLE; ch.wanderTimer = randomRange(WANDER_PAUSE_MIN_SEC, WANDER_PAUSE_MAX_SEC)
                }
                ch.frame = 0; ch.frameTimer = 0; break
            }
            const nextTile = ch.path[0]
            ch.dir = directionBetween(ch.tileCol, ch.tileRow, nextTile.col, nextTile.row)
            ch.moveProgress += (WALK_SPEED_PX_PER_SEC / TILE_SIZE) * dt
            const fromCenter = tileCenter(ch.tileCol, ch.tileRow)
            const toCenter = tileCenter(nextTile.col, nextTile.row)
            const t = Math.min(ch.moveProgress, 1)
            ch.x = fromCenter.x + (toCenter.x - fromCenter.x) * t
            ch.y = fromCenter.y + (toCenter.y - fromCenter.y) * t
            if (ch.moveProgress >= 1) {
                ch.tileCol = nextTile.col; ch.tileRow = nextTile.row
                ch.x = toCenter.x; ch.y = toCenter.y; ch.path.shift(); ch.moveProgress = 0
            }
            if (ch.isActive && ch.seatId) {
                const seat = seats.get(ch.seatId)
                if (seat) {
                    const lastStep = ch.path[ch.path.length - 1]
                    if (!lastStep || lastStep.col !== seat.seatCol || lastStep.row !== seat.seatRow) {
                        const newPath = findPath(ch.tileCol, ch.tileRow, seat.seatCol, seat.seatRow, tileMap, blockedTiles)
                        if (newPath.length > 0) { ch.path = newPath; ch.moveProgress = 0 }
                    }
                }
            }
            break
        }
    }
}

export function getCharacterSprite(ch, sprites) {
    switch (ch.state) {
        case CharacterState.TYPE: return sprites.typing[ch.dir][ch.frame % 2]
        case CharacterState.WALK: return sprites.walk[ch.dir][ch.frame % 4]
        case CharacterState.IDLE: return sprites.walk[ch.dir][1]
        default: return sprites.walk[ch.dir][1]
    }
}
