import React, { useState, useMemo } from 'react';

const initialWorkflows = [
  { id: 1, name: "Lead Qualification", desc: "Scores incoming leads from Typeform and routes to Salesforce based on enrichment data.", active: true, lastRun: "2 mins ago", runs: 142, tags: ["Webhook", "Salesforce"] },
  { id: 2, name: "CRM Sync", desc: "Bi-directional synchronization between Hubspot and internal Postgres data warehouse.", active: true, lastRun: "15 mins ago", runs: 89, tags: ["Schedule", "Postgres"] },
  { id: 3, name: "Report Generation", desc: "Compiles weekly KPI metrics, generates PDF, and emails to executive stakeholders.", active: false, lastRun: "2 days ago", runs: 12, tags: ["Schedule", "Email"] },
  { id: 4, name: "Signal Processing", desc: "Ingests market signals, runs sentiment analysis via OpenAI, and alerts Slack.", active: true, lastRun: "Just now", runs: 3450, tags: ["Agent Event", "AI"] },
  { id: 5, name: "Outreach Sequence", desc: "Triggers personalized email sequences based on user behavior and product usage.", active: true, lastRun: "1 hour ago", runs: 45, tags: ["Webhook", "Email"] },
  { id: 6, name: "Data Enrichment", desc: "Enriches new signups with Clearbit data and updates CRM records automatically.", active: false, lastRun: "5 hours ago", runs: 28, tags: ["Webhook", "Clearbit"] },
];

const kpis = [
  { label: "Active Workflows", value: "12", highlight: true },
  { label: "Executions Today", value: "847" },
  { label: "Success Rate", value: "99.2%" },
  { label: "Avg Time", value: "2.1s" }
];

const navItems = ["Dashboard", "Agents", "Knowledge", "Automation", "Settings"];

const AutomationGenerated = () => {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  const toggleWorkflow = (id) => {
    setWorkflows(workflows.map(wf => wf.id === id ? { ...wf, active: !wf.active } : wf));
  };

  const activeCount = workflows.filter(w => w.active).length;
  const inactiveCount = workflows.length - activeCount;

  return (
    <>
      <style>{`
        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9A9A9A;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.20);
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #008F39;
          --border-default: #E5E5E0;
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: var(--font-sans);
          background-color: var(--bg-canvas);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
        }

        @keyframes breathe-green {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
        }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes flow-dash {
          to { stroke-dashoffset: -20; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .btn-hover:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-hover {
          transition: all 0.2s ease;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <aside style={{ 
          width: '240px', 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0'
        }}>
          <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>OS_CORE</span>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {navItems.map(item => {
              const isActive = item === "Automation";
              return (
                <div key={item} style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#EBE4D8' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {isActive && <div style={{ width: '3px', height: '16px', backgroundColor: 'var(--accent-gold)', borderRadius: '2px', position: 'absolute', left: '12px' }} />}
                  <span style={{ marginLeft: isActive ? '8px' : '0', transition: 'margin 0.2s' }}>{item}</span>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            borderBottom: '1px solid var(--border-default)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 32px',
            backgroundColor: 'var(--bg-canvas)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Automation</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '8px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search workflows..." 
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '6px 12px 6px 32px',
                    fontSize: '13px',
                    width: '200px',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--semantic-success)', animation: 'breathe-green 3s infinite ease-in-out' }}></div>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* SCROLLABLE CONTENT */}
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* HERO CARD */}
            <section style={{
              position: 'relative',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--accent-gold-border)',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {/* Decorative Background */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M -50 40 L 150 40 L 180 70 L 600 70" stroke="var(--accent-gold)" strokeWidth="1" strokeOpacity="0.2" fill="none" strokeDasharray="4 4" style={{ animation: 'flow-dash 20s linear infinite' }} />
                  <path d="M 300 120 L 350 120 L 380 90 L 800 90" stroke="var(--accent-gold)" strokeWidth="1" strokeOpacity="0.2" fill="none" />
                  <circle cx="150" cy="40" r="2.5" fill="var(--accent-gold)" style={{ animation: 'pulse-gold 2s infinite' }} />
                  <circle cx="350" cy="120" r="2.5" fill="var(--accent-gold)" style={{ animation: 'pulse-gold 2s infinite 1s' }} />
                  <circle cx="600" cy="70" r="2.5" fill="var(--accent-gold)" style={{ animation: 'pulse-gold 2s infinite 0.5s' }} />
                </svg>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  n8n Integration Hub
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Workflow Orchestration
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Connected to n8n cloud instance</span>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    backgroundColor: 'var(--semantic-success-bg)', 
                    padding: '4px 8px', borderRadius: '999px' 
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--semantic-success)' }}></div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--semantic-success-text)', letterSpacing: '0.05em' }}>CONNECTED</span>
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{workflows.length} Workflows</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--semantic-success)', fontWeight: 500 }}>{activeCount} Active</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{inactiveCount} Inactive</span>
                </div>
              </div>
            </section>

            {/* KPI ROW */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {kpis.map((kpi, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: `1px solid ${kpi.highlight ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </section>

            {/* ACTIONS & GRID HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Pipelines
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-hover" style={{ 
                  backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)', 
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' 
                }}>
                  Sync All
                </button>
                <button className="btn-hover" style={{ 
                  backgroundColor: 'transparent', border: '1px solid var(--border-default)', borderRadius: '6px', 
                  color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '8px 16px' 
                }}>
                  View in n8n
                </button>
                <button className="btn-hover" style={{ 
                  backgroundColor: 'var(--accent-gold)', border: 'none', borderRadius: '6px', 
                  color: '#1A1A1A', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 16px',
                  boxShadow: '0 2px 4px rgba(255,215,0,0.2)'
                }}>
                  Create Workflow
                </button>
              </div>
            </div>

            {/* WORKFLOW GRID */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', paddingBottom: '32px' }}>
              {workflows.map(wf => (
                <div key={wf.id} style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-default)',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: '8px', 
                        backgroundColor: '#F8F8F8', border: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                        </svg>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{wf.name}</span>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div 
                      onClick={() => toggleWorkflow(wf.id)}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        backgroundColor: wf.active ? 'var(--accent-gold)' : 'var(--border-default)',
                        position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                        position: 'absolute', top: '2px', left: wf.active ? '22px' : '2px',
                        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} />
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>
                    {wf.desc}
                  </p>

                  {/* Meta & Tags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Last run: {wf.lastRun}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{wf.runs.toLocaleString()} runs</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {wf.tags.map(tag => (
                        <span key={tag} style={{
                          backgroundColor: '#F0F0EB',
                          color: 'var(--text-secondary)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </section>

          </div>
        </main>
      </div>
    </>
  );
};

export default AutomationGenerated;