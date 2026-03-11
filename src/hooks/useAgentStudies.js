import { useCallback, useEffect, useState } from 'react'
import { fetchAll, insertRow, subscribeDebouncedToTable, supabase, updateRow } from '../lib/supabase'

const BASE = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

async function getAccessToken() {
  if (!supabase) return ANON || null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ANON || null
}

async function invokeStudyDispatch(payload = {}) {
  if (!BASE) throw new Error('Supabase URL not configured')

  const token = await getAccessToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE}/functions/v1/agent-studies`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || `agent-studies failed (${response.status})`)
  }

  return data
}

export function useAgentStudies() {
  const [studies, setStudies] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [studiesData, targetsData] = await Promise.all([
        fetchAll('agent_studies'),
        fetchAll('agent_delivery_targets'),
      ])
      setStudies(studiesData || [])
      setTargets(targetsData || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const channels = [
      subscribeDebouncedToTable('agent_studies', () => load()),
      subscribeDebouncedToTable('agent_delivery_targets', () => load()),
    ]

    return () => {
      channels.forEach(channel => channel?.unsubscribe?.())
    }
  }, [load])

  const telegramTarget = targets.find(target => target.type === 'telegram') || null

  const saveTelegramTarget = useCallback(async (payload) => {
    setBusy('target')
    try {
      const existing = targets.find(target => target.type === 'telegram')
      const row = existing
        ? await updateRow('agent_delivery_targets', existing.id, payload)
        : await insertRow('agent_delivery_targets', {
          type: 'telegram',
          label: 'Primary Telegram',
          ...payload,
        })
      await load()
      return row
    } finally {
      setBusy(null)
    }
  }, [load, targets])

  const postStudy = useCallback(async (payload) => {
    setBusy('study')
    try {
      const result = await invokeStudyDispatch(payload)
      await load()
      return result
    } finally {
      setBusy(null)
    }
  }, [load])

  const resendStudy = useCallback(async (studyId) => {
    setBusy(`resend:${studyId}`)
    try {
      const result = await invokeStudyDispatch({
        action: 'send_existing',
        study_id: studyId,
      })
      await load()
      return result
    } finally {
      setBusy(null)
    }
  }, [load])

  return {
    studies,
    targets,
    telegramTarget,
    loading,
    busy,
    load,
    postStudy,
    resendStudy,
    saveTelegramTarget,
  }
}
