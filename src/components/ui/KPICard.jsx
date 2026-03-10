// Props: label, value, change, trend ('up'|'down'|null), prefix='', suffix='', loading=false
export default function KPICard({ label, value, change, trend, prefix = '', suffix = '', loading = false }) {
  if (loading) return <div className="kpi-card skeleton" style={{ height: '100px' }} />
  return (
    <div className="kpi-card stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{prefix}{value}{suffix}</span>
      {change != null && (
        <span className={`stat-change ${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
        </span>
      )}
    </div>
  )
}
