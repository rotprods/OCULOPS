// ===================================================
// ANTIGRAVITY OS — Automation Zone
// Manual and event-driven workflows stored in Supabase
// ===================================================

import { useMemo, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import { useAutomation } from '../../hooks/useAutomation'
import { AGENT_AUTOMATION_PACKS } from '../../data/agentAutomationPacks'
import { CORE_MINI_APPS } from '../miniapps/MiniAppRegistry'

const TRIGGERS = [
    { key: 'atlas_import', icon: '✈️', label: 'Atlas importa lead', type: 'event' },
    { key: 'manual', icon: '🖱️', label: 'Manual', type: 'manual' },
    { key: 'message_in', icon: '💬', label: 'Mensaje entrante', type: 'event' },
    { key: 'schedule', icon: '⏰', label: 'Programado', type: 'time' },
    { key: 'webhook', icon: '🔗', label: 'Webhook externo', type: 'webhook' },
]

const ACTIONS = [
    { key: 'compose_message', icon: '📤', label: 'Preparar mensaje' },
    { key: 'create_deal', icon: '💎', label: 'Crear deal' },
    { key: 'update_contact', icon: '✏️', label: 'Actualizar contacto' },
    { key: 'notify', icon: '🔔', label: 'Notificación' },
    { key: 'run_connector', icon: '🕸️', label: 'Ejecutar connector' },
    { key: 'run_api', icon: '⚡', label: 'Ejecutar API live' },
    { key: 'run_agent', icon: '🤖', label: 'Lanzar AI agent' },
    { key: 'launch_n8n', icon: '🔁', label: 'Plantilla n8n' },
    { key: 'crm_activity', icon: '📋', label: 'Registrar actividad' },
]

const TEMPLATES = [
    {
        name: 'Atlas Gmail Outreach',
        trigger: 'atlas_import',
        actions: ['compose_message', 'crm_activity'],
        desc: 'Al importar un lead desde Atlas, deja preparado el email y registra la actividad.',
    },
    {
        name: 'Social Follow-up',
        trigger: 'manual',
        actions: ['compose_message', 'notify'],
        desc: 'Flujo manual para lanzar seguimiento por LinkedIn o Instagram.',
    },
    {
        name: 'Lead to Deal',
        trigger: 'atlas_import',
        actions: ['create_deal', 'update_contact', 'crm_activity'],
        desc: 'Convierte la importación de Atlas en deal y actualiza el contacto automáticamente.',
    },
]

function getTriggerMeta(key) {
    return TRIGGERS.find(trigger => trigger.key === key) || TRIGGERS[0]
}

function getActionMeta(key) {
    return ACTIONS.find(action => action.key === key) || ACTIONS[0]
}

function formatWorkflowRunDate(value) {
    if (!value) return 'Sin ejecuciones'
    return new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function unique(values) {
    return [...new Set(values)]
}

function uniqueBy(items, keySelector) {
    const map = new Map()
    items.forEach(item => {
        const key = keySelector(item)
        if (!map.has(key)) map.set(key, item)
    })
    return [...map.values()]
}

function workflowSupportsLiveSend(workflow) {
    return (workflow.steps || []).some(step => step?.type === 'compose_message' && ['email', 'whatsapp'].includes(step?.config?.channel))
}

function Automation() {
    const { toast } = useAppStore()
    const { installedApps } = useApiCatalog()
    const { workflows, runs, loading, runningWorkflowId, addWorkflow, toggleWorkflow, removeWorkflow, runWorkflow, loadRuns, activeCount, totalRuns } = useAutomation()
    const liveConnectorApps = installedApps.filter(app => app.runMode === 'connector_proxy' && app.connectorStatus === 'live')
    const liveApiApps = useMemo(
        () => CORE_MINI_APPS.filter(app => app.runMode === 'edge_function' && app.status !== 'planned'),
        []
    )
    const agentOptions = useMemo(
        () => unique([
            ...liveApiApps.flatMap(app => app.agentTargets || []),
            ...AGENT_AUTOMATION_PACKS.map(pack => pack.agentCodeName),
        ]),
        [liveApiApps]
    )
    const n8nOptions = useMemo(
        () => uniqueBy([
            ...liveApiApps.flatMap(app => (app.n8nTemplates || []).map(template => ({
                value: template,
                label: template,
                pageUrl: null,
                downloadUrl: null,
                source: 'product_registry',
            }))),
            ...AGENT_AUTOMATION_PACKS.flatMap(pack => pack.templates.map(template => ({
                value: String(template.id),
                label: `#${template.id} · ${template.name}`,
                pageUrl: template.pageUrl,
                downloadUrl: template.downloadUrl,
                source: pack.agentCodeName,
            }))),
        ], item => item.value),
        [liveApiApps]
    )
    const templateLookup = useMemo(
        () => Object.fromEntries(n8nOptions.map(option => [option.value, option])),
        [n8nOptions]
    )
    const defaultForm = {
        name: '',
        description: '',
        trigger: 'atlas_import',
        actions: [],
        connectorId: '',
        apiId: '',
        agentCodeName: '',
        workflowTemplate: '',
    }

    const [showForm, setShowForm] = useState(false)
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)
    const [form, setForm] = useState(defaultForm)

    const selectedWorkflow = useMemo(
        () => workflows.find(workflow => workflow.id === selectedWorkflowId) || null,
        [selectedWorkflowId, workflows]
    )

    const toggleAction = (key) => {
        setForm(current => {
            const actions = current.actions.includes(key)
                ? current.actions.filter(action => action !== key)
                : [...current.actions, key]

            return {
                ...current,
                actions,
                connectorId: actions.includes('run_connector') ? current.connectorId : '',
                apiId: actions.includes('run_api') ? current.apiId : '',
                agentCodeName: actions.includes('run_agent') ? current.agentCodeName : '',
                workflowTemplate: actions.includes('launch_n8n') ? current.workflowTemplate : '',
            }
        })
    }

    const addNewWorkflow = async () => {
        if (!form.name.trim()) return toast('Nombre requerido', 'warning')
        if (form.actions.length === 0) return toast('Añade al menos una acción', 'warning')
        if (form.actions.includes('run_connector') && !form.connectorId) return toast('Selecciona un connector live', 'warning')
        if (form.actions.includes('run_api') && !form.apiId) return toast('Selecciona una API live', 'warning')
        if (form.actions.includes('run_agent') && !form.agentCodeName) return toast('Selecciona un AI agent', 'warning')
        if (form.actions.includes('launch_n8n') && !form.workflowTemplate) return toast('Selecciona una plantilla n8n', 'warning')

        const selectedApi = liveApiApps.find(app => app.id === form.apiId) || null
        const selectedTemplate = templateLookup[form.workflowTemplate] || null

        const trigger = getTriggerMeta(form.trigger)
        const workflow = await addWorkflow({
            name: form.name.trim(),
            description: form.description || null,
            trigger_type: trigger.type,
            trigger_config: {
                key: trigger.key,
                label: trigger.label,
                connectorId: form.connectorId || null,
            },
            metadata: {
                agent_code_name: form.agentCodeName || null,
                n8n_template_id: form.workflowTemplate || null,
            },
            steps: form.actions.map((action, index) => ({
                id: `step-${index + 1}`,
                type: action,
                config: action === 'run_connector'
                    ? { connectorId: form.connectorId }
                    : action === 'run_api'
                        ? {
                            apiId: form.apiId,
                            endpoint: selectedApi?.endpoint || null,
                            label: selectedApi?.name || null,
                            payload: selectedApi?.healthcheckPayload || {},
                        }
                        : action === 'run_agent'
                            ? { agentCodeName: form.agentCodeName, action: 'cycle' }
                            : action === 'launch_n8n'
                                ? {
                                    agentCodeName: form.agentCodeName || null,
                                    workflowTemplate: form.workflowTemplate,
                                    workflowTemplateLabel: selectedTemplate?.label || form.workflowTemplate,
                                    workflowTemplateUrl: selectedTemplate?.pageUrl || null,
                                    workflowTemplateDownloadUrl: selectedTemplate?.downloadUrl || null,
                                    workflowTemplateSource: selectedTemplate?.source || null,
                                }
                                : {},
            })),
            is_active: false,
        })

        if (!workflow) return toast('No se pudo crear el workflow', 'warning')

        setForm(defaultForm)
        setShowForm(false)
        toast('Workflow creado', 'success')
    }

    const selectWorkflow = async (workflow) => {
        setSelectedWorkflowId(workflow.id)
        await loadRuns(workflow.id)
    }

    const openWorkflowDraft = (workflow) => {
        const draftStep = (workflow.steps || []).find(step => step?.config?.launch_url)
        if (!draftStep?.config?.launch_url) return toast('Este workflow no tiene un canal de lanzamiento', 'warning')
        window.open(draftStep.config.launch_url, '_blank', 'noopener,noreferrer')
    }

    const executeWorkflow = async (workflow, { sendLive = false } = {}) => {
        if (!workflow?.id) return

        const result = await runWorkflow(workflow.id, {
            sendLive,
            context: {
                workflow_name: workflow.name,
            },
        })

        if (result?.error) {
            return toast(result.error, 'warning')
        }

        await loadRuns(workflow.id)
        toast(
            sendLive
                ? `Workflow ejecutado con envío live: ${workflow.name}`
                : `Workflow ejecutado: ${workflow.name}`,
            'success'
        )
    }

    const seedAgentPack = (pack) => {
        setForm({
            ...defaultForm,
            name: `${pack.label} Loop`,
            description: pack.objective,
            trigger: pack.defaultTrigger,
            actions: pack.defaultActions,
            agentCodeName: pack.agentCodeName,
            workflowTemplate: pack.templates[0] ? String(pack.templates[0].id) : '',
        })
        setShowForm(true)
    }

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Automation Zone</h1>
                <p>Workflows conectados con APIs live, agentes internos, n8n y entrega móvil de resultados.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>⚡</div><div className="kpi-value">{activeCount}</div><div className="kpi-label">Workflows Activos</div></div>
                <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>🔄</div><div className="kpi-value">{totalRuns}</div><div className="kpi-label">Ejecuciones Totales</div></div>
                <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>📋</div><div className="kpi-value">{workflows.length}</div><div className="kpi-label">Total Workflows</div></div>
            </div>

            <div className="card mb-6">
                <div className="card-header"><div className="card-title">📄 Plantillas Rápidas</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--space-3)' }}>
                    {TEMPLATES.map(template => (
                        <div
                            key={template.name}
                            style={{ padding: 'var(--space-3)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                            onClick={() => {
                                setForm({
                                    name: template.name,
                                    description: template.desc,
                                    trigger: template.trigger,
                                    actions: template.actions,
                                    connectorId: '',
                                    apiId: '',
                                    agentCodeName: '',
                                    workflowTemplate: '',
                                })
                                setShowForm(true)
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{template.name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>{template.desc}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--space-2)' }}>
                                <span className="badge badge-accent" style={{ fontSize: '9px' }}>{getTriggerMeta(template.trigger).icon} Trigger</span>
                                <span className="badge badge-neutral" style={{ fontSize: '9px' }}>{template.actions.length} acciones</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card mb-6">
                <div className="card-header"><div className="card-title">🤖 Agent Automation Packs</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--space-3)' }}>
                    {AGENT_AUTOMATION_PACKS.map(pack => (
                        <div
                            key={pack.agentCodeName}
                            style={{ padding: 'var(--space-3)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                        >
                            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{pack.label}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.5 }}>{pack.objective}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                                <span className="badge badge-accent" style={{ fontSize: '9px' }}>{getTriggerMeta(pack.defaultTrigger).icon} {pack.defaultTrigger}</span>
                                {pack.defaultActions.map(action => (
                                    <span key={action} className="badge badge-neutral" style={{ fontSize: '9px' }}>{action}</span>
                                ))}
                            </div>
                            <div style={{ marginTop: 'var(--space-3)', display: 'grid', gap: '6px' }}>
                                {pack.templates.slice(0, 2).map(template => (
                                    <div key={template.id} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        #{template.id} {template.name}
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary mt-4" onClick={() => seedAgentPack(pack)}>
                                Load Pack
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">➕ Nuevo Workflow</div>
                    <button className="btn btn-ghost" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cerrar' : 'Crear'}</button>
                </div>
                {showForm && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
                            <div className="input-group"><label>Trigger</label>
                                <select className="input" value={form.trigger} onChange={event => setForm({ ...form, trigger: event.target.value })}>
                                    {TRIGGERS.map(trigger => <option key={trigger.key} value={trigger.key}>{trigger.icon} {trigger.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                            <label>Descripción</label>
                            <textarea className="input" rows={2} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
                        </div>
                        <div style={{ marginTop: 'var(--space-3)' }}>
                            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', display: 'block' }}>Acciones</label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                {ACTIONS.map(action => (
                                    <button
                                        key={action.key}
                                        className={`btn ${form.actions.includes(action.key) ? 'btn-primary' : 'btn-ghost'}`}
                                        style={{ fontSize: '12px' }}
                                        onClick={() => toggleAction(action.key)}
                                    >
                                        {action.icon} {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {form.actions.includes('run_connector') && (
                            <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                                <label>Connector live</label>
                                <select className="input" value={form.connectorId} onChange={event => setForm({ ...form, connectorId: event.target.value })}>
                                    <option value="">Selecciona un connector</option>
                                    {liveConnectorApps.map(app => (
                                        <option key={app.connectorId} value={app.connectorId}>{app.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {form.actions.includes('run_api') && (
                            <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                                <label>API live</label>
                                <select className="input" value={form.apiId} onChange={event => setForm({ ...form, apiId: event.target.value })}>
                                    <option value="">Selecciona una API</option>
                                    {liveApiApps.map(app => (
                                        <option key={app.id} value={app.id}>{app.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {form.actions.includes('run_agent') && (
                            <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                                <label>AI agent</label>
                                <select className="input" value={form.agentCodeName} onChange={event => setForm({ ...form, agentCodeName: event.target.value })}>
                                    <option value="">Selecciona un agent</option>
                                    {agentOptions.map(agent => (
                                        <option key={agent} value={agent}>{agent}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {form.actions.includes('launch_n8n') && (
                            <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                                <label>Plantilla n8n</label>
                                <select className="input" value={form.workflowTemplate} onChange={event => setForm({ ...form, workflowTemplate: event.target.value })}>
                                    <option value="">Selecciona una plantilla</option>
                                    {n8nOptions.map(template => (
                                        <option key={template.value} value={template.value}>{template.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {form.trigger && form.actions.length > 0 && (
                            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>Vista previa del flujo:</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    <span className="badge badge-accent">{getTriggerMeta(form.trigger).icon} {getTriggerMeta(form.trigger).label}</span>
                                    {form.actions.map(action => (
                                        <span key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                            <span className="badge badge-neutral">{getActionMeta(action).icon} {getActionMeta(action).label}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button className="btn btn-primary mt-4" onClick={addNewWorkflow}>Crear Workflow</button>
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 'var(--space-4)' }}>
                <div className="card">
                    <div className="card-header"><div className="card-title">⚡ Workflows ({workflows.length})</div></div>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>Cargando workflows...</div>
                    ) : workflows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>⚡</div>
                            <h3>Sin workflows</h3>
                        </div>
                    ) : workflows.map(workflow => {
                        const triggerKey = workflow.trigger_config?.key || workflow.trigger_type
                        const trigger = getTriggerMeta(triggerKey)
                        const steps = Array.isArray(workflow.steps) ? workflow.steps : []
                        const hasLaunch = steps.some(step => step?.config?.launch_url)

                        return (
                            <div
                                key={workflow.id}
                                onClick={() => selectWorkflow(workflow)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3)',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    background: selectedWorkflow?.id === workflow.id ? 'var(--bg-primary)' : 'transparent',
                                }}
                            >
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: workflow.is_active ? 'var(--success)' : 'var(--text-tertiary)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{workflow.name}</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span className="badge badge-accent" style={{ fontSize: '9px' }}>{trigger.icon} {trigger.label}</span>
                                        {steps.map(step => (
                                            <span key={step.id || step.type} className="badge badge-neutral" style={{ fontSize: '9px' }}>
                                                {getActionMeta(step.type).icon} {getActionMeta(step.type).label}
                                            </span>
                                        ))}
                                        {hasLaunch && <span className="badge badge-info" style={{ fontSize: '9px' }}>Canal listo</span>}
                                    </div>
                                    {workflow.description && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{workflow.description}</div>}
                                </div>
                                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{workflow.run_count || 0} runs</span>
                                <button
                                    className="btn btn-ghost"
                                    style={{ fontSize: '11px' }}
                                    onClick={event => {
                                        event.stopPropagation()
                                        executeWorkflow(workflow)
                                    }}
                                    disabled={runningWorkflowId === workflow.id}
                                >
                                    {runningWorkflowId === workflow.id ? 'Ejecutando...' : 'Run'}
                                </button>
                                <button className={`btn ${workflow.is_active ? 'btn-ghost' : 'btn-primary'}`} style={{ fontSize: '11px' }} onClick={event => { event.stopPropagation(); toggleWorkflow(workflow.id) }}>
                                    {workflow.is_active ? '⏸ Pausar' : '▶ Activar'}
                                </button>
                                <button className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={event => { event.stopPropagation(); removeWorkflow(workflow.id) }}>✕</button>
                            </div>
                        )
                    })}
                </div>

                <div className="card">
                    {!selectedWorkflow ? (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                            Selecciona un workflow para ver sus pasos, su último estado y ejecutarlo en tiempo real.
                        </div>
                    ) : (
                        <>
                            <div className="card-header">
                                <div className="card-title">Detalle</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize: '11px' }}
                                        onClick={() => executeWorkflow(selectedWorkflow)}
                                        disabled={runningWorkflowId === selectedWorkflow.id}
                                    >
                                        {runningWorkflowId === selectedWorkflow.id ? 'Ejecutando...' : 'Run now'}
                                    </button>
                                    {workflowSupportsLiveSend(selectedWorkflow) && (
                                        <button
                                            className="btn btn-ghost"
                                            style={{ fontSize: '11px' }}
                                            onClick={() => executeWorkflow(selectedWorkflow, { sendLive: true })}
                                            disabled={runningWorkflowId === selectedWorkflow.id}
                                        >
                                            Send live
                                        </button>
                                    )}
                                    {selectedWorkflow.steps?.some(step => step?.config?.launch_url) && (
                                        <button className="btn btn-ghost" style={{ fontSize: '11px' }} onClick={() => openWorkflowDraft(selectedWorkflow)}>
                                            Abrir draft
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{selectedWorkflow.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                Última ejecución: {formatWorkflowRunDate(selectedWorkflow.last_run_at)}
                            </div>
                            {selectedWorkflow.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5 }}>{selectedWorkflow.description}</div>}

                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>PASOS</div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {(selectedWorkflow.steps || []).map(step => (
                                        <div key={step.id || step.type} style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{getActionMeta(step.type).icon} {getActionMeta(step.type).label}</div>
                                            {step.config?.launch_url && <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px' }}>Launch URL conectado</div>}
                                            {step.config?.connectorId && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Connector: {step.config.connectorId}</div>}
                                            {step.config?.endpoint && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>API: {step.config.label || step.config.endpoint}</div>}
                                            {step.config?.agentCodeName && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Agent: {step.config.agentCodeName}</div>}
                                            {step.config?.workflowTemplate && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                    n8n: {step.config.workflowTemplateLabel || step.config.workflowTemplate}
                                                    {step.config?.workflowTemplateUrl && (
                                                        <a href={step.config.workflowTemplateUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: 'var(--accent-primary)' }}>
                                                            open
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>ÚLTIMOS RUNS</div>
                                {runs.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Todavía no hay ejecuciones registradas.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {runs.map(run => (
                                            <div key={run.id} style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                    <span className={`badge ${run.status === 'completed' ? 'badge-success' : run.status === 'failed' ? 'badge-danger' : 'badge-info'}`}>{run.status}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{formatWorkflowRunDate(run.started_at)}</span>
                                                </div>
                                                {Array.isArray(run.result?.steps) && run.result.steps.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                                        {run.result.steps.map(step => {
                                                            const stepType = step?.type || 'step'
                                                            const stepStatus = step?.status || 'completed'
                                                            const stepTone = stepStatus === 'failed'
                                                                ? 'badge-danger'
                                                                : stepStatus === 'sent' || stepStatus === 'completed'
                                                                    ? 'badge-success'
                                                                    : stepStatus === 'skipped'
                                                                        ? 'badge-warning'
                                                                        : 'badge-info'
                                                            return (
                                                                <span key={`${run.id}-${step.id || stepType}`} className={`badge ${stepTone}`} style={{ fontSize: '9px' }}>
                                                                    {stepType}
                                                                    {step?.output?.template?.label ? ` · ${step.output.template.label}` : ''}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                                {run.result?.steps?.find(step => step?.type === 'launch_n8n')?.output?.webhook && (
                                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                                                        {run.result.steps.find(step => step?.type === 'launch_n8n')?.output?.agent_code_name && (
                                                            <div>agent: {run.result.steps.find(step => step?.type === 'launch_n8n')?.output?.agent_code_name}</div>
                                                        )}
                                                        {run.result.steps.find(step => step?.type === 'launch_n8n')?.output?.webhook_source && (
                                                            <div>webhook source: {run.result.steps.find(step => step?.type === 'launch_n8n')?.output?.webhook_source}</div>
                                                        )}
                                                        n8n webhook: {JSON.stringify(run.result.steps.find(step => step?.type === 'launch_n8n')?.output?.webhook)}
                                                    </div>
                                                )}
                                                {run.error && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '6px' }}>{run.error}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Automation
