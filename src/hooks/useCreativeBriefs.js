import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Seed data — mirrors the old hardcoded BRIEF_TEMPLATES.
// Stored in creative_briefs.variables as { category, sections }.
const BRIEF_SEEDS = [
  {
    name: 'Setup Chatbot IA',
    format: 'copy',
    platform: 'WhatsApp',
    tags: ['IA', 'automatizacion', 'WhatsApp'],
    is_active: true,
    variables: {
      category: 'Producto',
      sections: [
        { label: 'Objetivo', placeholder: 'Automatizar la atencion al cliente 24/7 en WhatsApp' },
        { label: 'Audiencia objetivo', placeholder: 'Clientes actuales' }
      ]
    }
  },
  {
    name: 'Campana Meta Ads',
    format: 'copy',
    platform: 'Meta',
    tags: ['Meta', 'Facebook', 'paid'],
    is_active: true,
    variables: {
      category: 'Marketing',
      sections: [
        { label: 'Objetivo de campana', placeholder: 'Generacion de leads para clinica estetica' }
      ]
    }
  },
  {
    name: 'Brief de Prospecting',
    format: 'copy',
    platform: 'email',
    tags: ['prospecting', 'outreach', 'B2B'],
    is_active: true,
    variables: {
      category: 'Ventas',
      sections: [
        { label: 'Sector objetivo', placeholder: 'Clinicas de estetica en Madrid y Barcelona' }
      ]
    }
  },
  {
    name: 'Estrategia de Contenido',
    format: 'copy',
    platform: 'LinkedIn',
    tags: ['contenido', 'LinkedIn', 'RRSS'],
    is_active: true,
    variables: {
      category: 'Contenido',
      sections: [
        { label: 'Pilares de contenido', placeholder: '1. Casos de exito  2. Educacion IA  3. Behind the scenes' }
      ]
    }
  }
]

// Maps a DB row to the shape BriefEditor expects.
function rowToTemplate(row) {
  return {
    id: row.id,
    title: row.name,
    category: row.variables?.category || 'General',
    tags: row.tags || [],
    sections: row.variables?.sections || []
  }
}

export function useCreativeBriefs() {
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('creative_briefs')
      .select('id, name, tags, variables, is_active')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (!error && data) {
      if (data.length === 0) {
        // First run: seed the table, then reload
        await supabase.from('creative_briefs').insert(BRIEF_SEEDS)
        const { data: seeded } = await supabase
          .from('creative_briefs')
          .select('id, name, tags, variables, is_active')
          .eq('is_active', true)
          .order('usage_count', { ascending: false })
        setBriefs((seeded || []).map(rowToTemplate))
      } else {
        setBriefs(data.map(rowToTemplate))
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Increment usage_count when user opens a brief
  const trackUsage = useCallback(async (id) => {
    await supabase.rpc('increment_brief_usage', { brief_id: id }).catch(() => {
      // rpc may not exist yet — fallback silent
    })
  }, [])

  return { briefs, loading, reload: load, trackUsage }
}
