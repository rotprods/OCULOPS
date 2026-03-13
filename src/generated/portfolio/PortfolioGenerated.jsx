import React, { useState, useMemo } from 'react';

const PortfolioGenerated = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const kpis = [
    { label: 'ACTIVE CLIENTS', value: '12', highlight: true },
    { label: 'MONTHLY REVENUE', value: '€45,200' },
    { label: 'LIFETIME VALUE', value: '€1.2M' },
    { label: 'RETENTION RATE', value: '98%' }
  ];

  const clients = [
    { id: 1, name: 'Acme Corp', initials: 'AC', status: 'Active', services: ['AI Automation', 'Content'], revenue: '€4,500/mo', contract: 'Mar 2024 - Mar 2025', health: 92, lastTouch: '2 days ago' },
    { id: 2, name: 'Stark Industries', initials: 'SI', status: 'Onboarding', services: ['Ads Management'], revenue: '€8,000/mo', contract: 'Apr 2024 - Apr 2025', health: 75, lastTouch: '5 hrs ago' },
    { id: 3, name: 'Wayne Enterprises', initials: 'WE', status: 'Active', services: ['AI Automation', 'Ads Management'], revenue: '€12,500/mo', contract: 'Jan 2024 - Dec 2025', health: 98, lastTouch: '1 day ago' },
    { id: 4, name: 'Globex', initials: 'GL', status: 'At Risk', services: ['Content'], revenue: '€2,000/mo', contract: 'Jun 2023 - Jun 2024', health: 45, lastTouch: '12 days ago' },
  ];

  const chartData = [
    { month: 'Jan', active: 30, churned: 5 },
    { month: 'Feb', active: 35, churned: 2 },
    { month: 'Mar', active: 40, churned: 8 },
    { month: 'Apr', active: 45, churned: 0 },
    { month: 'May', active: 55, churned: 4 },
    { month: 'Jun', active: 65, churned: 2 },
    { month: 'Jul', active: 70, churned: 5 },
    { month: 'Aug', active: 85, churned: 0 },
  ];

  const maxChartValue = 100;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Active': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)' };
      case 'Onboarding': return { bg: 'var(--semantic-warning-bg)', text: 'var(--semantic-warning-text)' };
      case 'At Risk': return { bg: 'var(--semantic-error-bg)', text: 'var(--semantic-error-text)' };
      default: return { bg: '#F0F0EE', text: 'var(--text-secondary)' };
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --bg-canvas: #FAFAF8;
            --bg-sidebar: #F5F0E8;
            --bg-card: #FFFFFF;
            --text-primary: #1A1A1A;
            --text-secondary: #6B6B6B;
            --text-tertiary: #9A9A9A;
            --accent-gold: #FFD700;
            --accent-gold-hover: #F0C800;
            --border-default: #E5E5E0;
            --semantic-success-bg: #E6F5EC;
            --semantic-success-text: #008F39;
            --semantic-warning-bg: #FFFCE6;
            --semantic-warning-text: #A68900;
            --semantic-error-bg: #FEF2F2;
            --semantic-error-text: #B91C1C;
            --semantic-error: #EF4444;
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

          @keyframes pulse-dot {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          @keyframes heartbeat-line {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }

          .card {
            background: var(--bg-card);
            border: 1px solid var(--border-default);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }

          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
        
        {/* SIDEBAR */}
        <aside style={{ width: '240px', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
          <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--accent-gold)', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>OS.CORE</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {['Dashboard', 'Portfolio', 'Intelligence', 'Operations', 'Settings'].map((item) => (
              <div 
                key={item}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: item === 'Portfolio' ? '#EBE4D8' : 'transparent',
                  color: item === 'Portfolio' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: item === 'Portfolio' ? '600' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {item === 'Portfolio' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                )}
                {item !== 'Portfolio' && <div style={{ width: '16px' }}></div>}
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <header style={{ height: '56px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', backgroundColor: 'var(--bg-canvas)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Portfolio</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-card)',
                    fontSize: '13px',
                    width: '240px',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--semantic-error)', animation: 'pulse-dot 2s infinite' }}></div>
                <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* SCROLLABLE AREA */}
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* HERO SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>Client Portfolio</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active client relationships and revenue tracking</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-default)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Client Health Report
                  </button>
                  <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-gold)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(255,215,0,0.2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Client
                  </button>
                </div>
                {/* Heartbeat Bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: 'var(--border-default)', overflow: 'hidden' }}>
                  <div style={{ width: '100px', height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)', animation: 'heartbeat-line 3s ease-in-out infinite' }}></div>
                </div>
              </div>

              {/* KPI ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {kpis.map((kpi, idx) => (
                  <div key={idx} className="card" style={{ border: kpi.highlight ? '1px solid var(--accent-gold)' : '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{kpi.label}</span>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{kpi.value}</span>
                  </div>
                ))}
              </div>

              {/* CLIENT CARDS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {clients.map(client => {
                  const statusStyle = getStatusStyles(client.status);
                  const healthRadius = 18;
                  const healthCircumference = 2 * Math.PI * healthRadius;
                  const healthOffset = healthCircumference - (client.health / 100) * healthCircumference;

                  return (
                    <div key={client.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {client.initials}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{client.name}</h3>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {client.services.map(service => (
                                <span key={service} style={{ padding: '2px 8px', backgroundColor: '#F0F0EE', borderRadius: '100px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                          {client.status}
                        </span>
                      </div>

                      <div style={{ height: '1px', backgroundColor: 'var(--border-default)', width: '100%' }}></div>

                      {/* Card Body */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{client.revenue}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Contract: {client.contract}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Health Score</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Last touch: {client.lastTouch}</span>
                          </div>
                          <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="40" height="40" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                              <circle cx="20" cy="20" r={healthRadius} fill="none" stroke="var(--border-default)" strokeWidth="3" />
                              <circle 
                                cx="20" cy="20" r={healthRadius} 
                                fill="none" 
                                stroke="var(--accent-gold)" 
                                strokeWidth="3" 
                                strokeDasharray={healthCircumference} 
                                strokeDashoffset={healthOffset} 
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                              />
                            </svg>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', zIndex: 1 }}>{client.health}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* REVENUE CHART */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Revenue Trajectory</h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-gold)', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active MRR</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--border-default)', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Churned</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '200px', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: '24px', paddingTop: '20px' }}>
                  {/* Goal Line */}
                  <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, borderTop: '1px dashed var(--accent-gold)', opacity: 0.5, zIndex: 0 }}>
                    <span style={{ position: 'absolute', right: 0, top: '-18px', fontSize: '10px', color: 'var(--accent-gold)', fontWeight: '600' }}>GOAL €100k</span>
                  </div>
                  
                  {/* Y-Axis Labels (Mock) */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    <span>100k</span>
                    <span>50k</span>
                    <span>0</span>
                  </div>

                  {/* Bars Container */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', marginLeft: '40px', zIndex: 1 }}>
                    {chartData.map((data) => {
                      const activeHeight = (data.active / maxChartValue) * 100;
                      const churnedHeight = (data.churned / maxChartValue) * 100;
                      
                      return (
                        <div key={data.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '40px' }}>
                          <div style={{ width: '24px', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px' }}>
                            {data.churned > 0 && (
                              <div style={{ width: '100%', height: `${churnedHeight}%`, backgroundColor: 'var(--border-default)', borderRadius: '2px 2px 0 0', transition: 'height 0.5s ease' }}></div>
                            )}
                            <div style={{ width: '100%', height: `${activeHeight}%`, backgroundColor: 'var(--accent-gold)', borderRadius: data.churned > 0 ? '0' : '2px 2px 0 0', transition: 'height 0.5s ease' }}></div>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>{data.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PortfolioGenerated;