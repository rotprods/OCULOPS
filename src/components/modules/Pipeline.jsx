// /////////////////////////////////////////////////////////////////////////////
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ANTIGRAVITY OS — Sales Pipeline (Kanban DnD)
// /////////////////////////////////////////////////////////////////////////////

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
  { id: 'lead', label: 'LEAD', color: 'var(--text-tertiary)' },
  { id: 'contacted', label: 'CONTACTED', color: 'var(--color-info)' },
  { id: 'meeting', label: 'MEETING', color: 'var(--color-primary)' },
  { id: 'proposal', label: 'PROPOSAL', color: 'var(--color-warning)' },
  { id: 'closed_won', label: 'CLOSED WON', color: 'var(--color-success)' },
  { id: 'closed_lost', label: 'CLOSED LOST', color: 'var(--color-danger)' },
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
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid var(--border-subtle)',
    borderLeft: `3px solid ${stage?.color || 'var(--color-border)'}`,
    userSelect: 'none',
    background: 'var(--color-bg-2)',
    borderRadius: '0'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="mono"
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {deal.title || deal.name || '[ UNNAMED ]'}
      </div>
      {deal.company && (
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase' }}>
          {deal.company?.name || deal.company}
        </div>
      )}
      <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '8px' }}>
        EUR {(parseFloat(deal.value) || 0).toLocaleString()}
        {deal.probability > 0 && (
          <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>[ {deal.probability}% P ]</span>
        )}
      </div>
      {deal.contact_person && (
        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px', textTransform: 'uppercase' }}>
          CONTACT: {deal.contact_person}
        </div>
      )}
      <div style={{ marginTop: '12px', textAlign: 'right' }}>
        <button
          style={{
            background: 'transparent',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: '9px',
            padding: '4px 8px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onRemove(deal.id) }}
        >
          [ PURGE ]
        </button>
      </div>
    </div>
  )
}

// ── Overlay card while dragging ───────────────────────────
function DragOverlayCard({ deal }) {
  if (!deal) return null
  const stage = STAGE_MAP[deal.stage]
  return (
    <div
      className="mono"
      style={{
        padding: '12px',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${stage?.color || 'var(--color-primary)'}`,
        width: '200px',
        cursor: 'grabbing',
        background: 'var(--color-bg-2)',
        boxShadow: '0 0 20px rgba(0,0,0,0.8)',
        transform: 'rotate(2deg)',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{deal.title || '[ DEAL ]'}</div>
      <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '6px' }}>
        EUR {(parseFloat(deal.value) || 0).toLocaleString()}
      </div>
    </div>
  )
}

// ── Droppable Column ──────────────────────────────────────
function KanbanColumn({ stage, deals, onRemove, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const stageTotal = deals.reduce((s, d) => s + (parseFloat(d.value) || 0), 0)

  return (
    <div style={{ minWidth: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Column header */}
      <div style={{
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: stage.color,
        marginBottom: '12px',
        textAlign: 'center',
        padding: '8px',
        background: 'var(--color-bg)',
        border: `1px solid var(--border-subtle)`,
        borderTop: `2px solid ${stage.color}`
      }}
        className="mono">
        {stage.label} <span style={{ opacity: 0.7 }}>[ {deals.length} ]</span>
        {stageTotal > 0 && (
          <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
            EUR {stageTotal.toLocaleString()}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: '200px',
          padding: '8px',
          background: isOver ? 'var(--color-bg-2)' : '#000',
          border: isOver ? `1px dashed ${stage.color}` : '1px dashed var(--border-subtle)',
          transition: 'all 0.2s ease',
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
          <div className="mono" style={{ textAlign: 'center', fontSize: '9px', color: 'var(--color-text-2)', padding: '24px 8px', letterSpacing: '0.1em' }}>
            [ AWAITING DEPLOYMENT ]
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
    <div className="fade-in mono" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-primary)', fontSize: '12px', letterSpacing: '0.1em' }}>
      [ INITIALIZING PIPELINE DATASTREAM... ]
    </div>
  )

  return (
    <div className="fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '24px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--text-primary)', fontSize: '28px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PIPELINE ORCHESTRATION</h1>
          <p className="mono font-bold" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px', letterSpacing: '0.1em' }}>
             /// ACTIVE NODES: {deals.length} | YIELD: {closedWon} | VOLUME: EUR {(totalValue || 0).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="mono font-bold"
            style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '10px', padding: '10px 16px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
            onClick={toggleClosedLost}
          >
            {showClosedLost ? '[ HIDE LOST ]' : '[ SHOW LOST ]'}
          </button>
          <button
            className="mono font-bold"
            style={{ background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: '#000', fontSize: '10px', padding: '10px 16px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? '[ ABORT ]' : '[ INTEL CAPTURE ]'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '24px', marginBottom: '24px' }}>
          <div className="mono font-bold text-primary mb-6" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>/// NEW DEAL DIRECTIVE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="mono text-tertiary" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Designation *</label>
              <input style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. ALPHA PROJECT" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="mono text-tertiary" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entity Affiliation</label>
              <input style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="e.g. UNIFIED CORP" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="mono text-tertiary" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asset Value (EUR)</label>
              <input style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="mono text-tertiary" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Success Vector (%)</label>
              <input style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }} type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label className="mono text-tertiary" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Liaison Operative</label>
              <input style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }} value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="e.g. AGENT SMITH" />
            </div>
          </div>
          <button
            className="mono font-bold"
            style={{ marginTop: '24px', background: 'var(--color-primary)', color: '#000', border: 'none', padding: '12px 24px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? '[ TRANSMITTING... ]' : '[ INITIATE DIRECTIVE ]'}
          </button>
        </div>
      )}

      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>[ GLOBAL ENTITIES ]</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-primary)' }}>{deals.length}</div>
        </div>
        <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>[ PIPELINE VOLUME ]</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--text-primary)' }}>EUR {(totalValue || 0).toLocaleString()}</div>
        </div>
        <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '20px' }}>
          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>[ WEIGHTED INDEX ]</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>EUR {Math.round(weightedValue || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ border: '1px solid var(--border-default)', background: '#000', marginBottom: '32px' }}>
        <div className="mono font-bold text-tertiary" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-default)', fontSize: '11px', letterSpacing: '0.1em' }}>
          <span>/// KANBAN MATRIX</span>
          <span>[ DRAG TO REASSIGN ]</span>
        </div>
        <div style={{ padding: '24px', overflowX: 'auto' }}>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content' }}>
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
      </div>

      {/* Funnel chart */}
      <div style={{ border: '1px solid var(--border-default)', background: '#000' }}>
        <div className="mono font-bold text-tertiary" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', fontSize: '11px', letterSpacing: '0.1em' }}>
            /// CONVERSION FLOW
        </div>
        <div style={{ padding: '24px' }}>
          <div dangerouslySetInnerHTML={{ __html: Charts.funnel(funnelData) }} />
        </div>
      </div>
    </div>
  )
}

export default Pipeline
