// ===================================================
// ANTIGRAVITY OS — Creative Studio Module
// Biblioteca de briefs y plantillas de contenido
// ===================================================

import { useState } from 'react'

const BRIEF_TEMPLATES = [
  {
    id: 'chatbot',
    title: 'Setup Chatbot IA',
    category: 'Producto',
    tags: ['IA', 'automatizacion', 'WhatsApp'],
    sections: [
      { label: 'Objetivo', placeholder: 'Automatizar la atencion al cliente 24/7 en WhatsApp' },
      { label: 'Audiencia objetivo', placeholder: 'Clientes actuales que contactan via WhatsApp' },
      { label: 'Tono de voz', placeholder: 'Profesional, cercano, directo' },
      { label: 'Integraciones requeridas', placeholder: 'WhatsApp Cloud API, CRM, n8n' },
      { label: 'KPI de exito', placeholder: '80% de consultas resueltas sin intervencion humana' },
    ]
  },
  {
    id: 'meta-ads',
    title: 'Campana Meta Ads',
    category: 'Marketing',
    tags: ['Meta', 'Facebook', 'Instagram', 'paid'],
    sections: [
      { label: 'Objetivo de campana', placeholder: 'Generacion de leads para clinica estetica' },
      { label: 'Audiencia', placeholder: 'Mujeres 25-45, Madrid, interes en estetica' },
      { label: 'Presupuesto diario', placeholder: '€50/dia durante 30 dias' },
      { label: 'Creatividades necesarias', placeholder: '3 imagenes + 2 videos cortos' },
      { label: 'Mensaje principal', placeholder: 'Primera consulta GRATIS — solo esta semana' },
      { label: 'Metricas objetivo', placeholder: 'CPL < €15, CTR > 2%' },
    ]
  },
  {
    id: 'prospecting',
    title: 'Brief de Prospecting',
    category: 'Ventas',
    tags: ['prospecting', 'outreach', 'B2B'],
    sections: [
      { label: 'Sector objetivo', placeholder: 'Clinicas de estetica en Madrid y Barcelona' },
      { label: 'Tamano de empresa', placeholder: '5-50 empleados, ticket > €3.000/mes' },
      { label: 'Pain points', placeholder: 'Sin presencia digital, atencion manual, sin automatizacion' },
      { label: 'Propuesta de valor', placeholder: 'Automatizar WhatsApp + Meta Ads + CRM en 30 dias' },
      { label: 'Canal de outreach', placeholder: 'LinkedIn + email frio + llamada en 3 pasos' },
    ]
  },
  {
    id: 'content',
    title: 'Estrategia de Contenido',
    category: 'Contenido',
    tags: ['contenido', 'LinkedIn', 'RRSS'],
    sections: [
      { label: 'Pilares de contenido', placeholder: '1. Casos de exito  2. Educacion IA  3. Behind the scenes' },
      { label: 'Frecuencia', placeholder: '3 posts/semana en LinkedIn, 1 newsletter mensual' },
      { label: 'Formato principal', placeholder: 'Carruseles + videos cortos' },
      { label: 'CTA principal', placeholder: 'Reserva llamada de diagnostico gratuita' },
    ]
  },
]

function BriefEditor({ template, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(template.sections.map(s => [s.label, '']))
  )
  const [copied, setCopied] = useState(false)

  const exportBrief = () => {
    const text = [
      `BRIEF: ${template.title}`,
      `Categoria: ${template.category}`,
      `Tags: ${template.tags.join(', ')}`,
      `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
      '='.repeat(40),
      ...template.sections.map(s => `\n${s.label.toUpperCase()}:\n${values[s.label] || '(pendiente)'}`)
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '600px', maxHeight: '80vh', overflow: 'auto', position: 'relative' }}>
        <div className="card-header" style={{ position: 'sticky', top: 0, background: 'var(--color-bg-3)', zIndex: 1 }}>
          <div>
            <div className="card-title">{template.title}</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {template.tags.map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: '10px' }}>{t}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-primary" onClick={exportBrief}>{copied ? 'Copiado' : 'Copiar brief'}</button>
            <button className="btn btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
          {template.sections.map(section => (
            <div key={section.label} className="input-group">
              <label>{section.label}</label>
              <textarea
                className="input"
                rows={3}
                placeholder={section.placeholder}
                value={values[section.label]}
                onChange={e => setValues(v => ({ ...v, [section.label]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CreativeStudio() {
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [filterCat, setFilterCat] = useState('Todos')

  const categories = ['Todos', ...new Set(BRIEF_TEMPLATES.map(t => t.category))]
  const filtered = filterCat === 'Todos' ? BRIEF_TEMPLATES : BRIEF_TEMPLATES.filter(t => t.category === filterCat)

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Creative Studio</h1>
        <p>Biblioteca de briefs y plantillas de contenido para la agencia.</p>
      </div>

      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>📋</div>
          <div className="kpi-value">{BRIEF_TEMPLATES.length}</div>
          <div className="kpi-label">Plantillas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>🗂️</div>
          <div className="kpi-value">{categories.length - 1}</div>
          <div className="kpi-label">Categorias</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>🏷️</div>
          <div className="kpi-value">{[...new Set(BRIEF_TEMPLATES.flatMap(t => t.tags))].length}</div>
          <div className="kpi-label">Tags unicos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-text-2)22', color: 'var(--color-text-2)' }}>📅</div>
          <div className="kpi-value">Pronto</div>
          <div className="kpi-label">Calendario</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Biblioteca de Briefs</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {categories.map(c => (
              <button key={c} className={`btn btn-sm ${filterCat === c ? 'btn-primary' : ''}`} onClick={() => setFilterCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{ gap: '12px' }}>
          {filtered.map(template => (
            <div
              key={template.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => setActiveTemplate(template)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{template.title}</div>
                <span className="badge badge-neutral">{template.category}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {template.tags.map(t => (
                  <span key={t} className="badge" style={{ fontSize: '10px', background: 'var(--color-primary)22', color: 'var(--color-primary)', border: 'none' }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-2)' }}>
                {template.sections.length} secciones
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Calendario de Contenido</div><span className="badge badge-neutral">Proximamente</span></div>
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>Calendario en desarrollo</h3>
          <p>La vista de calendario de contenido se activara en una proxima version.</p>
        </div>
      </div>

      {activeTemplate && (
        <BriefEditor template={activeTemplate} onClose={() => setActiveTemplate(null)} />
      )}
    </div>
  )
}

export default CreativeStudio
