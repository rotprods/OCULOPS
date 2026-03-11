// ═══════════════════════════════════════════════════
// OCULOPS — Settings Module
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUserId } from '../../lib/supabase'

const AGENCY_DEFAULTS = {
  name: 'OCULOPS AGENCY',
  website: '',
  email: '',
  phone: '',
  icp: 'SMB 10-200 EMPLOYEES — E-COMMERCE, CLINICS, REAL ESTATE, B2B SAAS',
  services: 'AI CHATBOTS, AUTOMATION, META ADS, AUTO-PROSPECTING',
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 4) + '••••••••' + key.slice(-4)
}

function formatPublicValue(key, value) {
  if (!value) return 'UNCONFIGURED [SYS_WARN]'
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
  const [agency, setAgency] = useState(AGENCY_DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Account profile state
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', company: '', role_title: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordFields, setPasswordFields] = useState({ current: '', new: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState(null)

  // Load profile + agency settings
  useEffect(() => {
    async function loadSettings() {
      if (!supabase) { setLoadingProfile(false); return }
      const userId = await getCurrentUserId()
      if (!userId) { setLoadingProfile(false); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          role_title: data.role_title || '',
        })
        if (data.settings?.agency) {
          setAgency(prev => ({ ...prev, ...data.settings.agency }))
        }
      }
      setLoadingProfile(false)
    }
    loadSettings()
  }, [])

  const publicEnvKeys = [
    { label: 'SUPABASE URL', key: 'VITE_SUPABASE_URL' },
    { label: 'SUPABASE ANON KEY', key: 'VITE_SUPABASE_ANON_KEY' },
  ]

  const protectedIntegrations = [
    { label: 'OPENAI INGRESS', location: 'SUPABASE EDGE FUNCTIONS / PRIVATE ENV' },
    { label: 'ANTHROPIC CLAUDE', location: 'SUPABASE EDGE FUNCTIONS / PRIVATE ENV' },
    { label: 'META GRAPH API', location: 'SUPABASE SECRETS / PRIVATE BACKEND' },
    { label: 'META WHATSAPP', location: 'PRIVATE WEBHOOKS / SECRETS' },
  ]

  const saveAgency = useCallback(async () => {
    // Save to Supabase profiles.settings
    if (supabase) {
      const userId = await getCurrentUserId()
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('settings').eq('id', userId).single()
        const existingSettings = profile?.settings || {}
        await supabase.from('profiles').update({
          settings: { ...existingSettings, agency },
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }
    // Also keep localStorage as fallback
    localStorage.setItem('ag_agency', JSON.stringify(agency))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [agency])

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('ag_') || k.startsWith('oculops'))
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  const saveProfile = useCallback(async () => {
    const userId = await getCurrentUserId()
    if (!userId) return
    await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone || null,
      company: profile.company || null,
      role_title: profile.role_title || null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }, [profile])

  const changePassword = useCallback(async () => {
    setPasswordMsg(null)
    if (passwordFields.new.length < 6) return setPasswordMsg({ type: 'error', text: 'Mínimo 6 caracteres' })
    if (passwordFields.new !== passwordFields.confirm) return setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden' })
    const { error } = await supabase.auth.updateUser({ password: passwordFields.new })
    if (error) return setPasswordMsg({ type: 'error', text: error.message })
    setPasswordMsg({ type: 'success', text: 'Contraseña actualizada' })
    setPasswordFields({ current: '', new: '', confirm: '' })
    setTimeout(() => setPasswordMsg(null), 3000)
  }, [passwordFields])

  const tabs = [
    { id: 'account', label: '00. ACCOUNT' },
    { id: 'agency', label: '01. DIRECTIVE PROFILE' },
    { id: 'integrations', label: '02. INTEGRATION MATRIX' },
    { id: 'system', label: '03. SYSTEM CORE' },
  ]

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', letterSpacing: '0.05em', margin: 0 }}>SYSTEM CONFIGURATION</h1>
          <span className="mono text-xs text-tertiary">AGENCY PROFILE, INTEGRATION SECRETS & SYSTEM CORE SETTINGS</span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className="mono"
              style={{ padding: '8px 16px', fontSize: '10px', background: activeTab === t.id ? 'var(--accent-primary)' : 'transparent', color: activeTab === t.id ? '#000' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'account' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Profile */}
            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>/// OPERATOR PROFILE</div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="mono text-xs">NOMBRE COMPLETO</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">EMAIL</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px', opacity: 0.5 }} value={profile.email} disabled />
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Gestionado por Supabase Auth</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="mono text-xs">TELÉFONO</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+34 600 000 000" />
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">CARGO</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={profile.role_title} onChange={e => setProfile(p => ({ ...p, role_title: e.target.value }))} placeholder="CEO, CTO..." />
                  </div>
                </div>
                <div className="input-group">
                  <label className="mono text-xs">EMPRESA</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="Tu empresa" />
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button className="btn mono" style={{ border: '1px solid var(--accent-primary)', background: profileSaved ? 'var(--accent-primary)' : '#000', color: profileSaved ? '#000' : 'var(--accent-primary)', borderRadius: 0, padding: '12px 24px' }} onClick={saveProfile}>
                    {profileSaved ? 'PERFIL GUARDADO' : 'GUARDAR PERFIL'}
                  </button>
                </div>
              </div>
            </div>

            {/* Password */}
            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-warning)' }}>/// CAMBIAR CONTRASEÑA</div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="mono text-xs">NUEVA CONTRASEÑA</label>
                  <input className="input mono text-xs" type="password" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={passwordFields.new} onChange={e => setPasswordFields(p => ({ ...p, new: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">CONFIRMAR CONTRASEÑA</label>
                  <input className="input mono text-xs" type="password" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={passwordFields.confirm} onChange={e => setPasswordFields(p => ({ ...p, confirm: e.target.value }))} placeholder="Repetir contraseña" />
                </div>
                {passwordMsg && (
                  <div className="mono text-xs" style={{ padding: '8px 12px', border: `1px solid ${passwordMsg.type === 'error' ? 'rgba(255,51,51,0.2)' : 'rgba(255,212,0,0.2)'}`, color: passwordMsg.type === 'error' ? 'var(--color-danger)' : 'var(--accent-primary)' }}>
                    {passwordMsg.text}
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button className="btn mono" style={{ border: '1px solid var(--color-warning)', background: '#000', color: 'var(--color-warning)', borderRadius: 0, padding: '12px 24px' }} onClick={changePassword} disabled={!passwordFields.new}>
                    ACTUALIZAR CONTRASEÑA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agency' && (
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>/// CORE AGENCY PARAMETERS</div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '16px' }}>
                <div className="input-group">
                  <label className="mono text-xs">AGENCY DESIGNATION</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.name} onChange={e => setAgency(a => ({ ...a, name: e.target.value }))} placeholder="AGENCY OR ORG NAME" />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">EXTERNAL DOMAIN / WEBSITE</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.website} onChange={e => setAgency(a => ({ ...a, website: e.target.value }))} placeholder="HTTPS://DOMAIN.COM" />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">PRIMARY COMMS (EMAIL)</label>
                  <input className="input mono text-xs" type="email" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.email} onChange={e => setAgency(a => ({ ...a, email: e.target.value }))} placeholder="COMM@DOMAIN.COM" />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">PRIMARY CONTACT (PHONE)</label>
                  <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.phone} onChange={e => setAgency(a => ({ ...a, phone: e.target.value }))} placeholder="+1 555-000-0000" />
                </div>
              </div>

              <div className="input-group">
                <label className="mono text-xs">ICP (IDEAL CUSTOMER PROFILE) MATRIX</label>
                <textarea className="input mono text-xs" rows={2} style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.icp} onChange={e => setAgency(a => ({ ...a, icp: e.target.value }))} />
              </div>

              <div className="input-group">
                <label className="mono text-xs">PRIMARY DEPLOYMENT SERVICES</label>
                <textarea className="input mono text-xs" rows={2} style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={agency.services} onChange={e => setAgency(a => ({ ...a, services: e.target.value }))} />
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button className="btn mono" style={{ border: '1px solid var(--accent-primary)', background: saved ? 'var(--accent-primary)' : '#000', color: saved ? '#000' : 'var(--accent-primary)', borderRadius: 0, padding: '12px 24px' }} onClick={saveAgency}>
                  {saved ? 'PARAMETERS SECURED' : 'SECURE NEW PARAMETERS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)', display: 'flex', gap: '16px' }}>
                <span>/// PUBLIC RUNTIME MATRIX</span>
                <span style={{ color: 'var(--color-info)' }}>[READ ONLY]</span>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="mono text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                  DISPLAYING CLIENT-SAFE VARIABLES ONLY. VENDOR SECRETS MUST NOT BE EXPOSED VIA `VITE_*`.
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <tbody>
                    {publicEnvKeys.map(({ label, key }) => {
                      const val = import.meta.env[key]
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 0' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
                            <div style={{ color: 'var(--text-tertiary)' }}>{key}</div>
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right', color: val ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {formatPublicValue(key, val)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-warning)', display: 'flex', gap: '16px' }}>
                <span>/// PROTECTED ASSETS</span>
                <span style={{ color: 'var(--color-danger)' }}>[BACKEND DEPLOYMENT ONLY]</span>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="mono text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                  CREDENTIALS SECURED IN SUPABASE SECRETS, PRIVATE WEBHOOKS, OR SERVER-SIDE ENV VARIABLES. UNREADABLE FROM CLOUD CLIENT.
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <tbody>
                    {protectedIntegrations.map(({ label, location }) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 0' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{location}</div>
                        </td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                          NON_VISIBLE_CLIENT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>/// CORE OVERVIEW</div>
              <div style={{ padding: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <tbody>
                    {[
                      { label: 'OS VERSION', value: 'V10.3 (ALPHA)' },
                      { label: 'RUNTIME STACK', value: 'REACT 19 + VITE 7 + ELECTRON 35' },
                      { label: 'DB LAYER', value: 'SUPABASE POSTGRESQL // EDGE' },
                      { label: 'CURRENT MODE', value: import.meta.env.MODE === 'production' ? 'PRODUCTION' : 'DEVELOPMENT' },
                      { label: 'NODE ENVIRONMENT', value: import.meta.env.MODE.toUpperCase() },
                    ].map(({ label, value }) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>{label}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-warning)' }}>/// MEMORY CONTROL</div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="mono text-xs" style={{ color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                  WIPE LOCAL BROWSER CACHE (LOCALSTORAGE). ACTIVE SUPABASE DB LAYER IS UNAFFECTED.
                </p>
                <button className="btn mono" style={{ border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', borderRadius: 0, padding: '12px' }} onClick={clearCache}>
                  PURGE LOCAL MEMORY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
