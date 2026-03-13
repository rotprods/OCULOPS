import React, { useState, useMemo } from 'react';

const mockOpportunities = [
  { id: 'OPP-082', name: 'Enterprise Q3 Expansion', company: 'Acme Corp', value: 8500, probability: 88, score: 94, agent: 'Alpha-1', nextAction: 'Draft Proposal' },
  { id: 'OPP-091', name: 'Global API License', company: 'TechFlow Systems', value: 9200, probability: 65, score: 81, agent: 'Beta-2', nextAction: 'Technical Review' },
  { id: 'OPP-104', name: 'Data Pipeline Integration', company: 'Nexus Industries', value: 4500, probability: 92, score: 88, agent: 'Alpha-1', nextAction: 'Contract Sent' },
  { id: 'OPP-112', name: 'Standard Tier Upgrade', company: 'CloudSync', value: 1200, probability: 35, score: 42, agent: 'Gamma-3', nextAction: 'Follow-up Call' },
  { id: 'OPP-118', name: 'Security Audit Module', company: 'FinSecure', value: 6800, probability: 45, score: 58, agent: 'Beta-2', nextAction: 'Stakeholder Mtg' },
  { id: 'OPP-125', name: 'Pilot Program Initiation', company: 'Innovate Inc', value: 2500, probability: 75, score: 72, agent: 'Alpha-1', nextAction: 'Demo Scheduled' },
  { id: 'OPP-130', name: 'Legacy System Migration', company: 'OldBank Corp', value: 7500, probability: 20, score: 35, agent: 'Gamma-3', nextAction: 'Nurture Campaign' },
  { id: 'OPP-135', name: 'Predictive Analytics Add-on', company: 'RetailGiant', value: 5400, probability: 80, score: 85, agent: 'Beta-2', nextAction: 'Pricing Approval' },
];

const kpis = [
  { label: 'HIGH PRIORITY', value: '8', highlight: true },
  { label: 'TOTAL VALUE', value: '€47,500', highlight: false },
  { label: 'AVG CONFIDENCE', value: '72%', highlight: false },
  { label: 'NEW THIS WEEK', value: '3', highlight: false },
];

