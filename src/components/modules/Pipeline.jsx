// ===================================================
// ANTIGRAVITY OS — Sales Pipeline
// Kanban DnD via @dnd-kit/core + Supabase useDeals
// ===================================================

import { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDeals } from '../../hooks/useDeals'
import { usePipelineStore } from '../../stores/usePipelineStore'
import { Charts } from '../../lib/charts'

// ── Stage config aligned with DB values ──────────────────
const STAGES = [
  { id: 'lead',        label: 'Lead',        color: 'var(--color-text-2)' },
  { id: 'contacted',   label: 'Contactado',  color: 'var(--color-info)' },
  { id: 'meeting',     label: 'Meeting',     color: 'var(--color-primary)' },
  { id: 'proposal',    label: 'Propuesta',   color: '#FF9500' },
  { id: 'closed_won',  label: 'Cerrado',     color: 'var(--color-success)' },
  { id: 'closed_lost', label: 'Perdido',     color: 'var(--color-danger)' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]))

const emptyDeal = { title: '', company: '', value: '', probability: '20', contact_person: '' }

// ── Draggable Deal Card ───────────────────────────────────
function DealCard({ deal, stage, onRemove, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: deal.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    touchAction: 'none',
    padding: '10px',
    marginBottom: '8px',
    borderLeft: `3px solid ${stage?.color || 'var(--color-border)'}`,
    userSelect: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="card"
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
        {deal.title || deal.name || 'Sin nombre'}
      </div>
      {deal.company && (
        <div style={{ fontSize: '11px', color: 'var(--color-text-2)', marginTop: '2px' }}>
          {deal.company?.name || deal.company}
        </div>
      )}
      <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-success)', marginTop: '6px' }}>
        €{(parseFloat(deal.value) || 0).toLocaleString()}
        {deal.probability > 0 && (
          <span style={{ color: 'var(--color-text-2)', marginLeft: '6px' }}>{deal.probability}%</span>
        )}
      </div>
      {deal.contact_person && (
        <div style={{ fontSize: '10px', color: 'var(--color-text-2)', marginTop: '4px' }}>
          {deal.contact_person}
        </div>
      )}
      <button
        className="btn btn-sm btn-danger"
        style={{ marginTop: '8px', fontSize: '10px', padding: '2px 8px' }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onRemove(deal.id) }}
      >
        Eliminar
      </button>
    </div>
  )
}

// ── Overlay card while dragging ───────────────────────────
function DragOverlayCard({ deal }) {
  if (!deal) return null
  const stage = STAGE_MAP[deal.stage]
  return (
    <div
      className="card"
      style={{
        padding: '10px',
        borderLeft: `3px solid ${stage?.color || 'var(--color-primary)'}`,
        width: '180px',
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        transform: 'rotate(2deg)',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700 }}>{deal.title || 'Deal'}</div>
      <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-success)', marginTop: '4px' }}>
        €{(parseFloat(deal.value) || 0).toLocaleString()}
      </div>
    </div>
  )
}

