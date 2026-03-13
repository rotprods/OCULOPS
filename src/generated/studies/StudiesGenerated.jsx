import React, { useState, useMemo } from 'react';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg-canvas: #FAFAF8;
    --bg-sidebar: #F5F0E8;
    --bg-card: #FFFFFF;
    --text-primary: #1A1A1A;
    --text-secondary: #6B6B6B;
    --text-tertiary: #9A9A9A;
    --accent-gold: #FFD700;
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
    background-color: var(--bg-canvas);
    font-family: var(--font-sans);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  @keyframes pulse-dot {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  @keyframes heartbeat-bar {
    0% { transform: translateX(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(100%); opacity: 0; }
  }

  @keyframes gold-glow {
    0% { box-shadow: 0 0 4px rgba(255, 215, 0, 0.2); }
    50% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.6); }
    100% { box-shadow: 0 0 4px rgba(255, 215, 0, 0.2); }
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const mockStudies = [
  {
    id: 1,
    title: "AI Services Market Spain 2026",
    agents: ["ORACLE", "SENTINEL"],
    date: "Mar 8, 2026",
    tags: ["Market Analysis", "Spain", "AI"],
    confidence: 87,
    finding: "Enterprise AI adoption in Spain projected to accelerate by 42% YoY, driven by regional banking sector compliance needs."
  },
  {
    id: 2,
    title: "Restaurant Digital Transformation",
    agents: ["NEXUS", "OBSERVER"],
    date: "Mar 5, 2026",
    tags: ["Hospitality", "SaaS", "Trends"],
    confidence: 92,
    finding: "Automated inventory management systems show a 15% reduction in food waste within the first quarter of implementation."
  },
  {
    id: 3,
    title: "E-commerce Customer Acquisition Costs",
    agents: ["ORACLE", "METRIC"],
    date: "Mar 1, 2026",
    tags: ["E-commerce", "Marketing", "CAC"],
    confidence: 78,
    finding: "Paid social CAC has stabilized, but organic retention loops are now responsible for 60% of LTV growth in top decile brands."
  },
  {
    id: 4,
    title: "European EV Infrastructure Rollout",
    agents: ["SENTINEL", "GRID"],
    date: "Feb 26, 2026",
    tags: ["Energy", "Automotive", "EU"],
    confidence: 85,
    finding: "Fast-charging network density in DACH region reaching saturation; investment shifting towards grid-balancing software."
  },
  {
    id: 5,
    title: "B2B SaaS Pricing Models 2026",
    agents: ["ORACLE"],
    date: "Feb 20, 2026",
    tags: ["SaaS", "Pricing", "Strategy"],
    confidence: 95,
    finding: "Usage-based pricing models are evolving into hybrid tiers, combining predictable base MRR with variable compute overages."
  },
  {
    id: 6,
    title: "Supply Chain Resilience Index",
    agents: ["OBSERVER", "SENTINEL"],
    date: "Feb 15, 2026",
    tags: ["Logistics", "Global", "Risk"],
    confidence: 81,
    finding: "Nearshoring to Mexico and Eastern Europe has reduced average transit delays by 18 days compared to 2023 baselines."
  }
];

const pipelineStages = [
  { name: "Queued", count: 2, status: "past" },
  { name: "Researching", count: 1, status: "past" },
  { name: "Writing", count: 1, status: "active" },
  { name: "Review", count: 0, status: "future" },
  { name: "Published", count: 14, status: "future" }
];

const MicroscopeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 1 0 0-14h-1" />
    <path d="M9 14h2" />
    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const AgentIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

export default function StudiesGenerated() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '240px', 
        backgroundColor: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#1A1A1A', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--accent-gold)', borderRadius: '50%' }} />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>OS.CORE</span>
        </div>

        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ padding: '0 12px', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Overview</div>
            <div style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Dashboard</div>
            <div style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Agents</div>
          </div>

          <div>
            <div style={{ padding: '0 12px', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Intelligence</div>
            <div style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Data Streams</div>
            <div style={{ 
              padding: '8px 12px', 
              fontSize: '14px', 
              color: 'var(--text-primary)', 
              backgroundColor: '#EBE4D8', 
              borderRadius: '6px', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--accent-gold)', borderRadius: '50%' }} />
              Studies
            </div>
            <div style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Knowledge Graph</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
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
            <div style={{ color: 'var(--text-secondary)' }}>
              <MicroscopeIcon />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Studies</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: '20px' }}>
              <SearchIcon />
              <span style={{ fontSize: '13px' }}>Search research...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#10B981' }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE AREA */}
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO CARD */}
            <div style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-default)', 
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, height: '2px', 
                background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
                animation: 'heartbeat-bar 3s ease-in-out infinite'
              }} />
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>Research Intelligence</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Agent-generated studies and market analysis</p>
            </div>

            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--accent-gold)', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Studies Published</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>14</div>
              </div>
              <div style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-default)', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>In Progress</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>3</div>
              </div>
              <div style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-default)', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Agents Contributing</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>4</div>
              </div>
            </div>

            {/* STUDY GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {mockStudies.map((study) => (
                <div key={study.id} style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-default)', 
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.4, paddingRight: '16px' }}>{study.title}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Published {study.date}</div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    <AgentIcon />
                    <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      by {study.agents.join(' + ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {study.tags.map(tag => (
                      <span key={tag} style={{ 
                        backgroundColor: '#F0F0EB', 
                        color: 'var(--text-secondary)', 
                        fontSize: '11px', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      <span>Confidence Score</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{study.confidence}%</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: '#F0F0EE', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${study.confidence}%`, height: '100%', backgroundColor: 'var(--accent-gold)' }} />
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    fontStyle: 'italic', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    marginBottom: '24px',
                    flex: 1
                  }}>
                    "{study.finding}"
                  </div>

                  <button style={{ 
                    width: '100%', 
                    padding: '10px', 
                    backgroundColor: 'transparent', 
                    border: '1px solid var(--border-default)', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  >
                    Read Study
                  </button>
                </div>
              ))}
            </div>

            {/* STUDY PIPELINE */}
            <div style={{ 
              marginTop: '16px',
              backgroundColor: 'var(--bg-card)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-default)', 
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '32px' }}>
                Research Pipeline
              </div>
              
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Connecting Line */}
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  left: '20px', 
                  right: '20px', 
                  height: '1px', 
                  backgroundColor: 'rgba(255,215,0,0.2)', 
                  zIndex: 0 
                }} />

                {pipelineStages.map((stage, idx) => {
                  const isActive = stage.status === 'active';
                  const isPast = stage.status === 'past';
                  
                  return (
                    <div key={stage.name} style={{ 
                      position: 'relative', 
                      zIndex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '12px',
                      backgroundColor: 'var(--bg-card)',
                      padding: '0 16px'
                    }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: isActive ? 'var(--accent-gold)' : (isPast ? '#FAFAF8' : '#FFFFFF'),
                        border: `2px solid ${isActive ? 'var(--accent-gold)' : (isPast ? 'var(--accent-gold)' : 'var(--border-default)')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: isActive ? 'gold-glow 2s infinite' : 'none'
                      }}>
                        {isPast && <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-gold)', borderRadius: '50%' }} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: isActive ? 600 : 500, 
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {stage.name}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontFamily: 'var(--font-mono)', 
                          color: 'var(--text-tertiary)' 
                        }}>
                          ({stage.count})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}