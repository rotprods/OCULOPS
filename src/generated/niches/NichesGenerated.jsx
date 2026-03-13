import React, { useState, useMemo } from 'react';

// --- Icons (Inline SVGs to avoid dependencies) ---
const IconLayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 12 12 17 22 12"></polyline>
    <polyline points="2 17 12 22 22 17"></polyline>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconTrendingUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const IconTrendingDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const IconTrendingFlat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// --- Mock Data ---
const nichesData = [
  { id: 1, name: 'E-commerce', trend: 'up', tam: '€2.4B', growth: '+12%', competitors: 8, oppScore: 85, icpMatch: 92, tags: ['High Margin', 'Scaleable'] },
  { id: 2, name: 'Healthcare Clinics', trend: 'up', tam: '€1.8B', growth: '+8%', competitors: 4, oppScore: 72, icpMatch: 88, tags: ['Regulated', 'Sticky'] },
  { id: 3, name: 'Real Estate', trend: 'flat', tam: '€5.2B', growth: '+2%', competitors: 15, oppScore: 45, icpMatch: 60, tags: ['Saturated', 'High Ticket'] },
  { id: 4, name: 'SaaS B2B', trend: 'up', tam: '€3.1B', growth: '+18%', competitors: 22, oppScore: 68, icpMatch: 75, tags: ['Competitive', 'Recurring'] },
  { id: 5, name: 'Restaurants', trend: 'down', tam: '€800M', growth: '-4%', competitors: 50, oppScore: 20, icpMatch: 40, tags: ['Low Margin', 'High Churn'] },
  { id: 6, name: 'Legal Services', trend: 'flat', tam: '€1.2B', growth: '+3%', competitors: 12, oppScore: 55, icpMatch: 65, tags: ['Traditional', 'High LTV'] },
];

const graphNodes = [
  { id: 'n1', label: 'E-commerce', x: 20, y: 30, r: 8 },
  { id: 'n2', label: 'SaaS', x: 80, y: 20, r: 6 },
  { id: 'n3', label: 'Health', x: 75, y: 75, r: 7 },
  { id: 'n4', label: 'Fintech', x: 25, y: 80, r: 5 },
  { id: 'n5', label: 'Real Estate', x: 10, y: 55, r: 4 },
];

// --- Components ---

const CircularProgress = ({ percentage }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="3"
        />
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)' }}>
        {percentage}%
      </span>
    </div>
  );
};

