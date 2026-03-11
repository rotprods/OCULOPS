// ═══════════════════════════════════════════════════
// OCULOPS — ActivityFeed Component
// Real-time live intelligence stream
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import './ActivityFeed.css'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`
  return `${Math.round(diff / 86400000)}d ago`
}

function ActivityFeed({ collapsed = false, maxItems = 20 }) {
  const { events, loading, unreadCount, markRead } = useActivityFeed(maxItems)
  const [expanded, setExpanded] = useState(!collapsed)
  const [newEventFlash, setNewEventFlash] = useState(false)
  const feedRef = useRef(null)
  const prevCountRef = useRef(events.length)

  // Flash on new events
  useEffect(() => {
    if (events.length > prevCountRef.current) {
      setNewEventFlash(true)
      const timer = setTimeout(() => setNewEventFlash(false), 1200)
      prevCountRef.current = events.length
      return () => clearTimeout(timer)
    }
    prevCountRef.current = events.length
  }, [events.length])

  const toggleExpand = () => {
    setExpanded(!expanded)
    if (!expanded) markRead()
  }

  return (
    <div className={`activity-feed ${expanded ? 'activity-feed--expanded' : ''} ${newEventFlash ? 'activity-feed--flash' : ''}`}>
      <button className="activity-feed__header" onClick={toggleExpand}>
        <div className="activity-feed__title">
          <span className="activity-feed__pulse" />
          <span className="mono">LIVE FEED</span>
          {unreadCount > 0 && (
            <span className="activity-feed__badge">{unreadCount}</span>
          )}
        </div>
        <span className="mono activity-feed__toggle">
          {expanded ? '▾' : '▸'} {events.length} EVENTS
        </span>
      </button>

      {expanded && (
        <div className="activity-feed__body" ref={feedRef}>
          {loading && events.length === 0 && (
            <div className="activity-feed__empty mono">LOADING INTELLIGENCE STREAM...</div>
          )}
          {!loading && events.length === 0 && (
            <div className="activity-feed__empty mono">NO EVENTS DETECTED</div>
          )}
          {events.map((event, i) => (
            <div
              key={event.id || i}
              className={`activity-feed__event ${i === 0 && newEventFlash ? 'activity-feed__event--new' : ''}`}
            >
              <span className="activity-feed__icon">{event.icon}</span>
              <div className="activity-feed__content">
                <div className="activity-feed__label" style={{ color: event.color }}>
                  {event.label}
                </div>
                {event.summary && (
                  <div className="activity-feed__summary">{event.summary}</div>
                )}
                {event.source_agent && (
                  <span className="activity-feed__agent">{event.source_agent}</span>
                )}
              </div>
              <span className="activity-feed__time mono">{timeAgo(event.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityFeed
