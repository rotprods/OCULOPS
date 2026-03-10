// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Notification Center
// Real-time toast notifications from Supabase events
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import './NotificationCenter.css'

let nextId = 1

export function NotificationCenter() {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', icon = '🔔') => {
        const id = nextId++
        setToasts(prev => [...prev, { id, message, type, icon, timestamp: Date.now() }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 5000)
    }, [])

    useEffect(() => {
        if (!supabase) return

        // Subscribe to multiple tables for realtime events
        const subscriptions = [
            { table: 'deals', icon: '💰', messages: { INSERT: 'Nuevo deal creado', UPDATE: 'Deal actualizado', DELETE: 'Deal eliminado' } },
            { table: 'signals', icon: '📡', messages: { INSERT: 'Nueva señal registrada', UPDATE: 'Señal actualizada', DELETE: 'Señal eliminada' } },
            { table: 'tasks', icon: '✅', messages: { INSERT: 'Nueva tarea creada', UPDATE: 'Tarea actualizada', DELETE: 'Tarea eliminada' } },
            { table: 'alerts', icon: '🔔', messages: { INSERT: 'Nueva alerta', UPDATE: 'Alerta actualizada', DELETE: 'Alerta resuelta' } },
            { table: 'automation_runs', icon: '⚙️', messages: { INSERT: 'Workflow lanzado', UPDATE: 'Workflow actualizado', DELETE: 'Workflow eliminado' } },
            { table: 'agent_tasks', icon: '🤖', messages: { INSERT: 'Nueva tarea de agente', UPDATE: 'Tarea de agente actualizada', DELETE: 'Tarea de agente eliminada' } },
            { table: 'agent_studies', icon: '📝', messages: { INSERT: 'Nuevo study generado', UPDATE: 'Study actualizado', DELETE: 'Study eliminado' } },
            { table: 'messages', icon: '💬', messages: { INSERT: 'Nuevo mensaje recibido', UPDATE: 'Mensaje actualizado', DELETE: 'Mensaje eliminado' } },
            { table: 'prospector_leads', icon: '🎯', messages: { INSERT: 'Nuevo lead detectado', UPDATE: 'Lead prospectado actualizado', DELETE: 'Lead eliminado' } },
            { table: 'social_signals', icon: '🌐', messages: { INSERT: 'Nueva señal social', UPDATE: 'Señal social actualizada', DELETE: 'Señal social eliminada' } },
        ]

        const channels = subscriptions.map(sub => {
            return supabase
                .channel(`notify_${sub.table}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: sub.table }, (payload) => {
                    const msg = sub.messages[payload.eventType] || `${sub.table} cambiado`
                    const type = payload.eventType === 'DELETE' ? 'warning' : payload.eventType === 'INSERT' ? 'success' : 'info'
                    addToast(msg, type, sub.icon)
                })
                .subscribe()
        })

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch))
        }
    }, [addToast])

    if (toasts.length === 0) return null

    return (
        <div className="notification-center">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">{toast.icon}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>✕</button>
                </div>
            ))}
        </div>
    )
}
