import React, { useState, useEffect, useCallback } from 'react'
import { useOrg } from '../hooks/useOrg'
import { supabase } from '../lib/supabase'

const STEPS = [
  { id: 'profile', label: 'OPERADOR',      num: '01' },
  { id: 'org',     label: 'ORGANIZACIÓN',  num: '02' },
  { id: 'agents',  label: 'AGENTES',       num: '03' },
  { id: 'ready',   label: 'LISTO',         num: '04' },
]

const INDUSTRIES = ['SaaS', 'E-commerce', 'Healthcare', 'Real Estate', 'Agency', 'Consulting', 'Other']
const TEAM_SIZES = ['Solo', '2-5', '6-20', '21-50', '50+']

// ── Vault agents available for import ──────────────────────────────────────────
const VAULT_AGENTS = [
  {
    code_name: 'sales-automator',
    name: 'SALES AUTOMATOR',
    icon: '⚡',
    namespace: 'product',
    description: 'Cold email sequences, follow-up cadences, proposal templates.',
    model: 'gpt-4o',
    system_prompt: 'You are a sales automation specialist focused on conversions and relationships. You craft cold email sequences, follow-up campaigns, proposal templates, and sales scripts that convert.',
    allowed_skills: ['send_email', 'create_deal', 'update_contact'],
  },
  {
    code_name: 'market-research-analyst',
    name: 'MARKET RESEARCH',
    icon: '🔍',
    namespace: 'research',
    description: 'Market intelligence, industry trends, competitive analysis.',
    model: 'gpt-4o',
    system_prompt: 'You are a Market Research Analyst. You conduct thorough market investigations, identify key players, analyze market dynamics, and deliver actionable intelligence reports.',
    allowed_skills: ['web_search', 'analyze_data', 'store_knowledge'],
  },
  {
    code_name: 'product-strategist',
    name: 'PRODUCT STRATEGIST',
    icon: '♟',
    namespace: 'product',
    description: 'Product positioning, competitive landscape, go-to-market strategy.',
    model: 'gpt-4o',
    system_prompt: 'You are a product strategist specializing in transforming market insights into winning strategies. You excel at product positioning, competitive analysis, roadmaps, and go-to-market execution.',
    allowed_skills: ['analyze_data', 'web_search', 'store_knowledge'],
  },
  {
    code_name: 'competitive-analyst',
    name: 'COMPETITIVE ANALYST',
    icon: '🎯',
    namespace: 'research',
    description: 'Competitor monitoring, strategic analysis, opportunity identification.',
    model: 'gpt-4o-mini',
    system_prompt: 'You are a competitive analyst. You monitor competitors, analyze their strategies, identify market gaps, and deliver intelligence that drives competitive advantage.',
    allowed_skills: ['web_search', 'analyze_data', 'store_knowledge'],
  },
  {
    code_name: 'customer-success-manager',
    name: 'CUSTOMER SUCCESS',
    icon: '🤝',
    namespace: 'product',
    description: 'Customer health scoring, churn prevention, upsell identification.',
    model: 'gpt-4o',
    system_prompt: 'You are a senior customer success manager. You assess customer health, build retention strategies, identify upsell opportunities, and maximize customer lifetime value.',
    allowed_skills: ['send_email', 'update_contact', 'analyze_data', 'create_deal'],
  },
]

const INDUSTRY_RECS = {
  Agency:        ['sales-automator', 'market-research-analyst', 'competitive-analyst', 'product-strategist'],
  Consulting:    ['product-strategist', 'market-research-analyst', 'competitive-analyst', 'customer-success-manager'],
  SaaS:          ['product-strategist', 'competitive-analyst', 'customer-success-manager', 'market-research-analyst'],
  'E-commerce':  ['sales-automator', 'market-research-analyst', 'customer-success-manager', 'competitive-analyst'],
  Healthcare:    ['customer-success-manager', 'market-research-analyst', 'competitive-analyst', 'product-strategist'],
  'Real Estate': ['sales-automator', 'market-research-analyst', 'customer-success-manager', 'competitive-analyst'],
  Other:         ['sales-automator', 'market-research-analyst', 'product-strategist', 'competitive-analyst'],
}

