// /////////////////////////////////////////////////////////////////////////////
// OCULOPS — Flight Deck Utilities
// Pure functions: math, geo, formatting, presets
// /////////////////////////////////////////////////////////////////////////////

export const SPEED_RANGE = { min: 180, max: 860 }
export const ALTITUDE_RANGE = { min: 2000, max: 38000 }

export const FLIGHT_PRESETS = [
    { id: 'madrid', name: 'Madrid', lat: 40.4168, lng: -3.7038, altitude: 21000, heading: 102, throttle: 54 },
    { id: 'murcia', name: 'Murcia', lat: 37.9922, lng: -1.1307, altitude: 18000, heading: 88, throttle: 48 },
    { id: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, altitude: 24000, heading: 124, throttle: 57 },
    { id: 'new-york', name: 'New York', lat: 40.7128, lng: -74.0060, altitude: 26000, heading: 82, throttle: 62 },
]

export const AGENT_COMMANDS = [
    { code: 'atlas', label: 'ATLAS', hint: 'World intel' },
    { code: 'hunter', label: 'HUNTER', hint: 'Lead extraction' },
    { code: 'strategist', label: 'STRATEGIST', hint: 'Area brief' },
]

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

export function normalizeHeading(value) {
    return (value % 360 + 360) % 360
}

export function shortestTurn(from, to) {
    return ((to - from + 540) % 360) - 180
}

export function altitudeToZoom(altitude) {
    const ratio = (altitude - ALTITUDE_RANGE.min) / (ALTITUDE_RANGE.max - ALTITUDE_RANGE.min)
    return 11.8 - clamp(ratio, 0, 1) * 6.2
}

export function getBearing(origin, destination) {
    const lat1 = (origin.lat * Math.PI) / 180
    const lat2 = (destination.lat * Math.PI) / 180
    const deltaLng = ((destination.lng - origin.lng) * Math.PI) / 180
    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
    return normalizeHeading((Math.atan2(y, x) * 180) / Math.PI)
}

export function getDistanceKm(origin, destination) {
    const earthRadiusKm = 6371
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180
    const lat1 = (origin.lat * Math.PI) / 180
    const lat2 = (destination.lat * Math.PI) / 180
    const hav =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))
}

export function formatArea(area, fallback = 'Unresolved airspace') {
    if (!area) return fallback
    return area.label || area.formatted_address || [area.city, area.region, area.country].filter(Boolean).join(', ') || fallback
}

export function getLeadColor(lead) {
    if (!lead.website) return '#FFD700'
    if ((lead.rating || 0) >= 4.5) return '#34C759'
    if ((lead.rating || 0) >= 4) return '#35B0FF'
    return '#FF9F0A'
}

export function getInitialPlane() {
    const start = FLIGHT_PRESETS[0]
    return {
        lat: start.lat,
        lng: start.lng,
        altitude: start.altitude,
        heading: start.heading,
        throttle: start.throttle,
        speed: Math.round(SPEED_RANGE.min + (start.throttle / 100) * (SPEED_RANGE.max - SPEED_RANGE.min)),
        bank: 0,
    }
}

export function buildOpportunityModel(leads) {
    if (!leads.length) {
        return { score: 0, noWebsite: 0, averageRating: '0.0', premium: 0 }
    }

    const noWebsite = leads.filter(lead => !lead.website).length
    const premium = leads.filter(lead => (lead.rating || 0) >= 4.4).length
    const averageRating = (leads.reduce((sum, lead) => sum + (lead.rating || 0), 0) / leads.length).toFixed(1)
    const score = clamp(Math.round(noWebsite * 12 + premium * 5 + leads.length * 3), 0, 100)

    return { score, noWebsite, averageRating, premium }
}

export function getNearestHub(plane) {
    return FLIGHT_PRESETS.reduce((closest, preset) => {
        const distance = getDistanceKm(plane, preset)
        if (!closest || distance < closest.distanceKm) return { ...preset, distanceKm: distance }
        return closest
    }, null)
}

export function formatLogTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
