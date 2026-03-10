// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useTasks
// Supabase-connected hook for execution tasks
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useTasks(filters = {}) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('tasks', JSON.parse(filtersKey))
            setTasks(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('tasks', (payload) => {
            if (payload.eventType === 'INSERT') setTasks(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
            else if (payload.eventType === 'DELETE') setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addTask = async (task) => {
        const result = await insertRow('tasks', task)
        if (result) setTasks(prev => [result, ...prev])
        return result
    }

    const updateTask = async (id, updates) => {
        const result = await updateRow('tasks', id, updates)
        if (result) setTasks(prev => prev.map(t => t.id === id ? result : t))
        return result
    }

    const removeTask = async (id) => {
        const success = await deleteRow('tasks', id)
        if (success) setTasks(prev => prev.filter(t => t.id !== id))
        return success
    }

    const byStatus = tasks.reduce((acc, t) => {
        const status = t.status || 'pending'
        if (!acc[status]) acc[status] = []
        acc[status].push(t)
        return acc
    }, {})

    const completionRate = tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0

    const currentDay = tasks.length > 0
        ? Math.max(...tasks.filter(t => t.status === 'done').map(t => t.day || 0), 0)
        : 0

    return { tasks, loading, error, addTask, updateTask, removeTask, reload: load, byStatus, completionRate, currentDay }
}
