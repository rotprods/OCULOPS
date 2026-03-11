import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

/**
 * KPICard — Metric card with optional trend indicator and icon.
 *
 * @param {string} label - Metric label
 * @param {string|number} value - Display value
 * @param {string} change - Change description (e.g. "+12%")
 * @param {'up'|'down'|null} trend - Trend direction
 * @param {string} prefix - Value prefix (e.g. "€")
 * @param {string} suffix - Value suffix (e.g. "%")
 * @param {React.ComponentType} icon - Heroicon component
 * @param {boolean} loading - Show skeleton
 */
export default function KPICard({ label, value, change, trend, prefix = '', suffix = '', icon: IconComponent, loading = false }) {
  if (loading) return <div className="kpi-card skeleton" style={{ height: 100 }} />

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {IconComponent && <IconComponent className="kpi-icon" />}
      </div>
      <div className="kpi-value">{prefix}{value}{suffix}</div>
      {change != null && (
        <div className={`kpi-change ${trend === 'up' ? 'kpi-change--up' : trend === 'down' ? 'kpi-change--down' : ''}`}>
          {trend === 'up' && <ArrowTrendingUpIcon width={14} height={14} />}
          {trend === 'down' && <ArrowTrendingDownIcon width={14} height={14} />}
          <span>{change}</span>
        </div>
      )}
    </div>
  )
}
