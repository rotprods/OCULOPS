// /////////////////////////////////////////////////////////////////////////////
// OCULOPS — Flight Deck
// Premium Ivory/Gold theme
// /////////////////////////////////////////////////////////////////////////////

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAgents } from '../../hooks/useAgents'
import {
    SPEED_RANGE, ALTITUDE_RANGE, FLIGHT_PRESETS, AGENT_COMMANDS,
    clamp, normalizeHeading, shortestTurn, altitudeToZoom,
    getBearing, getDistanceKm, formatArea, getLeadColor,
    getInitialPlane, buildOpportunityModel, getNearestHub, formatLogTime,
} from './flightDeckUtils'
import './FlightDeck.css'

const EMPTY_SCAN_RESULTS = []

export default function FlightDeck({
    form: formProp,
    setForm: setFormProp,
    scanResults: scanResultsProp,
    scanning,
    lastScan,
    onScanAirspace,
    onResolveLocation,
    onImportLead,
    onImportAll,
    onStageLeadOutreach,
    crmSyncState,
} = {}) {
    const [internalForm, internalSetForm] = useState({ query: '', radius: 5000, type: 'restaurant' })
    const form = formProp || internalForm
    const setForm = setFormProp || internalSetForm
    const scanResults = scanResultsProp ?? EMPTY_SCAN_RESULTS
    const { triggerAgent, stats } = useAgents()
    const [plane, setPlane] = useState(getInitialPlane)
    const mapNodeRef = useRef(null)
    const mapRef = useRef(null)
    const planeRef = useRef(plane)
    const keysRef = useRef({
        left: false,
        right: false,
        throttleUp: false,
        throttleDown: false,
        climb: false,
        descend: false,
    })
    const leadLayersRef = useRef([])
    const waypointMarkerRef = useRef(null)

    const [selectedLeadId, setSelectedLeadId] = useState(null)
    const [autopilot, setAutopilot] = useState(false)
    const [destination, setDestination] = useState(null)
    const [triggeringAgent, setTriggeringAgent] = useState(null)
    const [missionLog, setMissionLog] = useState(() => ([
        { id: crypto.randomUUID(), tone: 'success', message: 'Flight deck ready. Use WASD or the touch controls to move across the world.', time: formatLogTime(new Date()) },
    ]))

    const activeLead = useMemo(
        () => scanResults.find(lead => lead.id === selectedLeadId) || scanResults[0] || null,
        [scanResults, selectedLeadId]
    )

    const opportunity = useMemo(() => buildOpportunityModel(scanResults), [scanResults])
    const nearestHub = useMemo(() => getNearestHub(plane), [plane])
    const isIntelFresh = lastScan?.search_center
        ? getDistanceKm(plane, lastScan.search_center) <= Math.max((Number(form.radius) || 5000) / 1000 + 4, 6)
        : false
    const airspaceLabel = isIntelFresh
        ? formatArea(lastScan?.area, nearestHub?.name)
        : nearestHub?.name || formatArea(lastScan?.area)

    const addLog = useCallback((message, tone = 'success') => {
        setMissionLog(prev => [
            { id: crypto.randomUUID(), tone, message, time: formatLogTime(new Date()) },
            ...prev,
        ].slice(0, 8))
    }, [])

    const applyPlanePatch = useCallback((patch) => {
        planeRef.current = { ...planeRef.current, ...patch }
        setPlane(planeRef.current)
    }, [])

    const flyToPreset = useCallback((preset) => {
        const nextPlane = {
            lat: preset.lat,
            lng: preset.lng,
            altitude: preset.altitude,
            heading: preset.heading,
            throttle: preset.throttle,
            speed: Math.round(SPEED_RANGE.min + (preset.throttle / 100) * (SPEED_RANGE.max - SPEED_RANGE.min)),
            bank: 0,
        }
        planeRef.current = nextPlane
        setPlane(nextPlane)
        setDestination(null)
        setAutopilot(false)
        addLog(`Dropped into ${preset.name}. Airframe aligned and ready for scan.`)
    }, [addLog])

    const syncToCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            addLog('Geolocation is not available in this browser.', 'warning')
            return
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                applyPlanePatch({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    altitude: 16000,
                    heading: 92,
                    throttle: 44,
                    speed: 430,
                    bank: 0,
                })
                setDestination(null)
                setAutopilot(false)
                addLog('Plane synced to your live position.')
            },
            error => {
                addLog(`Location sync failed: ${error.message}`, 'error')
            },
            { enableHighAccuracy: true, timeout: 8000 }
        )
    }, [addLog, applyPlanePatch])

    const setControlState = useCallback((control, active) => {
        keysRef.current[control] = active
    }, [])

    const nudgePlane = useCallback((patch) => {
        const nextPlane = {
            ...planeRef.current,
            heading: normalizeHeading(planeRef.current.heading + (patch.heading || 0)),
            throttle: clamp(planeRef.current.throttle + (patch.throttle || 0), 0, 100),
            altitude: clamp(planeRef.current.altitude + (patch.altitude || 0), ALTITUDE_RANGE.min, ALTITUDE_RANGE.max),
        }
        const targetSpeed = SPEED_RANGE.min + (nextPlane.throttle / 100) * (SPEED_RANGE.max - SPEED_RANGE.min)
        nextPlane.speed = Math.round(nextPlane.speed + (targetSpeed - nextPlane.speed) * 0.28)
        nextPlane.bank = clamp((patch.heading || 0) * 2.6, -20, 20)
        planeRef.current = nextPlane
        setPlane(nextPlane)
    }, [])

    const handleAirspaceScan = useCallback(async () => {
        const query = form.query?.trim() || 'restaurants'
        addLog(`Scanning ${query} around ${airspaceLabel}.`, 'warning')
        const data = await onScanAirspace({
            query,
            lat: planeRef.current.lat,
            lng: planeRef.current.lng,
            radius: Number(form.radius) || 5000,
        })

        if (data?.error) {
            addLog(`Scan failed: ${data.error}`, 'error')
            return
        }

        if (data?.places?.length) {
            setSelectedLeadId(data.places[0].id)
        }

        addLog(`Airspace mapped: ${data?.places?.length || 0} targets detected over ${formatArea(data?.area, airspaceLabel)}.`)
    }, [addLog, airspaceLabel, form.query, form.radius, onScanAirspace])

    const handleLocationDeploy = useCallback(async () => {
        const location = form.location?.trim()
        if (!location || !onResolveLocation) {
            addLog('Enter a location before deploying the aircraft.', 'warning')
            return
        }

        addLog(`Resolving ${location} through Atlas geospatial search.`, 'warning')
        const data = await onResolveLocation(location)

        if (data?.error || !data?.search_center) {
            addLog(`Location resolve failed: ${data?.error || 'target not found'}`, 'error')
            return
        }

        applyPlanePatch({
            lat: data.search_center.lat,
            lng: data.search_center.lng,
            altitude: 17000,
            bank: 0,
        })
        setDestination(null)
        setAutopilot(false)
        addLog(`Aircraft redeployed over ${formatArea(data.area, location)}.`)
    }, [addLog, applyPlanePatch, form.location, onResolveLocation])

    const handleImportActiveLead = useCallback(async () => {
        if (!activeLead || !onImportLead) {
            addLog('Select a target before syncing it to the CRM.', 'warning')
            return
        }

        const result = await onImportLead(activeLead)
        if (result?.error) {
            addLog(`CRM sync failed for ${activeLead.name}: ${result.error}`, 'error')
            return
        }

        addLog(`${activeLead.name} synced to CRM with contact, company, deal and activity trail.`)
    }, [activeLead, addLog, onImportLead])

    const handleImportAllTargets = useCallback(async () => {
        if (!scanResults.length || !onImportAll) {
            addLog('Run a scan before syncing an airspace into the CRM.', 'warning')
            return
        }

        const result = await onImportAll(scanResults)
        if (!result) return

        if (result.failedCount) {
            addLog(`CRM bulk sync completed: ${result.importedCount} imported, ${result.failedCount} failed.`, 'warning')
            return
        }

        addLog(`CRM bulk sync completed: ${result.importedCount} businesses linked into the pipeline.`)
    }, [addLog, onImportAll, scanResults])

    const handleStageOutreach = useCallback(async (channel) => {
        if (!activeLead || !onStageLeadOutreach) {
            addLog('Select a target before opening an outreach channel.', 'warning')
            return
        }

        const result = await onStageLeadOutreach(activeLead, channel)
        if (result?.error) {
            addLog(`${channel.toUpperCase()} draft failed for ${activeLead.name}: ${result.error}`, 'error')
            return
        }

        addLog(`${channel.toUpperCase()} draft armed for ${activeLead.name}.`, 'success')
    }, [activeLead, addLog, onStageLeadOutreach])

    const dispatchAgent = useCallback(async (code) => {
        setTriggeringAgent(code)
        addLog(`Triggering ${code.toUpperCase()} for ${airspaceLabel}.`, 'warning')

        const payload = {
            lat: Number(planeRef.current.lat.toFixed(6)),
            lng: Number(planeRef.current.lng.toFixed(6)),
            location: airspaceLabel,
            query: form.query?.trim() || 'restaurants',
            radius: Number(form.radius) || 5000,
            source: 'flight_deck',
        }

        const response = await triggerAgent(code, code === 'cortex' ? 'orchestrate' : 'cycle', payload)
        setTriggeringAgent(null)

        if (response?.error) {
            addLog(`${code.toUpperCase()} is offline: ${response.error}`, 'error')
            return
        }

        addLog(`${code.toUpperCase()} accepted the mission payload.`)
    }, [addLog, airspaceLabel, form.query, form.radius, triggerAgent])

    useEffect(() => {
        if (!mapNodeRef.current || mapRef.current) return

        const map = L.map(mapNodeRef.current, {
            center: [planeRef.current.lat, planeRef.current.lng],
            zoom: altitudeToZoom(planeRef.current.altitude),
            zoomControl: true,
            attributionControl: false,
            worldCopyJump: true,
            inertia: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map)

        map.on('click', event => {
            const nextDestination = {
                lat: event.latlng.lat,
                lng: event.latlng.lng,
                label: `${event.latlng.lat.toFixed(3)}, ${event.latlng.lng.toFixed(3)}`,
            }
            setDestination(nextDestination)
            setAutopilot(true)
            addLog(`Waypoint locked at ${nextDestination.label}. Autopilot engaged.`, 'warning')
        })

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [addLog])

    useEffect(() => {
        if (!mapRef.current) return

        mapRef.current.setView(
            [plane.lat, plane.lng],
            altitudeToZoom(plane.altitude),
            { animate: false }
        )
    }, [plane])

    useEffect(() => {
        if (!mapRef.current) return

        if (waypointMarkerRef.current) {
            waypointMarkerRef.current.remove()
            waypointMarkerRef.current = null
        }

        if (!destination) return

        waypointMarkerRef.current = L.marker([destination.lat, destination.lng], {
            icon: L.divIcon({
                className: 'flight-waypoint-marker',
                html: '<div class="flight-waypoint-pin"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            }),
        }).addTo(mapRef.current)
    }, [destination])

    useEffect(() => {
        if (!mapRef.current) return

        leadLayersRef.current.forEach(layer => layer.remove())
        leadLayersRef.current = []

        scanResults.forEach(lead => {
            if (typeof lead.lat !== 'number' || typeof lead.lng !== 'number') return

            const color = getLeadColor(lead)
            const isSelected = lead.id === activeLead?.id
            const halo = L.circleMarker([lead.lat, lead.lng], {
                radius: isSelected ? 15 : 10,
                fillColor: color,
                fillOpacity: isSelected ? 0.24 : 0.14,
                color,
                weight: isSelected ? 2.2 : 1.4,
                opacity: 0.9,
            }).addTo(mapRef.current)

            const core = L.circleMarker([lead.lat, lead.lng], {
                radius: isSelected ? 5 : 4,
                fillColor: color,
                fillOpacity: 1,
                color: '#FAFAF8',
                weight: 1,
                opacity: 0.65,
            }).addTo(mapRef.current)

            halo.bindTooltip(`
                <div style="font-family: Inter, sans-serif; min-width: 190px;">
                    <div style="font-size: 12px; font-weight: 700; margin-bottom: 3px; color: ${color};">${lead.name}</div>
                    <div style="font-size: 10px; color: #6B6B6B; line-height: 1.45;">${lead.address || 'No address available'}</div>
                </div>
            `, {
                direction: 'top',
                offset: [0, -12],
                className: 'ag-tooltip',
            })

            halo.on('click', () => setSelectedLeadId(lead.id))
            core.on('click', () => setSelectedLeadId(lead.id))

            leadLayersRef.current.push(halo, core)
        })
    }, [activeLead?.id, scanResults])

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
                return
            }

            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = true
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = true
            if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.throttleUp = true
            if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keysRef.current.throttleDown = true
            if (event.key.toLowerCase() === 'r') keysRef.current.climb = true
            if (event.key.toLowerCase() === 'f') keysRef.current.descend = true
            if (event.key === ' ') {
                event.preventDefault()
                setAutopilot(prev => !prev)
            }
        }

        const onKeyUp = (event) => {
            if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keysRef.current.left = false
            if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keysRef.current.right = false
            if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keysRef.current.throttleUp = false
            if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keysRef.current.throttleDown = false
            if (event.key.toLowerCase() === 'r') keysRef.current.climb = false
            if (event.key.toLowerCase() === 'f') keysRef.current.descend = false
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [])

    useEffect(() => {
        const interval = window.setInterval(() => {
            const current = planeRef.current
            const next = { ...current }
            let bank = current.bank * 0.74

            if (autopilot && destination) {
                const bearing = getBearing(current, destination)
                const headingDelta = shortestTurn(current.heading, bearing)
                next.heading = normalizeHeading(current.heading + clamp(headingDelta, -4, 4))
                next.throttle = Math.max(current.throttle, 58)
                bank = clamp(headingDelta * 0.4, -18, 18)

                if (getDistanceKm(current, destination) < 1.2) {
                    setDestination(null)
                    setAutopilot(false)
                    addLog(`Waypoint reached over ${destination.label}.`)
                }
            } else {
                if (keysRef.current.left) {
                    next.heading = normalizeHeading(current.heading - 3.1)
                    bank -= 8
                }
                if (keysRef.current.right) {
                    next.heading = normalizeHeading(current.heading + 3.1)
                    bank += 8
                }
                if (keysRef.current.throttleUp) next.throttle = clamp(current.throttle + 1.4, 0, 100)
                if (keysRef.current.throttleDown) next.throttle = clamp(current.throttle - 1.4, 0, 100)
            }

            if (keysRef.current.climb) next.altitude = clamp(current.altitude + 130, ALTITUDE_RANGE.min, ALTITUDE_RANGE.max)
            if (keysRef.current.descend) next.altitude = clamp(current.altitude - 130, ALTITUDE_RANGE.min, ALTITUDE_RANGE.max)

            const targetSpeed = SPEED_RANGE.min + (next.throttle / 100) * (SPEED_RANGE.max - SPEED_RANGE.min)
            next.speed = Math.round(current.speed + (targetSpeed - current.speed) * 0.09)
            next.bank = clamp(bank, -24, 24)

            const tickSeconds = 0.09
            const distanceMeters = next.speed * 0.514444 * tickSeconds
            const headingRad = (next.heading * Math.PI) / 180
            next.lat = current.lat + (Math.cos(headingRad) * distanceMeters) / 111320
            next.lng = current.lng + (Math.sin(headingRad) * distanceMeters) / (111320 * Math.max(Math.cos((current.lat * Math.PI) / 180), 0.2))

            planeRef.current = next
            setPlane(next)
        }, 90)

        return () => window.clearInterval(interval)
    }, [addLog, autopilot, destination])

    useEffect(() => {
        if (!scanResults.length) return
        if (!selectedLeadId || !scanResults.some(lead => lead.id === selectedLeadId)) {
            setSelectedLeadId(scanResults[0].id)
        }
    }, [scanResults, selectedLeadId])

    return (
        <div className="flight-deck">
            <div className="flight-stage">
                <div ref={mapNodeRef} className="flight-map" />
                <div className="flight-scan-grid" />
                <div className="flight-hud-lines" />
                <div className="flight-range-ring" />

                <div
                    className="flight-plane"
                    style={{
                        '--plane-heading': `${plane.heading}deg`,
                        '--plane-bank': `${plane.bank}deg`,
                    }}
                >
                    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M58 10L68 10L74 48L96 59L96 69L74 66L70 110L56 110L51 66L28 69L28 59L51 48L58 10Z" fill="var(--accent-primary)" fillOpacity="0.92" />
                        <path d="M59 17L67 17L71 49L88 57L88 61L70 60L68 101L58 101L55 60L37 61L37 57L54 49L59 17Z" fill="var(--accent-primary)" fillOpacity="0.35" />
                        <path d="M60 0L60 22" stroke="var(--accent-primary)" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
                        <path d="M16 60L104 60" stroke="var(--color-info)" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                <div className="flight-stage-header">
                    <div className="flight-status-pill">
                        <span className="flight-status-dot" />
                        {autopilot && destination ? 'Autopilot' : 'Manual Flight'}
                    </div>

                    <div className="flight-stage-actions">
                        <div className="flight-stage-badge">
                            <span className="flight-stage-label">Airspace</span>
                            <span className="flight-stage-value">{airspaceLabel}</span>
                        </div>
                        <div className="flight-stage-badge">
                            <span className="flight-stage-label">Coordinates</span>
                            <span className="flight-stage-value">
                                {plane.lat.toFixed(4)}, {plane.lng.toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flight-stage-footer">
                    <div className="flight-telemetry-stack">
                        <div className="flight-stage-metric">
                            <span className="flight-stage-label">Speed</span>
                            <span className="flight-stage-value">{plane.speed} kt</span>
                        </div>
                        <div className="flight-stage-metric">
                            <span className="flight-stage-label">Altitude</span>
                            <span className="flight-stage-value">{Math.round(plane.altitude).toLocaleString()} ft</span>
                        </div>
                        <div className="flight-stage-metric">
                            <span className="flight-stage-label">Heading</span>
                            <span className="flight-stage-value">{Math.round(plane.heading)} deg</span>
                        </div>
                    </div>

                    <div className="flight-stage-badge">
                        <span className="flight-stage-label">Flight Controls</span>
                        <span className="flight-stage-value">W/S throttle, A/D turn, R/F climb</span>
                    </div>
                </div>

                <div className="flight-joystick">
                    <button
                        className="flight-stick-btn"
                        data-slot="up"
                        onPointerDown={() => setControlState('throttleUp', true)}
                        onPointerUp={() => setControlState('throttleUp', false)}
                        onPointerLeave={() => setControlState('throttleUp', false)}
                    >
                        +
                    </button>
                    <button
                        className="flight-stick-btn"
                        data-slot="left"
                        onPointerDown={() => setControlState('left', true)}
                        onPointerUp={() => setControlState('left', false)}
                        onPointerLeave={() => setControlState('left', false)}
                    >
                        L
                    </button>
                    <button
                        className="flight-stick-btn"
                        data-slot="center"
                        onClick={() => setAutopilot(prev => !prev)}
                    >
                        {autopilot ? 'AP ON' : 'AP OFF'}
                    </button>
                    <button
                        className="flight-stick-btn"
                        data-slot="right"
                        onPointerDown={() => setControlState('right', true)}
                        onPointerUp={() => setControlState('right', false)}
                        onPointerLeave={() => setControlState('right', false)}
                    >
                        R
                    </button>
                    <button
                        className="flight-stick-btn"
                        data-slot="down"
                        onPointerDown={() => setControlState('throttleDown', true)}
                        onPointerUp={() => setControlState('throttleDown', false)}
                        onPointerLeave={() => setControlState('throttleDown', false)}
                    >
                        -
                    </button>
                </div>
            </div>

            <div className="flight-sidebar">
                <div className="flight-card">
                    <div className="flight-card-header">
                        <div>
                            <div className="flight-card-title">Flight Command</div>
                            <div className="flight-card-subtitle">
                                Fly to any region, scan the businesses directly below the plane, then hand that zone to the agent network.
                            </div>
                        </div>
                        <div className="flight-chip">Live: {stats.online}/{stats.total || 0}</div>
                    </div>

                    <div className="flight-preset-row" style={{ marginBottom: '12px' }}>
                        {FLIGHT_PRESETS.map(preset => (
                            <button key={preset.id} className="flight-preset" onClick={() => flyToPreset(preset)}>
                                {preset.name}
                            </button>
                        ))}
                        <button className="flight-preset" onClick={syncToCurrentLocation}>My Position</button>
                    </div>

                    <div className="flight-fields">
                        <div className="flight-field full">
                            <label>Location Search</label>
                            <input
                                value={form.location}
                                onChange={event => setForm(prev => ({ ...prev, location: event.target.value }))}
                                placeholder="Madrid, Spain or 40.4168, -3.7038"
                            />
                        </div>
                        <div className="flight-field">
                            <label>Target Query</label>
                            <input
                                value={form.query}
                                onChange={event => setForm(prev => ({ ...prev, query: event.target.value }))}
                                placeholder="restaurants, dental clinics, real estate..."
                            />
                        </div>
                        <div className="flight-field">
                            <label>Radius</label>
                            <select
                                value={form.radius}
                                onChange={event => setForm(prev => ({ ...prev, radius: Number(event.target.value) }))}
                            >
                                <option value={1000}>1 km</option>
                                <option value={5000}>5 km</option>
                                <option value={10000}>10 km</option>
                                <option value={25000}>25 km</option>
                                <option value={50000}>50 km</option>
                            </select>
                        </div>
                        <div className="flight-field">
                            <label>Vertical</label>
                            <div className="flight-chip-row">
                                <button className="flight-btn" onClick={() => nudgePlane({ altitude: 1200 })}>Climb</button>
                                <button className="flight-btn" onClick={() => nudgePlane({ altitude: -1200 })}>Descend</button>
                            </div>
                        </div>
                    </div>

                    <div className="flight-action-row">
                        <button className="flight-btn secondary" onClick={handleLocationDeploy}>
                            Deploy To Zone
                        </button>
                        <button className="flight-btn primary" onClick={handleAirspaceScan} disabled={scanning}>
                            {scanning ? 'Scanning Airspace...' : 'Scan Current Airspace'}
                        </button>
                        <button
                            className="flight-btn secondary"
                            onClick={handleImportAllTargets}
                            disabled={crmSyncState?.bulkImporting || scanResults.length === 0}
                        >
                            {crmSyncState?.bulkImporting ? 'Syncing CRM...' : 'Sync All To CRM'}
                        </button>
                        <button className="flight-btn secondary" onClick={() => setAutopilot(prev => !prev)}>
                            {autopilot ? 'Hold Manual' : 'Enable Autopilot'}
                        </button>
                    </div>
                </div>

                <div className="flight-card">
                    <div className="flight-card-header">
                        <div>
                            <div className="flight-card-title">Airspace Intel</div>
                            <div className="flight-card-subtitle">
                                {formatArea(lastScan?.area, airspaceLabel)}
                            </div>
                        </div>
                        <div className="flight-chip">{isIntelFresh ? 'Fresh scan' : 'Needs refresh'}</div>
                    </div>

                    <div className="flight-intel-grid">
                        <div className="flight-metric-box">
                            <div className="metric-label">Opportunity</div>
                            <div className="metric-value">{opportunity.score}/100</div>
                            <div className="metric-note">{opportunity.noWebsite} targets missing a website.</div>
                        </div>
                        <div className="flight-metric-box">
                            <div className="metric-label">Target Count</div>
                            <div className="metric-value">{scanResults.length}</div>
                            <div className="metric-note">{opportunity.premium} premium-quality reviews detected.</div>
                        </div>
                        <div className="flight-metric-box">
                            <div className="metric-label">Avg Rating</div>
                            <div className="metric-value">{opportunity.averageRating}</div>
                            <div className="metric-note">Scan radius {Math.round((Number(form.radius) || 5000) / 1000)} km.</div>
                        </div>
                        <div className="flight-metric-box">
                            <div className="metric-label">Nearest Hub</div>
                            <div className="metric-value">{nearestHub?.name || 'Unknown'}</div>
                            <div className="metric-note">{nearestHub ? `${nearestHub.distanceKm.toFixed(0)} km from current heading.` : 'No hub lock.'}</div>
                        </div>
                    </div>
                </div>

                <div className="flight-card">
                    <div className="flight-card-header">
                        <div>
                            <div className="flight-card-title">Agent Command</div>
                            <div className="flight-card-subtitle">
                                Push the current airspace to prospecting, mapping, or strategy agents.
                            </div>
                        </div>
                    </div>

                    <div className="flight-agent-row">
                        {AGENT_COMMANDS.map(agent => (
                            <button
                                key={agent.code}
                                className="flight-btn agent"
                                onClick={() => dispatchAgent(agent.code)}
                                disabled={triggeringAgent != null}
                            >
                                {triggeringAgent === agent.code ? 'Deploying...' : agent.label}
                            </button>
                        ))}
                    </div>

                    <div className="flight-action-row" style={{ marginTop: '10px' }}>
                        <button
                            className="flight-btn secondary"
                            onClick={() => dispatchAgent('cortex')}
                            disabled={triggeringAgent != null}
                            style={{ width: '100%' }}
                        >
                            {triggeringAgent === 'cortex' ? 'Running CORTEX...' : 'Run Full CORTEX Orchestration'}
                        </button>
                    </div>
                </div>

                <div className="flight-card">
                    <div className="flight-card-header">
                        <div>
                            <div className="flight-card-title">Target Stack</div>
                            <div className="flight-card-subtitle">
                                Select a marker from the map or lead list to inspect the business below the aircraft.
                            </div>
                        </div>
                        <div className="flight-chip">{scanResults.length} live targets</div>
                    </div>

                    <div className="flight-lead-list">
                        {scanResults.length === 0 && (
                            <div className="flight-log-item warning">
                                <div className="flight-log-copy">No targets loaded. Fly somewhere and run an airspace scan.</div>
                            </div>
                        )}
                        {scanResults.slice(0, 8).map(lead => (
                            <div
                                key={lead.id}
                                className={`flight-lead-card ${activeLead?.id === lead.id ? 'active' : ''}`}
                                onClick={() => setSelectedLeadId(lead.id)}
                            >
                                <div className="flight-lead-name">{lead.name}</div>
                                <div className="flight-lead-meta">
                                    <span>{lead.category || 'Unknown category'}</span>
                                    <span>Rating {lead.rating || 'n/a'}</span>
                                    <span>{lead.website ? 'Website live' : 'No website'}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeLead && (
                        <div className="flight-selected">
                            <div className="flight-card-title">{activeLead.name}</div>
                            <div className="flight-card-subtitle">{activeLead.address || 'Address unavailable'}</div>

                            <div className="flight-selected-grid">
                                <div className="flight-selected-item">
                                    <span>Phone</span>
                                    <strong>{activeLead.phone || 'Not detected'}</strong>
                                </div>
                                <div className="flight-selected-item">
                                    <span>Website</span>
                                    <strong>{activeLead.website || 'Missing'}</strong>
                                </div>
                                <div className="flight-selected-item">
                                    <span>Coordinates</span>
                                    <strong>{typeof activeLead.lat === 'number' ? `${activeLead.lat.toFixed(4)}, ${activeLead.lng.toFixed(4)}` : 'Unavailable'}</strong>
                                </div>
                                <div className="flight-selected-item">
                                    <span>Reviews</span>
                                    <strong>{activeLead.review_count || 0}</strong>
                                </div>
                            </div>

                            <div className="flight-selected-actions">
                                <button
                                    className="flight-btn primary"
                                    onClick={handleImportActiveLead}
                                    disabled={crmSyncState?.importingLeadId === activeLead.id}
                                >
                                    {crmSyncState?.importingLeadId === activeLead.id ? 'Syncing...' : 'Import To CRM'}
                                </button>
                                {['email', 'whatsapp', 'linkedin', 'instagram'].map(channel => (
                                    <button
                                        key={channel}
                                        className="flight-btn"
                                        onClick={() => handleStageOutreach(channel)}
                                        disabled={crmSyncState?.stagingKey === `${channel}:${activeLead.id}`}
                                    >
                                        {crmSyncState?.stagingKey === `${channel}:${activeLead.id}`
                                            ? `Opening ${channel}...`
                                            : channel.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flight-card">
                    <div className="flight-card-header">
                        <div>
                            <div className="flight-card-title">Mission Log</div>
                            <div className="flight-card-subtitle">
                                Live execution trace from the cockpit.
                            </div>
                        </div>
                    </div>

                    <div className="flight-log-list">
                        {missionLog.map(entry => (
                            <div key={entry.id} className={`flight-log-item ${entry.tone}`}>
                                <div className="flight-log-copy">{entry.message}</div>
                                <div className="flight-log-time">{entry.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
