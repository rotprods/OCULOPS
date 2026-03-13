import React, { useState, useMemo } from 'react';

const SimulationGenerated = () => {
  const [growthRate, setGrowthRate] = useState(15);
  const [churn, setChurn] = useState(2.5);
  const [cac, setCac] = useState(120);
  const [conversion, setConversion] = useState(4.2);

  const scenarios = [
    {
      id: 'optimistic',
      name: 'Optimistic',
      mrr: '€45k',
      prob: '25%',
      color: 'var(--semantic-success)',
      assumptions: ['Market expansion', 'Feature adoption > 40%']
    },
    {
      id: 'baseline',
      name: 'Baseline',
      mrr: '€20k',
      prob: '60%',
      color: 'var(--accent-gold)',
      assumptions: ['Current trajectory', 'Standard churn rate']
    },
    {
      id: 'conservative',
      name: 'Conservative',
      mrr: '€8k',
      prob: '15%',
      color: 'var(--text-tertiary)',
      assumptions: ['Economic headwind', 'Delayed enterprise deals']
    }
  ];

  return (
    <div className="simulation-os">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .simulation-os {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-glow: rgba(255,215,0,0.15);
          --border-default: #E5E5E0;
          --semantic-success: #10B981;
          --semantic-error: #EF4444;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;

          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: var(--bg-canvas);
          font-family: var(--font-sans);
          color: var(--text-primary);
          overflow: hidden;
          box-sizing: border-box;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sidebar {
          width: 240px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          padding: 24px 0;
          flex-shrink: 0;
        }

        .nav-item {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background-color: rgba(0,0,0,0.04);
        }

        .nav-item.active {
          background-color: #EBE4D8;
          color: var(--text-primary);
          border-left: 3px solid var(--accent-gold);
          padding-left: 21px;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .header {
          height: 56px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background-color: var(--bg-canvas);
          flex-shrink: 0;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--semantic-error);
          letter-spacing: 0.1em;
        }

        .dot {
          width: 6px;
          height: 6px;
          background-color: var(--semantic-error);
          border-radius: 50%;
          animation: breathe 2s infinite ease-in-out;
        }

        .dashboard-grid {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
        }

        .row-top {
          display: flex;
          gap: 24px;
          height: 320px;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          position: relative;
        }

        .hero-vis {
          flex: 6;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
        }

        .hero-bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(#E5E5E0 1px, transparent 1px),
            linear-gradient(90deg, #E5E5E0 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.15;
          transform: perspective(500px) rotateX(60deg) translateY(-50px) scale(2);
          transform-origin: top center;
          pointer-events: none;
        }

        .scenario-panel {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .scenario-card {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .scenario-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--card-accent);
        }

        .scenario-card.active {
          background: linear-gradient(to bottom, var(--accent-gold-muted), transparent 40%);
          border-color: rgba(255,215,0,0.3);
        }

        .scenario-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .scenario-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .scenario-prob {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-canvas);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--border-default);
        }

        .scenario-assumptions {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .chart-card {
          width: 100%;
          height: 280px;
          display: flex;
          flex-direction: column;
        }

        .controls-row {
          display: flex;
          gap: 24px;
          align-items: flex-end;
        }

        .variables-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          background: var(--bg-card);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .slider-value {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: var(--accent-gold);
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 0 2px #fff, 0 2px 4px rgba(0,0,0,0.1);
        }

        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: var(--border-default);
          border-radius: 2px;
        }

        .actions-group {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }

        .btn-primary {
          background: var(--accent-gold);
          color: #1A1A1A;
          border: none;
          box-shadow: 0 2px 8px rgba(255,215,0,0.2);
        }

        .btn-primary:hover {
          background: #F0C800;
        }

        .btn-outline {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .btn-outline:hover {
          background: var(--bg-canvas);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: none;
        }

        .btn-ghost:hover {
          color: var(--text-primary);
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(255,215,0,0.15)); }
          50% { filter: drop-shadow(0 0 25px rgba(255,215,0,0.4)); }
        }

        @keyframes flow-dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      <div className="sidebar">
        <div style={{ padding: '0 24px 32px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-tertiary)' }}>
          SYSTEM
        </div>
        <div className="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Overview
        </div>
        <div className="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          Models
        </div>
        <div className="nav-item active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          Simulation
        </div>
        <div className="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Settings
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Simulation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span style={{ fontSize: '13px' }}>Search models...</span>
            </div>
            <div className="live-indicator">
              <div className="dot"></div>
              LIVE
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="row-top">
            <div className="card hero-vis">
              <div className="hero-bg-grid"></div>
              
              <svg width="100%" height="100%" viewBox="0 0 600 320" style={{ position: 'absolute', zIndex: 1 }}>
                <defs>
                  <radialGradient id="gold-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF5C2" />
                    <stop offset="40%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="rgba(255,215,0,0)" />
                  </radialGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Tendrils */}
                <path d="M 200 160 C 350 160, 400 60, 500 60" fill="none" stroke="var(--semantic-success)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'flow-dash 1s linear infinite' }} opacity="0.6" />
                <path d="M 200 160 C 350 160, 400 160, 500 160" fill="none" stroke="var(--accent-gold)" strokeWidth="3" filter="url(#glow)" />
                <path d="M 200 160 C 350 160, 400 260, 500 260" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.6" />

                {/* Core Orb */}
                <g style={{ animation: 'pulse-glow 4s infinite ease-in-out' }}>
                  <circle cx="200" cy="160" r="60" fill="url(#gold-core)" opacity="0.2" />
                  <circle cx="200" cy="160" r="30" fill="url(#gold-core)" opacity="0.5" />
                  <circle cx="200" cy="160" r="12" fill="#FFFFFF" filter="url(#glow)" />
                </g>

                {/* Nodes */}
                <g transform="translate(500, 60)">
                  <circle cx="0" cy="0" r="4" fill="var(--semantic-success)" />
                  <text x="12" y="4" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-secondary)">Optimistic</text>
                </g>
                <g transform="translate(500, 160)">
                  <circle cx="0" cy="0" r="6" fill="var(--accent-gold)" filter="url(#glow)" />
                  <text x="16" y="4" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-primary)" fontWeight="700">Baseline</text>
                </g>
                <g transform="translate(500, 260)">
                  <circle cx="0" cy="0" r="4" fill="var(--text-tertiary)" />
                  <text x="12" y="4" fontFamily="var(--font-mono)" fontSize="10" fill="var(--text-secondary)">Conservative</text>
                </g>
              </svg>
            </div>

            <div className="scenario-panel">
              {scenarios.map((scen) => (
                <div key={scen.id} className={`scenario-card ${scen.id === 'baseline' ? 'active' : ''}`} style={{ '--card-accent': scen.color }}>
                  <div className="scenario-header">
                    <div className="scenario-title">{scen.mrr} MRR by Q4</div>
                    <div className="scenario-prob">{scen.prob}</div>
                  </div>
                  <div className="scenario-assumptions">
                    {scen.assumptions.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-tertiary)' }}></div>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card chart-card">
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Projection Matrix
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fade-gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,215,0,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,215,0,0)" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Confidence Band */}
                <path d="M 0 160 C 300 160, 600 40, 1000 40 L 1000 180 C 600 180, 300 160, 0 160 Z" fill="rgba(255,215,0,0.06)" />

                {/* Lines */}
                <path d="M 0 160 C 300 160, 600 40, 1000 40" fill="none" stroke="#F0C800" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 0 160 C 300 160, 600 100, 1000 100" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" filter="drop-shadow(0 2px 4px rgba(255,215,0,0.3))" />
                <path d="M 0 160 C 300 160, 600 180, 1000 180" fill="none" stroke="#D4D4CF" strokeWidth="1.5" />
              </svg>
              
              {/* X-Axis Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
                <span>JUL</span>
                <span>AUG</span>
                <span>SEP</span>
                <span>OCT</span>
                <span>NOV</span>
                <span>DEC</span>
              </div>
            </div>
          </div>

          <div className="controls-row">
            <div className="variables-grid">
              <div className="slider-group">
                <div className="slider-header">
                  <span>Growth Rate</span>
                  <span className="slider-value">{growthRate}%</span>
                </div>
                <input type="range" min="0" max="50" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span>Churn</span>
                  <span className="slider-value">{churn}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" value={churn} onChange={(e) => setChurn(e.target.value)} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span>CAC</span>
                  <span className="slider-value">€{cac}</span>
                </div>
                <input type="range" min="50" max="300" value={cac} onChange={(e) => setCac(e.target.value)} />
              </div>
              <div className="slider-group">
                <div className="slider-header">
                  <span>Conversion</span>
                  <span className="slider-value">{conversion}%</span>
                </div>
                <input type="range" min="0" max="10" step="0.1" value={conversion} onChange={(e) => setConversion(e.target.value)} />
              </div>
            </div>

            <div className="actions-group">
              <button className="btn btn-ghost">Compare</button>
              <button className="btn btn-outline">Save Scenario</button>
              <button className="btn btn-primary">Run Simulation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationGenerated;