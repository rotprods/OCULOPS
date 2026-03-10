import { useAppStore } from '../../stores/useAppStore'

const icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' }

function Toast() {
  const toasts = useAppStore(s => s.toasts)
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px',
          background: 'var(--color-bg-3)',
          border: `1px solid ${t.type === 'success' ? 'var(--color-success)' : t.type === 'danger' ? 'var(--color-danger)' : t.type === 'warning' ? 'var(--warning)' : 'var(--border-subtle)'}`,
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          fontSize: '13px',
          color: 'var(--color-text)',
          animation: 'fadeIn 0.2s ease',
          minWidth: '260px',
        }}>
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export default Toast
