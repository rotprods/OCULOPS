import React, { useState, useMemo } from 'react';

const ReportsGenerated = () => {
  const [activeReport, setActiveReport] = useState(1);

  const reports = [
    { id: 1, title: "Weekly Intelligence Brief", agent: "SCRIBE", date: "Mar 10, 2026", pages: 14, status: "Ready", type: "intelligence", color: "#FFD700" },
    { id: 2, title: "Q1 Financial Summary", agent: "QUANTS", date: "Mar 09, 2026", pages: 8, status: "Ready", type: "financial", color: "#3B82F6" },
    { id: 3, title: "System Performance Metrics", agent: "ATLAS", date: "Mar 08, 2026", pages: 12, status: "Generating", type: "performance", color: "#10B981" },
    { id: 4, title: "Global Market Analysis", agent: "SCRIBE", date: "Mar 05, 2026", pages: 22, status: "Ready", type: "intelligence", color: "#FFD700" },
    { id: 5, title: "Security Audit Log", agent: "SENTINEL", date: "Mar 01, 2026", pages: 5, status: "Draft", type: "security", color: "#6B6B6B" },
    { id: 6, title: "Competitor Intel Report", agent: "SCRIBE", date: "Feb 28, 2026", pages: 18, status: "Ready", type: "intelligence", color: "#FFD700" },
  ];

  const kpis = [
    { label: "REPORTS GENERATED", value: "12", sub: "This month", highlight: true },
    { label: "PENDING REVIEW", value: "3", sub: "Requires attention", highlight: false },
    { label: "CADENCE", value: "Weekly", sub: "Next run: Friday", highlight: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-hover: #FDFDFD;
          --bg-sidebar-hover: #EBE4D8;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --text-inverse: #FFFFFF;
          
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-text: #B29600;
          
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #008F39;
          --semantic-error: #EF4444;
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
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

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
        
        {/* SIDEBAR */}
        <div style={{ 
          width: '240px', 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--accent-gold)', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>OS_CORE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SidebarSection title="SYSTEM">
              <SidebarItem icon="grid" label="Overview" />
              <SidebarItem icon="cpu" label="Agents" />
              <SidebarItem icon="database" label="Knowledge Base" />
            </SidebarSection>

            <SidebarSection title="ANALYTICS">
              <SidebarItem icon="file-text" label="Reports" active />
              <SidebarItem icon="activity" label="Performance" />
            </SidebarSection>

            <SidebarSection title="ADMIN">
              <SidebarItem icon="settings" label="Settings" />
            </SidebarSection>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            backgroundColor: 'var(--bg-canvas)', 
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Reports</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-default)',
                borderRadius: '20px',
                padding: '6px 16px',
                width: '240px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search reports..." 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%', color: 'var(--text-primary)' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--semantic-error)', animation: 'breathe 2s infinite ease-in-out' }}></div>
                <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* SCROLLABLE AREA */}
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO & ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Intelligence Reports</h1>
                  <div style={{ width: '32px', height: '4px', backgroundColor: 'var(--accent-gold)', borderRadius: '2px', animation: 'breathe 3s infinite' }}></div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Auto-generated reports from agent analysis and system metrics.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ 
                  padding: '10px 16px', 
                  backgroundColor: 'transparent', 
                  border: '1px solid var(--border-default)', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}>
                  Schedule Reports
                </button>
                <button style={{ 
                  padding: '10px 16px', 
                  backgroundColor: 'var(--accent-gold)', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(255,215,0,0.2)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Generate New Report
                </button>
              </div>
            </div>

            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {kpis.map((kpi, i) => (
                <div key={i} style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  padding: '20px',
                  border: `1px solid ${kpi.highlight ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {kpi.highlight && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', backgroundColor: 'var(--accent-gold)' }}></div>}
                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '8px' }}>{kpi.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{kpi.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{kpi.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTENT SPLIT */}
            <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
              
              {/* REPORT LIST */}
              <div style={{ 
                flex: '1 1 65%', 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-default)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '16px', textTransform: 'uppercase' }}>
                  Recent Documents
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.map((report) => (
                    <div 
                      key={report.id}
                      onClick={() => setActiveReport(report.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '16px', 
                        backgroundColor: activeReport === report.id ? 'var(--bg-hover)' : 'var(--bg-card)',
                        border: `1px solid ${activeReport === report.id ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Icon Container */}
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '8px', 
                        backgroundColor: `${report.color}15`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '16px',
                        flexShrink: 0
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={report.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {report.type === 'intelligence' && <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>}
                          {report.type === 'intelligence' && <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>}
                          {report.type === 'financial' && <line x1="12" y1="1" x2="12" y2="23"></line>}
                          {report.type === 'financial' && <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>}
                          {report.type === 'performance' && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>}
                          {report.type === 'security' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>}
                        </svg>
                      </div>

                      {/* Meta */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {report.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Generated by <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{report.agent}</span></span>
                          <span style={{ color: 'var(--border-default)' }}>|</span>
                          <span>{report.date}</span>
                          <span style={{ color: 'var(--border-default)' }}>|</span>
                          <span>{report.pages} pages</span>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <StatusPill status={report.status} />
                        <button style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-tertiary)', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PREVIEW PANEL */}
              <div style={{ 
                flex: '0 0 35%', 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--border-default)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-canvas)'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Preview: Weekly Intelligence Brief</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </div>
                
                {/* Simulated Document Area */}
                <div className="hide-scrollbar" style={{ 
                  flex: 1, 
                  padding: '32px', 
                  backgroundColor: '#FFFFFF',
                  overflowY: 'auto',
                  position: 'relative'
                }}>
                  {/* Scroll Indicator Line */}
                  <div style={{ position: 'absolute', right: '4px', top: '32px', bottom: '32px', width: '2px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px' }}>
                    <div style={{ width: '100%', height: '20%', backgroundColor: 'var(--border-default)', borderRadius: '2px' }}></div>
                  </div>

                  <div style={{ maxWidth: '100%', paddingRight: '16px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>CONFIDENTIAL // INTERNAL</div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px', lineHeight: 1.2 }}>Weekly Intelligence Brief: Market Sentiment & Competitor Action</h2>
                    
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>DATE</div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>2026-03-10</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>AUTHOR</div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>AGENT_SCRIBE</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>CONFIDENCE</div>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--semantic-success)' }}>94.2%</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>1. Executive Summary</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                      Analysis of 42,000 data points across global markets indicates a <strong style={{ color: 'var(--text-primary)' }}>shift towards defensive asset allocation</strong>. Competitor Alpha has increased marketing spend by 14% in the APAC region, suggesting an upcoming product launch.
                    </p>

                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>2. Key Metrics Tracker</h3>
                    <div style={{ 
                      backgroundColor: 'var(--bg-canvas)', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '24px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sentiment Index</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>+4.2%</div>
                        </div>
                        {/* Mini Sparkline */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px' }}>
                          {[4, 7, 5, 8, 12, 10, 16].map((h, i) => (
                            <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: i === 6 ? 'var(--accent-gold)' : 'var(--border-default)', borderRadius: '1px' }}></div>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Positive momentum detected in tech sector mentions. <span style={{ color: 'var(--accent-gold-text)', fontWeight: '500' }}>Anomaly detected in supply chain chatter.</span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>3. Strategic Recommendations</h3>
                    <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '16px', margin: 0 }}>
                      <li style={{ marginBottom: '8px' }}>Accelerate deployment of Project Orion to counter APAC push.</li>
                      <li style={{ marginBottom: '8px' }}>Hedge currency exposure in emerging markets for Q2.</li>
                      <li>Initiate deep-dive analysis on supply chain anomalies.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Sub-components for cleaner code
const SidebarSection = ({ title, children }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '12px', padding: '0 8px' }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {children}
    </div>
  </div>
);

const SidebarItem = ({ icon, label, active }) => {
  const getIcon = (name) => {
    switch(name) {
      case 'grid': return <path d="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"/>;
      case 'cpu': return <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>;
      case 'database': return <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>;
      case 'file-text': return <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>;
      case 'activity': return <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>;
      case 'settings': return <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>;
      default: return null;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '8px 12px', 
      borderRadius: '6px',
      backgroundColor: active ? 'var(--bg-sidebar-hover)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {getIcon(icon)}
      </svg>
      <span style={{ fontSize: '13px', fontWeight: active ? '600' : '500' }}>{label}</span>
    </div>
  );
};

const StatusPill = ({ status }) => {
  let bg, text, dot, animation;
  
  switch(status) {
    case 'Ready':
      bg = 'var(--semantic-success-bg)';
      text = 'var(--semantic-success-text)';
      dot = 'var(--semantic-success)';
      break;
    case 'Generating':
      bg = 'var(--accent-gold-muted)';
      text = 'var(--accent-gold-text)';
      dot = 'var(--accent-gold)';
      animation = 'pulse-gold 2s infinite';
      break;
    default:
      bg = 'var(--border-subtle)';
      text = 'var(--text-secondary)';
      dot = 'var(--text-tertiary)';
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px', 
      padding: '4px 10px', 
      backgroundColor: bg, 
      borderRadius: '12px',
      width: 'fit-content'
    }}>
      <div style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        backgroundColor: dot,
        animation: animation
      }}></div>
      <span style={{ fontSize: '11px', fontWeight: '600', color: text }}>{status}</span>
    </div>
  );
};

export default ReportsGenerated;