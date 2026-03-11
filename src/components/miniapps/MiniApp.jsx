// ═══════════════════════════════════════════════════
// OCULOPS — MiniApp Component
// Generic panel for core edge functions and public connector mini-apps
// ═══════════════════════════════════════════════════

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useEdgeFunction } from '../../hooks/useEdgeFunction'
import { useConnectorProxy } from '../../hooks/useConnectorProxy'
import { updateRow } from '../../lib/supabase'
import { getTemplateByKey, validateConnectorCredentials } from '../../lib/publicApiConnectorTemplates'

const STATUS_STYLES = {
  active: { bg: 'var(--success-bg)', color: 'var(--color-success)', label: 'LIVE' },
  degraded: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'LIMITED' },
  pending: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'PENDING' },
  planned: { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)', label: 'CATALOG' },
}

function buildInitialForm(inputSchema = [], sampleParams = {}) {
  const initial = {}

  for (const field of inputSchema) {
    if (sampleParams[field.key] != null) {
      initial[field.key] = Array.isArray(sampleParams[field.key])
        ? sampleParams[field.key].join(';')
        : String(sampleParams[field.key])
      continue
    }

    initial[field.key] = field.type === 'select' ? (field.options?.[0]?.value || '') : ''
  }

  return initial
}

function normalizeFormPayload(form, schema) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => {
    const field = schema.find(candidate => candidate.key === key)

    if (field?.multiple || field?.key === 'points') {
      return [key, String(value).split(';').map(item => item.trim()).filter(Boolean)]
    }

    return [key, value]
  }))
}

function buildCredentialForm(app, template) {
  const defaults = {
    ...(template?.authConfigDefaults || {}),
    ...(app.authConfigDefaults || {}),
  }
  const fields = [
    ...(template?.authRequirements?.requiredFields || app.authRequirements?.requiredFields || []),
    ...(template?.authRequirements?.optionalFields || app.authRequirements?.optionalFields || []),
  ]

  return fields.reduce((acc, field) => {
    acc[field] = defaults[field] || ''
    return acc
  }, {})
}

function getStatusKey(app, connectorStatus) {
  if (app.runMode !== 'connector_proxy') return app.status
  if (connectorStatus === 'live') return 'active'
  if (connectorStatus === 'error') return 'pending'
  return app.status
}

function getCredentialFieldMeta(field) {
  switch (field) {
    case 'api_key':
      return { label: 'API Key', type: 'password', placeholder: 'Paste a new API key' }
    case 'token':
      return { label: 'Bearer Token', type: 'password', placeholder: 'Paste a bearer token' }
    case 'username':
      return { label: 'Username', type: 'text', placeholder: 'Connector username' }
    case 'password':
      return { label: 'Password', type: 'password', placeholder: 'Connector password' }
    default:
      return {
        label: field.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        type: /key|token|secret|password/i.test(field) ? 'password' : 'text',
        placeholder: `Enter ${field.replace(/_/g, ' ')}`,
      }
  }
}