// ── Droppable Column ──────────────────────────────────────
function KanbanColumn({ stage, deals, onRemove, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const stageTotal = deals.reduce((s, d) => s + (parseFloat(d.value) || 0), 0)

  return (
    <div style={{ minWidth: '160px', flex: 1 }}>
      {/* Column header */}
      <div style={{
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
        color: stage.color, marginBottom: '10px', textAlign: 'center',
        padding: '6px 4px', background: 'var(--color-bg-3)', borderRadius: '6px',
        border: `1px solid ${stage.color}33`,
      }}>
        {stage.label} <span style={{ opacity: 0.7 }}>({deals.length})</span>
        {stageTotal > 0 && (
          <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
            €{stageTotal.toLocaleString()}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          minHeight: '120px',
          padding: '6px',
          borderRadius: '8px',
          background: isOver ? `${stage.color}10` : 'transparent',
          border: isOver ? `2px dashed ${stage.color}80` : '2px dashed transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            stage={stage}
            onRemove={onRemove}
            isDragging={deal.id === activeId}
          />
        ))}
        {deals.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--color-text-2)', padding: '20px 8px', opacity: 0.4 }}>
            Arrastra aqui
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
function Pipeline() {
  const { deals, loading, addDeal, updateDeal, removeDeal, pipelineView, totalValue, weightedValue } = useDeals()
  const showClosedLost = usePipelineStore(s => s.showClosedLost)
  const toggleClosedLost = usePipelineStore(s => s.toggleClosedLost)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyDeal)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDeal = useMemo(() => deals.find(d => d.id === activeId), [deals, activeId])

  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), [])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const deal = deals.find(d => d.id === active.id)
    if (!deal || deal.stage === over.id) return
    await updateDeal(active.id, { stage: over.id })
  }, [deals, updateDeal])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await addDeal({
      title: form.title,
      company: form.company,
      value: parseFloat(form.value) || 0,
      probability: parseInt(form.probability) || 20,
      contact_person: form.contact_person,
      stage: 'lead',
    })
    setForm(emptyDeal)
    setShowForm(false)
    setSaving(false)
  }

  const visibleStages = useMemo(
    () => STAGES.filter(s => showClosedLost || s.id !== 'closed_lost'),
    [showClosedLost]
  )

  const funnelData = useMemo(
    () => STAGES.filter(s => s.id !== 'closed_lost').map(s => ({
      label: s.label,
      value: (pipelineView[s.id] || []).length,
    })),
    [pipelineView]
  )

  const closedWon = (pipelineView['closed_won'] || []).length

  if (loading) return (
    <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-2)' }}>
      Cargando pipeline...
    </div>
  )

  return (
    <div className="fade-in">
      <div className="module-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Sales Pipeline</h1>
          <p>{deals.length} deals · {closedWon} cerrados · €{(totalValue || 0).toLocaleString()} valor total</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn btn-sm ${showClosedLost ? 'btn-primary' : ''}`} onClick={toggleClosedLost}>
            {showClosedLost ? 'Ocultar perdidos' : 'Ver perdidos'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancelar' : '+ Nuevo Deal'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="card-header"><div className="card-title">Nuevo Deal</div></div>
          <div className="grid-2" style={{ gap: '12px' }}>
            <div className="input-group"><label>Nombre del deal *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Chatbot para Clinica Lopez" /></div>
            <div className="input-group"><label>Empresa</label><input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Clinica Lopez" /></div>
            <div className="input-group"><label>Valor estimado (€)</label><input className="input" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="3000" /></div>
            <div className="input-group"><label>Probabilidad (%)</label><input className="input" type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} /></div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Contacto</label><input className="input" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Maria Garcia, CEO" /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Deal'}
          </button>
        </div>
      )}

      {/* KPI bar */}
      <div className="grid-3 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>💎</div>
          <div className="kpi-value">{deals.length}</div>
          <div className="kpi-label">Deals totales</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>💰</div>
          <div className="kpi-value">€{(totalValue || 0).toLocaleString()}</div>
          <div className="kpi-label">Valor pipeline</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>⟳</div>
          <div className="kpi-value">€{Math.round(weightedValue || 0).toLocaleString()}</div>
          <div className="kpi-label">Valor ponderado</div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="card mb-6" style={{ overflowX: 'auto' }}>
        <div className="card-header"><div className="card-title">Board — arrastra para mover etapa</div></div>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: '12px', padding: '4px 0 8px', minWidth: 'max-content' }}>
            {visibleStages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={pipelineView[stage.id] || []}
                onRemove={removeDeal}
                activeId={activeId}
              />
            ))}
          </div>
          <DragOverlay>
            <DragOverlayCard deal={activeDeal} />
          </DragOverlay>
        </DndContext>
      </div>

      {/* Funnel chart */}
      <div className="card">
        <div className="card-header"><div className="card-title">Conversion Funnel</div></div>
        <div dangerouslySetInnerHTML={{ __html: Charts.funnel(funnelData) }} />
      </div>
    </div>
  )
}

export default Pipeline