const OpportunitiesGenerated = () => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const sortedOpps = useMemo(() => {
    return [...mockOpportunities].sort((a, b) => b.score - a.score);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-canvas)',
      fontFamily: 'var(--font-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          --semantic-success: #22C55E;
          --semantic-warning: #F59E0B;
          --semantic-error: #EF4444;
          
          --font-primary: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .matrix-grid {
          background-image: 
            linear-gradient(var(--border-subtle) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
          background-size: 10% 10%;
        }

        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .table-row:hover {
          background-color: #FDFDFD;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px' }}></div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>OS_CORE</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', padding: '0 12px', marginBottom: '8px' }}>OVERVIEW</div>
            <NavItem icon="Dashboard" label="Command Center" />
            <NavItem icon="Analytics" label="Performance" />
          </div>

          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', padding: '0 12px', marginBottom: '8px' }}>INTELLIGENCE</div>
            <NavItem icon="Signals" label="Market Signals" />
            <NavItem icon="Target" label="Opportunities" active />
            <NavItem icon="Radar" label="Competitor Intel" />
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <h1 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em' }}>Opportunities</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-default)',
              borderRadius: '999px',
              padding: '6px 16px',
              width: '240px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search opportunities..." 
                style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', backgroundColor: 'transparent', fontFamily: 'var(--font-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--semantic-success)', animation: 'breathe 2s infinite' }}></div>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="scroll-hide" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          {/* HERO & ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Opportunity Matrix</h2>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--accent-gold)',
                  animation: 'pulse-gold 2s infinite'
                }}></div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI-scored opportunities ranked by potential and confidence</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid var(--border-default)',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}>Export Matrix</button>
              <button style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid var(--border-default)',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}>Re-score All</button>
              <button style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(255,215,0,0.4)',
                backgroundColor: 'var(--accent-gold-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#9D7A39',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>+</span> Add Opportunity
              </button>
            </div>
          </div>

          {/* KPI ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${kpi.highlight ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>

          {/* MAIN CARD: MATRIX + TABLE */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            
            {/* SCORING MATRIX */}
            <div style={{ padding: '32px', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Scoring Distribution</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,215,0,0.3)', border: '1px solid var(--accent-gold)' }}></div>
                    High Score (>75)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E5E5E0' }}></div>
                    Standard
                  </div>
                </div>
              </div>

              <div className="matrix-grid" style={{
                position: 'relative',
                height: '360px',
                width: '100%',
                borderLeft: '1px solid var(--border-default)',
                borderBottom: '1px solid var(--border-default)',
              }}>
                {/* Top Right Quadrant Highlight */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '50%',
                  height: '50%',
                  backgroundColor: 'rgba(255,215,0,0.04)',
                  pointerEvents: 'none'
                }}></div>

                {/* Axes Labels */}
                <div style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Revenue Potential (€0 - €10k)</div>
                <div style={{ position: 'absolute', top: '50%', left: '-32px', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Win Probability (0% - 100%)</div>

                {/* Data Points */}
                {mockOpportunities.map((opp) => {
                  const xPos = (opp.value / 10000) * 100;
                  const yPos = opp.probability;
                  const size = Math.max(20, (opp.value / 10000) * 60);
                  const isHigh = opp.score > 75;

                  return (
                    <div
                      key={opp.id}
                      onMouseEnter={() => setHoveredPoint(opp.id)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        position: 'absolute',
                        left: `${xPos}%`,
                        bottom: `${yPos}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        transform: 'translate(-50%, 50%)',
                        backgroundColor: isHigh ? 'rgba(255,215,0,0.3)' : '#E5E5E0',
                        border: isHigh ? '1px solid var(--accent-gold)' : '1px solid #D1D1D1',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        zIndex: hoveredPoint === opp.id ? 10 : 1
                      }}
                    >
                      {hoveredPoint === opp.id && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translate(-50%, -8px)',
                          backgroundColor: '#1A1A1A',
                          color: '#FFF',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 20
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '2px' }}>{opp.company}</div>
                          <div style={{ color: '#A1A1AA', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>€{opp.value.toLocaleString()} | {opp.probability}% win</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPPORTUNITY TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-canvas)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Opportunity</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Company</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Value</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confidence</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: '#9D7A39', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'rgba(255,215,0,0.15)' }}>Score</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Agent</th>
                    <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOpps.slice(0, 6).map((opp) => (
                    <tr key={opp.id} className="table-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{opp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{opp.id}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{opp.company}</td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>€{opp.value.toLocaleString()}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: opp.probability > 70 ? 'var(--semantic-success)' : opp.probability > 40 ? 'var(--semantic-warning)' : 'var(--semantic-error)' 
                          }}></div>
                          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{opp.probability}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', backgroundColor: 'rgba(255,215,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, width: '24px' }}>{opp.score}</span>
                          <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${opp.score}%`, height: '100%', backgroundColor: 'var(--accent-gold)', borderRadius: '2px' }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', backgroundColor: '#F5F5F5', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {opp.agent}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{opp.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ height: '32px' }}></div> {/* Bottom padding */}
        </div>
      </main>
    </div>
  );
};

// Simple NavItem component for sidebar
const NavItem = ({ icon, label, active }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      margin: '0 12px 4px 12px',
      borderRadius: '8px',
      backgroundColor: active ? '#EBE4D8' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ width: '16px', height: '16px', opacity: active ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Placeholder for icons, using simple shapes to avoid external dependencies */}
        {icon === 'Target' ? (
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
        ) : icon === 'Dashboard' ? (
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        ) : icon === 'Analytics' ? (
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        ) : icon === 'Signals' ? (
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
        ) : (
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        )}
      </div>
      <span style={{ fontSize: '14px', fontWeight: active ? 600 : 500 }}>{label}</span>
    </div>
  );
};

export default OpportunitiesGenerated;