export default function MiniApp({
  app,
  onClose,
  compact = false,
  onInstall,
  installing = false,
  onAfterExecute,
}) {
  const template = useMemo(
    () => (app.templateKey ? getTemplateByKey(app.templateKey) : null),
    [app.templateKey]
  )
  const edge = useEdgeFunction(app.endpoint, { cacheTTL: 30000 })
  const connector = useConnectorProxy({
    connectorId: app.connectorId,
    endpointName: app.endpointName,
  }, { cacheTTL: 30000 })
  const [form, setForm] = useState(() => buildInitialForm(app.inputSchema || [], app.sampleParams || {}))
  const [showHistory, setShowHistory] = useState(false)
  const [credentialForm, setCredentialForm] = useState(() => buildCredentialForm(app, template))
  const [credentialSaving, setCredentialSaving] = useState(false)
  const [credentialMessage, setCredentialMessage] = useState(null)
  const [credentialError, setCredentialError] = useState(null)
  const [connectorStatus, setConnectorStatus] = useState(app.connectorStatus || null)
  const [lastHealthcheckAt, setLastHealthcheckAt] = useState(app.lastHealthcheckAt || null)

  const runtime = app.runMode === 'connector_proxy' ? connector : edge
  const { data, loading, error, execute, history } = runtime
  const statusStyle = STATUS_STYLES[getStatusKey(app, connectorStatus)] || STATUS_STYLES.planned
  const credentialFields = useMemo(
    () => [
      ...(template?.authRequirements?.requiredFields || app.authRequirements?.requiredFields || []),
      ...(template?.authRequirements?.optionalFields || app.authRequirements?.optionalFields || []),
    ],
    [app.authRequirements?.optionalFields, app.authRequirements?.requiredFields, template?.authRequirements?.optionalFields, template?.authRequirements?.requiredFields]
  )
  const hasCredentialPanel = app.runMode === 'connector_proxy' && app.connectorId && credentialFields.length > 0
  const credentialTransportHint = useMemo(() => {
    const defaults = {
      ...(template?.authConfigDefaults || {}),
      ...(app.authConfigDefaults || {}),
    }

    if (defaults.header_name) return `Credential transport: header ${defaults.header_name}`
    if (defaults.query_name) return `Credential transport: query parameter ${defaults.query_name}`
    return 'Credential transport: managed by connector template'
  }, [app.authConfigDefaults, template?.authConfigDefaults])

  const normalizedPayload = useMemo(
    () => normalizeFormPayload(form, app.inputSchema || []),
    [app.inputSchema, form]
  )

  const output = data?.normalized ?? data?.raw ?? data

  useEffect(() => {
    setForm(buildInitialForm(app.inputSchema || [], app.sampleParams || {}))
    setCredentialForm(buildCredentialForm(app, template))
    setCredentialMessage(null)
    setCredentialError(null)
    setConnectorStatus(app.connectorStatus || null)
    setLastHealthcheckAt(app.lastHealthcheckAt || null)
  }, [app, template])

  const handleInstall = useCallback(async () => {
    if (!onInstall) return
    await onInstall(app)
  }, [app, onInstall])

  const handleExecute = useCallback(async () => {
    if (app.runMode === 'docs_only') {
      if (app.docsUrl) window.open(app.docsUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const result = app.runMode === 'connector_proxy'
      ? await execute({
        params: normalizedPayload,
        healthcheck: connectorStatus !== 'live' && app.status !== 'active',
      })
      : await execute(normalizedPayload)

    if (app.runMode === 'connector_proxy') {
      setLastHealthcheckAt(new Date().toISOString())
      setConnectorStatus(result?.error ? 'error' : 'live')
    }

    if (result?.error) return result

    if (onAfterExecute) {
      onAfterExecute(result)
    }

    return result
  }, [app.docsUrl, app.runMode, app.status, connectorStatus, execute, normalizedPayload, onAfterExecute])

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') handleExecute()
  }, [handleExecute])

  const handleSaveCredentials = useCallback(async () => {
    if (!app.connectorId || !template) return

    const nextAuthConfig = {
      ...(template.authConfigDefaults || {}),
      ...(app.authConfigDefaults || {}),
    }

    for (const field of credentialFields) {
      const value = String(credentialForm[field] || '').trim()
      if (value) {
        nextAuthConfig[field] = value
      }
    }

    const providedSecretCount = credentialFields.reduce((count, field) => (
      String(credentialForm[field] || '').trim() ? count + 1 : count
    ), 0)

    if (providedSecretCount === 0) {
      setCredentialError('Enter new credentials to replace the stored secret')
      setCredentialMessage(null)
      return
    }

    const validation = validateConnectorCredentials(template, nextAuthConfig)
    if (!validation.valid) {
      setCredentialError(validation.errors.join(', '))
      setCredentialMessage(null)
      return
    }

    setCredentialSaving(true)
    setCredentialError(null)
    setCredentialMessage(null)

    const updated = await updateRow('api_connectors', app.connectorId, {
      auth_config: nextAuthConfig,
      health_status: 'pending',
      last_healthcheck_at: null,
      metadata: {
        ...(app.metadata || {}),
        credentials_updated_at: new Date().toISOString(),
      },
    })

    setCredentialSaving(false)

    if (!updated) {
      setCredentialError('Failed to save connector credentials')
      return
    }

    setConnectorStatus('pending')
    setLastHealthcheckAt(null)
    setCredentialForm(buildCredentialForm(app, template))
    setCredentialMessage('Credentials saved. Run Test Connection to verify health.')

    if (onAfterExecute) {
      onAfterExecute({ connectorUpdated: true, connectorId: app.connectorId })
    }
  }, [app, credentialFields, credentialForm, onAfterExecute, template])

  return (
    <div className="fade-in" style={{
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: compact ? 'auto' : '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-lg)',
          background: `${app.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}>
          {app.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>{app.name}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
            {app.type} · {app.source === 'core' ? 'Core' : app.source === 'connector' ? 'Installed Connector' : 'Public Catalog'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          background: statusStyle.bg,
          fontSize: '9px',
          fontWeight: 700,
          color: statusStyle.color,
          letterSpacing: '0.05em',
        }}>
          <div style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: statusStyle.color,
          }} />
          {statusStyle.label}
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            transition: 'all var(--transition-fast)',
          }}>✕</button>
        )}
      </div>

      <div style={{
        padding: '12px 20px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {app.description}
        {app.statusDetail && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Status: {app.statusDetail}
          </div>
        )}
        {app.runMode === 'connector_proxy' && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>Connector health: {connectorStatus || 'pending'}</span>
            <span>Last healthcheck: {lastHealthcheckAt ? new Date(lastHealthcheckAt).toLocaleString() : 'never'}</span>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '8px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="badge badge-neutral" style={{ justifyContent: 'center', padding: '6px 8px' }}>
          Auth: {app.authType || 'core'}
        </div>
        <div className="badge badge-neutral" style={{ justifyContent: 'center', padding: '6px 8px' }}>
          HTTPS: {app.httpsOnly === false ? 'No' : 'Yes'}
        </div>
        <div className="badge badge-neutral" style={{ justifyContent: 'center', padding: '6px 8px' }}>
          CORS: {app.corsPolicy || 'Managed'}
        </div>
        <div className="badge badge-neutral" style={{ justifyContent: 'center', padding: '6px 8px' }}>
          Targets: {(app.moduleTargets || []).join(', ') || 'general'}
        </div>
      </div>

      {(app.agentTargets?.length || app.n8nTemplates?.length || app.moduleLinks?.length || app.requiredSecrets?.length) && (
        <div style={{
          display: 'grid',
          gap: '10px',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-raised)',
        }}>
          {app.agentTargets?.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px', letterSpacing: '0.05em' }}>AI AGENTS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {app.agentTargets.map(target => (
                  <span key={target} className="badge badge-info" style={{ fontSize: '9px' }}>{target}</span>
                ))}
              </div>
            </div>
          )}

          {app.n8nTemplates?.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px', letterSpacing: '0.05em' }}>N8N WORKFLOWS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {app.n8nTemplates.map(template => (
                  <span key={template} className="badge badge-neutral" style={{ fontSize: '9px' }}>{template}</span>
                ))}
              </div>
            </div>
          )}

          {app.requiredSecrets?.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px', letterSpacing: '0.05em' }}>RUNTIME SECRETS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {app.requiredSecrets.map(secret => (
                  <span key={secret} className="badge badge-warning" style={{ fontSize: '9px' }}>{secret}</span>
                ))}
              </div>
            </div>
          )}

          {app.moduleLinks?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {app.moduleLinks.map(link => (
                <a
                  key={link.path}
                  className="btn btn-ghost"
                  href={link.path}
                  style={{ textDecoration: 'none', fontSize: '11px', padding: '6px 10px' }}
                >
                  Open {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {hasCredentialPanel && (
        <div style={{
          display: 'grid',
          gap: '10px',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              CONNECTOR CREDENTIALS
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Stored secrets are masked in the UI. Enter a new value to replace the existing credential.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              {credentialTransportHint}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {credentialFields.map(field => {
              const meta = getCredentialFieldMeta(field)
              return (
                <div key={field} className="input-group" style={{ margin: 0 }}>
                  <label>{meta.label}</label>
                  <input
                    className="input"
                    type={meta.type}
                    value={credentialForm[field] || ''}
                    placeholder={meta.placeholder}
                    onChange={event => setCredentialForm(current => ({ ...current, [field]: event.target.value }))}
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  />
                </div>
              )
            })}
          </div>

          {(credentialError || credentialMessage) && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: credentialError ? 'var(--danger-bg)' : 'var(--success-bg)',
              color: credentialError ? 'var(--color-danger)' : 'var(--color-success)',
              fontSize: '12px',
            }}>
              {credentialError || credentialMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={handleSaveCredentials} disabled={credentialSaving}>
              {credentialSaving ? 'Saving...' : 'Save Credentials'}
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
              After saving, run Test Connection to promote the connector to live.
            </div>
          </div>
        </div>
      )}

      {app.inputSchema && app.inputSchema.length > 0 && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {app.inputSchema.map(field => (
            <div key={field.key} className="input-group">
              <label>{field.label}</label>
              {field.type === 'select' ? (
                <select
                  className="input"
                  value={form[field.key]}
                  onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  {(field.options || []).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type="text"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))}
                  onKeyDown={handleKeyDown}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', padding: '0 20px 16px' }}>
        <button
          className={`btn ${app.runMode === 'docs_only' ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleExecute}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading
            ? '⏳ Running...'
            : app.runMode === 'docs_only'
              ? '📖 Open Docs'
              : app.runMode === 'connector_proxy' && app.connectorStatus !== 'live'
                ? '🩺 Test Connection'
                : '🚀 Execute'}
        </button>

        {app.installable && (
          <button
            className="btn btn-primary"
            onClick={handleInstall}
            disabled={installing}
            style={{ flexShrink: 0 }}
          >
            {installing ? '⏳ Installing...' : '➕ Install'}
          </button>
        )}

        {app.docsUrl && app.runMode !== 'docs_only' && (
          <a
            className="btn btn-ghost"
            href={app.docsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            Docs
          </a>
        )}
      </div>

      {(output || error) && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          flex: 1,
          overflow: 'auto',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {error ? '⚠ Error' : 'Normalized Output'}
            </div>
            <button
              onClick={() => setShowHistory(current => !current)}
              style={{
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                background: showHistory ? 'var(--surface-raised)' : 'transparent',
              }}
            >
              History ({history.length})
            </button>
          </div>

          {error ? (
            <div style={{
              padding: '10px',
              background: 'var(--danger-bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              color: 'var(--color-danger)',
            }}>{error}</div>
          ) : (
            <pre style={{
              padding: '10px',
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              overflow: 'auto',
              maxHeight: '240px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {JSON.stringify(output, null, 2)}
            </pre>
          )}

          {showHistory && history.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              {history.map((item, index) => (
                <div key={index} style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{
                    color: item.result.success ? 'var(--color-success)' : 'var(--color-danger)',
                    fontWeight: 600,
                  }}>
                    {item.result.success ? `✅ ${item.result.recordCount || 1} records` : `❌ ${item.result.error}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