export default function NichesGenerated() {
  const [activeNav] = useState('Niches');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-knowledge: #F8F8F8;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --text-muted-label: #99948D;
          
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.30);
          
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #008F39;
          --semantic-error: #EF4444;
          
          --border-default: #E5E5E0;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.04);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: var(--font-sans);
          background-color: var(--bg-canvas);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
        }

        /* Animations */
        @keyframes pulse-live {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes float-node {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Utility Classes */
        .label-caps {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted-label);
          font-weight: 600;
        }
        
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-card);
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary {
          background: var(--accent-gold);
          color: var(--text-primary);
          border: 1px solid transparent;
        }
        .btn-primary:hover { background: var(--accent-gold-hover); }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }
        .btn-outline:hover { border-color: var(--text-secondary); }
        .btn-ghost {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
        }
        .btn-ghost:hover { color: var(--text-primary); }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #D1D1CC; }
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
            <div style={{ width: '24px', height: '24px', background: 'var(--text-primary)', borderRadius: '4px' }}></div>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>OS.</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['Dashboard', 'Niches', 'Agents', 'Settings'].map(item => (
              <div key={item} style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: item === activeNav ? '600' : '400',
                color: item === activeNav ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: item === activeNav ? '#EBE4D8' : 'transparent',
                borderLeft: item === activeNav ? '3px solid var(--accent-gold)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
          
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
              <IconLayers />
              <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Niches</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                padding: '6px 12px', borderRadius: '20px', width: '240px'
              }}>
                <span style={{ color: 'var(--text-tertiary)' }}><IconSearch /></span>
                <input 
                  type="text" 
                  placeholder="Search markets..." 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%', fontFamily: 'var(--font-sans)' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  backgroundColor: 'var(--semantic-success)',
                  animation: 'pulse-live 2s infinite'
                }}></div>
                <span className="label-caps" style={{ color: 'var(--text-primary)' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* SCROLLABLE AREA */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1080px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* TOP SECTION: HERO & KPIs */}
              <div style={{ display: 'flex', gap: '20px', height: '300px' }}>
                
                {/* HERO CARD (Knowledge Graph) */}
                <div className="card" style={{ flex: '6', position: 'relative', overflow: 'hidden', padding: 0, background: 'var(--bg-knowledge)' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                    <span className="label-caps">Market Topology</span>
                  </div>
                  
                  {/* SVG Graph */}
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <defs>
                      <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255,215,0,0.4)" />
                        <stop offset="50%" stopColor="rgba(255,215,0,0.1)" />
                        <stop offset="100%" stopColor="rgba(255,215,0,0)" />
                      </radialGradient>
                    </defs>
                    
                    {/* Edges */}
                    {graphNodes.map((node, i) => (
                      <line key={`edge-${i}`} x1="50%" y1="50%" x2={`${node.x}%`} y2={`${node.y}%`} stroke="var(--accent-gold)" strokeWidth="1" opacity="0.2" />
                    ))}
                    
                    {/* Central Orb */}
                    <g style={{ animation: 'orb-breathe 4s ease-in-out infinite' }}>
                      <circle cx="50%" cy="50%" r="100" fill="url(#goldGlow)" />
                      <circle cx="50%" cy="50%" r="20" fill="var(--accent-gold)" opacity="0.8" />
                    </g>

                    {/* Surrounding Nodes */}
                    {graphNodes.map((node, i) => (
                      <g key={node.id} style={{ animation: `float-node ${3 + i}s ease-in-out infinite alternate` }}>
                        <circle cx={`${node.x}%`} cy={`${node.y}%`} r={node.r} fill="var(--accent-gold)" opacity="0.6" />
                        <text x={`${node.x}%`} y={`${node.y + 6}%`} fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* KPI STACK */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '3px solid var(--accent-gold)' }}>
                    <span className="label-caps">Active Niches Monitored</span>
                    <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px', letterSpacing: '-0.02em' }}>5</div>
                  </div>

                  <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="label-caps">Top Performer</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>E-commerce</div>
                    </div>
                    <div style={{ background: 'var(--semantic-success-bg)', color: 'var(--semantic-success-text)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em' }}>
                      +12% GROWTH
                    </div>
                  </div>

                  <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="label-caps">Emerging Opportunity</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>Healthcare</div>
                    </div>
                    <div style={{ background: 'var(--accent-gold-muted)', color: '#9D7A39', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em' }}>
                      RISING
                    </div>
                  </div>

                </div>
              </div>

              {/* ACTIONS BAR */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="btn btn-primary">Scan New Niche</button>
                <button className="btn btn-outline">Compare Niches</button>
                <button className="btn btn-ghost">Export Analysis</button>
              </div>

              {/* NICHE CARDS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', paddingBottom: '40px' }}>
                {nichesData.map(niche => (
                  <div key={niche.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{niche.name}</h3>
                      {niche.trend === 'up' && <IconTrendingUp />}
                      {niche.trend === 'down' && <IconTrendingDown />}
                      {niche.trend === 'flat' && <IconTrendingFlat />}
                    </div>

                    {/* Metrics Row */}
                    <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px' }}>
                      <div>
                        <div className="label-caps">TAM</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{niche.tam}</div>
                      </div>
                      <div>
                        <div className="label-caps">Growth</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', marginTop: '4px', fontFamily: 'var(--font-mono)', color: niche.growth.startsWith('+') ? 'var(--semantic-success)' : 'var(--semantic-error)' }}>{niche.growth}</div>
                      </div>
                      <div>
                        <div className="label-caps">Competitors</div>
                        <div style={{ fontSize: '13px', fontWeight: '500', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{niche.competitors}</div>
                      </div>
                    </div>

                    {/* Scores Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      
                      {/* Opp Score Bar */}
                      <div style={{ flex: 1, marginRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="label-caps">Opportunity Score</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{niche.oppScore}/100</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${niche.oppScore}%`, background: 'var(--accent-gold)', borderRadius: '2px' }}></div>
                        </div>
                      </div>

                      {/* ICP Match Ring */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="label-caps">ICP Match</div>
                        </div>
                        <CircularProgress percentage={niche.icpMatch} />
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {niche.tags.map(tag => (
                        <span key={tag} style={{ 
                          background: '#F0F0EB', 
                          color: 'var(--text-secondary)', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          fontWeight: '500' 
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}