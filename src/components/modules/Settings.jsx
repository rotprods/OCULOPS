// ===================================================
// ANTIGRAVITY OS — Settings Module
// Configuracion del sistema: agencia, integraciones, tema
// ===================================================

import { useState } from 'react'

const AGENCY_DEFAULTS = {
  name: 'ANTIGRAVITY Agency',
  website: '',
  email: '',
  phone: '',
  icp: 'PYMEs 10-200 empleados — e-commerce, clinicas, inmobiliarias, SaaS B2B',
  services: 'Chatbots IA, Automatizacion, Meta Ads, Prospecting automatico',
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}

function formatPublicValue(key, value) {
  if (!value) return 'NO CONFIGURADA'
  if (key === 'VITE_SUPABASE_URL') {
    try {
      return new URL(value).origin
    } catch {
      return value
    }
  }
  return maskKey(value)
}

function Settings() {
  const [agency, setAgency] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ag_agency') || 'null') || AGENCY_DEFAULTS } catch { return AGENCY_DEFAULTS }
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('agency')

  const publicEnvKeys = [
    { label: 'Supabase URL',          key: 'VITE_SUPABASE_URL' },
    { label: 'Supabase Anon Key',     key: 'VITE_SUPABASE_ANON_KEY' },
  ]

  const protectedIntegrations = [
    { label: 'OpenAI', location: 'Supabase Edge Functions secrets / server env' },
    { label: 'Anthropic', location: 'Supabase Edge Functions secrets / server env' },
    { label: 'Meta Ads / Graph', location: 'Supabase secrets o backend privado' },
    { label: 'WhatsApp', location: 'Webhook backend y secrets privados' },
  ]

  const saveAgency = () => {
    localStorage.setItem('ag_agency', JSON.stringify(agency))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ag_') || k.startsWith('antigravity'))
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  const tabs = [
    { id: 'agency', label: 'Agencia' },
    { id: 'integrations', label: 'Integraciones' },
    { id: 'system', label: 'Sistema' },
  ]

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Configuracion</h1>
        <p>Perfil de agencia, integraciones activas y preferencias del sistema.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'agency' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Perfil de Agencia</div>
          </div>
          <div className="grid-2" style={{ gap: '12px' }}>
            <div className="input-group">
              <label>Nombre</label>
              <input className="input" value={agency.name} onChange={e => setAgency(a => ({ ...a, name: e.target.value }))} placeholder="Nombre de la agencia" />
            </div>
            <div className="input-group">
              <label>Website</label>
              <input className="input" value={agency.website} onChange={e => setAgency(a => ({ ...a, website: e.target.value }))} placeholder="https://agencia.com" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" value={agency.email} onChange={e => setAgency(a => ({ ...a, email: e.target.value }))} placeholder="hola@agencia.com" />
            </div>
            <div className="input-group">
              <label>Telefono</label>
              <input className="input" value={agency.phone} onChange={e => setAgency(a => ({ ...a, phone: e.target.value }))} placeholder="+34 600 000 000" />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>ICP (cliente ideal)</label>
              <textarea className="input" rows={2} value={agency.icp} onChange={e => setAgency(a => ({ ...a, icp: e.target.value }))} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Servicios principales</label>
              <textarea className="input" rows={2} value={agency.services} onChange={e => setAgency(a => ({ ...a, services: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={saveAgency}>
            {saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Runtime publico</div>
              <span className="badge badge-neutral">Solo lectura</span>
            </div>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', marginBottom: '16px' }}>
              Solo se muestran variables seguras para el cliente. Los secretos de proveedores no deben exponerse via `VITE_*`.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {publicEnvKeys.map(({ label, key }) => {
                const val = import.meta.env[key]
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-bg-3)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{key}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: val ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatPublicValue(key, val)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Integraciones protegidas</div>
              <span className="badge badge-neutral">Backend only</span>
            </div>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', marginBottom: '16px' }}>
              Estas credenciales deben vivir en Supabase secrets, webhooks privados o variables server-side. No se leen desde la app.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {protectedIntegrations.map(({ label, location }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-bg-3)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-2)' }}>{location}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>No visible en cliente</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Informacion del sistema</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Version', value: 'v10.3' },
                { label: 'Stack', value: 'React 19 + Vite 7 + Electron 35' },
                { label: 'Base de datos', value: 'Supabase (PostgreSQL)' },
                { label: 'Modo', value: import.meta.env.VITE_DEV_MODE !== 'false' ? 'Desarrollo (DEV_MODE)' : 'Produccion' },
                { label: 'Entorno', value: import.meta.env.MODE },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-2)', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Gestion de datos locales</div></div>
            <p style={{ color: 'var(--color-text-2)', fontSize: '13px', marginBottom: '16px' }}>
              Limpia la cache local del navegador (localStorage). Los datos en Supabase no se ven afectados.
            </p>
            <button className="btn btn-danger" onClick={clearCache}>Limpiar cache local</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
