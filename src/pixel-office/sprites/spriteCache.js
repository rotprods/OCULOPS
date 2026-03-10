// ═══════════════════════════════════════════════════
// Pixel Office — Sprite Cache (off-screen canvas)
// ═══════════════════════════════════════════════════

const zoomCaches = new Map()

/** Render a SpriteData (2D hex array) to an off-screen canvas at given zoom */
export function getCachedSprite(sprite, zoom) {
    let cache = zoomCaches.get(zoom)
    if (!cache) {
        cache = new WeakMap()
        zoomCaches.set(zoom, cache)
    }

    const cached = cache.get(sprite)
    if (cached) return cached

    const rows = sprite.length
    const cols = sprite[0].length
    const canvas = document.createElement('canvas')
    canvas.width = cols * zoom
    canvas.height = rows * zoom
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = sprite[r][c]
            if (color === '') continue
            ctx.fillStyle = color
            ctx.fillRect(c * zoom, r * zoom, zoom, zoom)
        }
    }

    cache.set(sprite, canvas)
    return canvas
}