const CORE_AGENTS = [
  { code_name: 'atlas',   name: 'ATLAS',  icon: '🌐', description: 'Market intelligence & prospecting' },
  { code_name: 'hunter',  name: 'HUNTER', icon: '🎯', description: 'Lead capture & qualification' },
  { code_name: 'forge',   name: 'FORGE',  icon: '⚒',  description: 'Content & copy generation' },
]

export default function OnboardingSetup({ onComplete }) {
  const { createOrganization } = useOrg()
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newOrgId, setNewOrgId] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  // Profile
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [roleTitle, setRoleTitle] = useState('')

  // Org
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [teamSize, setTeamSize] = useState('')

  // Agents
  const [selectedAgents, setSelectedAgents] = useState(new Set())

  // Auto-recommend agents when industry changes
  useEffect(() => {
    if (industry) setSelectedAgents(new Set(INDUSTRY_RECS[industry] || INDUSTRY_RECS.Other))
  }, [industry])

  // Pre-fill from auth metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.user_metadata) return
      if (user.user_metadata.full_name) setFullName(user.user_metadata.full_name)
      if (user.user_metadata.phone) setPhone(user.user_metadata.phone)
      if (user.user_metadata.company) setCompany(user.user_metadata.company)
      if (user.user_metadata.role_title) setRoleTitle(user.user_metadata.role_title)
    }).catch(() => {})
  }, [])

  // ── Emergency bypass — always available ────────────────────────────────────
  const handleSkipAll = useCallback(() => {
    if (onComplete) onComplete()
  }, [onComplete])

  // ── Step handlers ──────────────────────────────────────────────────────────
  const handleProfileNext = async () => {
    setSaving(true)
    setError(null)
    // Update profile non-blocking (skip if empty name — let user enter later)
    if (fullName.trim()) {
      supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          role_title: roleTitle.trim() || null,
        },
      }).catch(() => {})
    }
    setSaving(false)
    setStep(1)
  }

  const handleOrgCreate = async () => {
    if (!orgName.trim()) return setError('Nombre de organización requerido')
    setError(null)
    setSaving(true)
    try {
      const newOrg = await createOrganization(orgName.trim(), {
        industry: industry || null,
        team_size: teamSize || null,
      })
      if (newOrg?.id) {
        setNewOrgId(newOrg.id)
        // Fire-and-forget: complete onboarding RPC
        supabase.rpc('complete_onboarding', {
          p_full_name: fullName.trim() || null,
          p_phone: phone.trim() || null,
          p_company: company.trim() || null,
          p_role_title: roleTitle.trim() || null,
          p_default_org_id: newOrg.id,
        }).catch(() => {})
      }
    } catch (err) {
      // Org creation failed — log and continue anyway
      console.warn('[Onboarding] org creation failed, continuing without org:', err)
      setError('No se pudo crear la organización. Puedes configurarla después desde Settings.')
    } finally {
      setSaving(false)
      setStep(2)
    }
  }

  const handleAgentsActivate = useCallback(async () => {
    if (selectedAgents.size === 0) { setStep(3); return }
    setSaving(true)
    try {
      const toImport = VAULT_AGENTS.filter(a => selectedAgents.has(a.code_name))
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
      const rows = toImport.map(a => ({
        code_name:         a.code_name,
        name:              a.name,
        namespace:         a.namespace,
        description:       a.description,
        model:             a.model,
        system_prompt:     a.system_prompt,
        allowed_skills:    a.allowed_skills,
        restricted_skills: [],
        safe_mode:         true,
        max_rounds:        4,
        max_spend_usd:     1.0,
        is_active:         true,
        org_id:            newOrgId || null,
        created_by:        user?.id || null,
        source:            'vault:onboarding',
      }))
      await supabase
        .from('agent_definitions')
        .upsert(rows, { onConflict: 'code_name', ignoreDuplicates: false })
        .catch(() => {})
    } catch {
      // Non-blocking — vault import is best-effort
    } finally {
      setSaving(false)
      setStep(3)
    }
  }, [selectedAgents, newOrgId])

  const toggleAgent = (code_name) => {
    setSelectedAgents(prev => {
      const next = new Set(prev)
      if (next.has(code_name)) next.delete(code_name)
      else next.add(code_name)
      return next
    })
  }

  const handleStripeCheckout = useCallback(async (planId) => {
    setCheckingOut(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('stripe-checkout', {
        body: { plan: planId, org_id: newOrgId },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (data?.url) { window.location.href = data.url; return }
    } catch {
      // Stripe not configured — fall through to free start
    }
    setCheckingOut(false)
    if (onComplete) onComplete()
  }, [newOrgId, onComplete])

  // ── Shared styles ──────────────────────────────────────────────────────────
  const panelWidth = step === 2 ? 560 : 480

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--surface-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: panelWidth,
        background: 'var(--surface-raised)', border: '1px solid var(--border-default)',
        padding: '40px 32px', position: 'relative',
        transition: 'max-width 0.3s',
      }}>
        {/* Accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'var(--accent-primary)',
        }} />

        {/* Step indicator + skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  height: 2,
                  background: i <= step ? 'var(--accent-primary)' : 'var(--border-default)',
                  transition: 'background 0.3s',
                }} />
                <div style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  color: i <= step ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  letterSpacing: '0.1em',
                }}>
                  {s.num} {s.label}
                </div>
              </div>
            ))}
          </div>
          {/* Emergency bypass — always visible */}
          <button
            onClick={handleSkipAll}
            style={{
              marginLeft: 16, fontSize: 10, fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)', background: 'none', border: 'none',
              cursor: 'pointer', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              padding: '2px 0', textDecoration: 'underline',
            }}
          >
            Saltar →
          </button>
        </div>

        {/* ── Step 0: Profile ───────────────────────────────────────────────── */}
        {step === 0 && (
          <>
            <h1 style={titleStyle}>Configura tu perfil</h1>
            <p style={subtitleStyle}>Información del operador principal. Puedes completarla después.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="NOMBRE COMPLETO" value={fullName} onChange={setFullName}
                placeholder="Roberto Ortega" autoFocus />
              <Field label="TELÉFONO" value={phone} onChange={setPhone}
                placeholder="+34 600 000 000" type="tel" />
              <Field label="EMPRESA" value={company} onChange={setCompany}
                placeholder="Tu empresa actual" />
              <Field label="CARGO" value={roleTitle} onChange={setRoleTitle}
                placeholder="CEO, CTO, Director..." />
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button onClick={handleProfileNext} disabled={saving} style={btnStyle(saving)}>
              {saving ? 'GUARDANDO...' : 'CONTINUAR'}
            </button>
          </>
        )}

        {/* ── Step 1: Organization ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 style={titleStyle}>Crea tu organización</h1>
            <p style={subtitleStyle}>Tu centro de operaciones. Podrás invitar miembros después.</p>
            <Field label="NOMBRE *" value={orgName} onChange={setOrgName}
              placeholder="Acme Corp, Stark Industries..." autoFocus />
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>INDUSTRIA</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--surface-base)', border: '1px solid var(--border-default)',
                  color: industry ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
                  boxSizing: 'border-box', cursor: 'pointer', appearance: 'none',
                }}
              >
                <option value="">Selecciona industria</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>TAMAÑO DE EQUIPO</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TEAM_SIZES.map(size => (
                  <button key={size} type="button" onClick={() => setTeamSize(size)}
                    style={{
                      flex: 1, padding: '9px 0',
                      background: teamSize === size ? 'var(--accent-primary)' : 'var(--surface-base)',
                      color: teamSize === size ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      border: `1px solid ${teamSize === size ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.15s',
                    }}>{size}</button>
                ))}
              </div>
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button onClick={() => { setStep(0); setError(null) }}
                style={{ ...btnStyle(false), background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', flex: '0 0 80px', marginTop: 0 }}>
                ATRÁS
              </button>
              <button onClick={handleOrgCreate} disabled={saving || !orgName.trim()}
                style={{ ...btnStyle(saving || !orgName.trim()), flex: 1, marginTop: 0 }}>
                {saving ? 'CREANDO...' : 'ESTABLECER HQ'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Agent Selection ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h1 style={titleStyle}>Activa tus agentes</h1>
            <p style={subtitleStyle}>
              {industry
                ? `Recomendados para ${industry}. Puedes cambiarlos desde Agents.`
                : 'Selecciona los agentes vault que quieres activar.'}
            </p>

            {/* Core agents — always active */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>CORE — SIEMPRE ACTIVOS</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {CORE_AGENTS.map(a => (
                  <div key={a.code_name} style={{
                    flex: 1, padding: '8px 10px',
                    background: 'var(--accent-primary-muted)',
                    border: '1px solid var(--accent-primary)', opacity: 0.7,
                  }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{a.icon}</div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>{a.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.3 }}>{a.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vault agents — selectable */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>VAULT — SELECCIONA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {VAULT_AGENTS.map(a => {
                  const selected = selectedAgents.has(a.code_name)
                  return (
                    <button key={a.code_name} type="button" onClick={() => toggleAgent(a.code_name)}
                      style={{
                        padding: '10px 12px', textAlign: 'left',
                        background: selected ? 'var(--accent-primary-muted)' : 'var(--surface-base)',
                        border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                      }}>
                      {selected && (
                        <div style={{
                          position: 'absolute', top: 6, right: 8,
                          width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)',
                        }} />
                      )}
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{a.icon}</div>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 3 }}>{a.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>{a.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(3)}
                style={{ ...btnStyle(false), background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', flex: '0 0 80px', marginTop: 0 }}>
                OMITIR
              </button>
              <button onClick={handleAgentsActivate} disabled={saving}
                style={{ ...btnStyle(saving), flex: 1, marginTop: 0 }}>
                {saving ? 'ACTIVANDO...' : `ACTIVAR ${selectedAgents.size > 0 ? `${selectedAgents.size} AGENTES` : 'SELECCIÓN'}`}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Ready ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent-primary)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'var(--text-inverse)', fontWeight: 700,
            }}>
              OC
            </div>
            <h1 style={titleStyle}>Sistema operativo listo</h1>
            <p style={subtitleStyle}>¿Quieres empezar gratis o activar un plan ahora?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleStripeCheckout('starter')} disabled={checkingOut}
                style={btnStyle(checkingOut)}>
                {checkingOut ? 'REDIRIGIENDO...' : 'ACTIVAR PLAN STARTER — €49/mes'}
              </button>
              <button
                onClick={() => { if (onComplete) onComplete() }}
                disabled={checkingOut}
                style={{ ...btnStyle(false), marginTop: 0, background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}>
                EMPEZAR GRATIS →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Reusable components ────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', autoFocus }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '10px 12px',
          background: 'var(--surface-base)', border: '1px solid var(--border-default)',
          color: 'var(--text-primary)', fontSize: 13,
          fontFamily: 'var(--font-sans)', outline: 'none',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
      />
    </div>
  )
}

function ErrorMsg({ children }) {
  return (
    <div style={{
      marginTop: 12, padding: '8px 12px', fontSize: 11,
      color: 'var(--color-danger)', background: 'var(--color-danger-muted)',
      border: '1px solid rgba(229,62,62,0.15)', fontFamily: 'var(--font-mono)',
    }}>
      {children}
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const titleStyle = {
  fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
  margin: '0 0 6px', letterSpacing: '-0.02em',
}
const subtitleStyle = {
  fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 24px', lineHeight: 1.5,
}
const labelStyle = {
  display: 'block', fontSize: 9, fontFamily: 'var(--font-mono)',
  color: 'var(--text-tertiary)', letterSpacing: '0.12em',
  marginBottom: 6, textTransform: 'uppercase',
}
function btnStyle(disabled) {
  return {
    width: '100%', padding: '12px 20px', marginTop: 20,
    background: disabled ? 'var(--surface-elevated)' : 'var(--accent-primary)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-inverse)',
    border: 'none', fontSize: 12, fontWeight: 700,
    fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
  }
}
