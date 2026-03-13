import React, { useState, useMemo } from 'react';

const WorldMonitorGenerated = () => {
  const [hoveredCity, setHoveredCity] = useState('Madrid');

  const styles = `
    :root {
      --bg-canvas: #FAFAF8;
      --bg-sidebar: #F5F0E8;
      --bg-card: #FFFFFF;
      --bg-hover-nav: rgba(0,0,0,0.04);
      --bg-sidebar-active: #EBE4D8;
      
      --text-primary: #1A1A1A;
      --text-secondary: #6B6B6B;
      --text-tertiary: #9CA3AF;
      --text-muted-label: #99948D;
      
      --accent-gold: #FFD700;
      --accent-gold-muted: rgba(255,215,0,0.10);
      --accent-gold-border: rgba(255,215,0,0.30);
      --accent-gold-glow: 0 0 15px rgba(255,215,0,0.15);
      
      --semantic-success: #10B981;
      --semantic-success-bg: #E6F5EC;
      --semantic-error: #EF4444;
      
      --border-default: #E5E5E0;
      
      --font-sans: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      
      --radius-card: 12px;
      --shadow-card: 0 2px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02);
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

    @keyframes radar-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse-dot {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    @keyframes pulse-gold {
      0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }

    .radar-sweep {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 600px;
      height: 600px;
      margin-top: -300px;
      margin-left: -300px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 70%, rgba(255, 215, 0, 0.15) 100%);
      animation: radar-spin 6s linear infinite;
      pointer-events: none;
      z-index: 2;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background-color: var(--semantic-error);
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    .city-dot {
      position: absolute;
      width: 8px;
      height: 8px;
      background-color: var(--accent-gold);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 10;
      box-shadow: 0 0 8px rgba(255,215,0,0.5);
      transition: all 0.2s ease;
    }
    
    .city-dot:hover, .city-dot.active {
      width: 12px;
      height: 12px;
      background-color: #FFF;
      border: 2px solid var(--accent-gold);
      animation: pulse-gold 2s infinite;
    }

    .map-polygon {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-default);
      border-radius: 3px;
    }
  `;

  const kpis = [
    { label: 'MARKETS TRACKED', value: '12', highlight: true },
    { label: 'ACTIVE SIGNALS', value: '47' },
    { label: 'REGIONS EXPANDING', value: '3' },
    { label: 'GROWTH INDEX', value: '+8.2%', color: 'var(--semantic-success)' },
  ];

  const regions = [
    { name: 'Europe', signals: 24, growth: '+4.2%', status: 85 },
    { name: 'LATAM', signals: 12, growth: '+8.7%', status: 60 },
    { name: 'APAC', signals: 8, growth: '+2.1%', status: 40 },
    { name: 'North America', signals: 3, growth: '+1.1%', status: 15 },
  ];

  const opportunities = [
    { name: 'Bogotá Tech Hub', trend: '+12%', score: 92 },
    { name: 'Lisbon Renewables', trend: '+8%', score: 88 },
    { name: 'Warsaw Logistics', trend: '+5%', score: 76 },
  ];

  const cities = [
    { name: 'Madrid', top: '38%', left: '48%', signals: 8, pipeline: 'E24k' },
    { name: 'Paris', top: '34%', left: '49%', signals: 5, pipeline: 'E12k' },
    { name: 'Lisbon', top: '39%', left: '46.5%', signals: 12, pipeline: 'E31k' },
    { name: 'Barcelona', top: '38.5%', left: '49.5%', signals: 4, pipeline: 'E8k' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
      <style>{styles}</style>

      {/* SIDEBAR */}
      <div style={{ 
        width: '240px', 
        backgroundColor: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--accent-gold)', borderRadius: '50%' }}></div>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em' }}>OS.INT</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted-label)', padding: '0 8px', marginBottom: '8px', marginTop: '16px' }}>Intelligence</div>
          {['Dashboard', 'World Monitor', 'Signal Feed', 'Entities'].map((item) => {
            const isActive = item === 'World Monitor';
            return (
              <div key={item} style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', backgroundColor: 'var(--accent-gold)', borderRadius: '0 4px 4px 0' }}></div>}
                <span style={{ marginLeft: isActive ? '4px' : '0' }}>{item}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ 
          height: '56px', 
          borderBottom: '1px solid var(--border-default)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--bg-canvas)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>World Monitor</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search markets..." 
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  padding: '6px 12px 6px 32px',
                  fontSize: '13px',
                  width: '200px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--semantic-error-bg)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="live-dot"></div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--semantic-error)', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KPI ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-card)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {kpi.highlight && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'var(--accent-gold)' }}></div>}
                <div style={{ fontSize: '10px', color: 'var(--text-muted-label)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{kpi.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: kpi.color || 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* WORLD MAP CARD */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-card)',
            height: '420px',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#F7F5F0' // Warm cream base tone
          }}>
            {/* Abstract Map Background (Simplified SVG for visual texture) */}
            <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.6 }} preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 500">
              <path d="M450,150 Q480,140 500,160 T520,200 T480,250 T460,220 Z" fill="#E8E3D9" /> {/* Europe rough */}
              <path d="M460,260 Q490,270 510,350 T480,420 T440,320 Z" fill="#E8E3D9" /> {/* Africa rough */}
              <path d="M250,100 Q350,80 380,150 T300,220 T220,180 Z" fill="#E8E3D9" /> {/* North America rough */}
              <path d="M300,250 Q350,260 360,350 T320,450 T280,320 Z" fill="#E8E3D9" /> {/* South America rough */}
              <path d="M600,100 Q750,80 800,200 T700,300 T650,200 Z" fill="#E8E3D9" /> {/* Asia rough */}
              
              {/* Grid lines for technical feel */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E0D8" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Gold Polygon Overlays */}
            <svg className="map-polygon" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice">
              {/* Spain (Primary) */}
              <polygon points="470,180 490,185 495,200 480,210 465,195" fill="rgba(255,215,0,0.25)" stroke="rgba(255,215,0,0.5)" strokeWidth="1" />
              {/* EU (Secondary) */}
              <polygon points="490,160 520,150 540,180 510,210 495,200" fill="rgba(255,215,0,0.1)" stroke="rgba(255,215,0,0.2)" strokeWidth="1" />
              {/* LATAM (Tertiary) */}
              <polygon points="280,260 340,270 350,380 300,420 270,320" fill="rgba(255,215,0,0.05)" stroke="rgba(255,215,0,0.1)" strokeWidth="1" />
            </svg>

            {/* Radar Sweep centered on Europe (approx 48% left, 38% top) */}
            <div style={{ position: 'absolute', top: '38%', left: '48%', width: 0, height: 0 }}>
              <div className="radar-sweep"></div>
            </div>

            {/* City Markers */}
            {cities.map((city) => (
              <div 
                key={city.name}
                className={`city-dot ${hoveredCity === city.name ? 'active' : ''}`}
                style={{ top: city.top, left: city.left }}
                onMouseEnter={() => setHoveredCity(city.name)}
              >
                {/* Tooltip */}
                {hoveredCity === city.name && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{city.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--accent-gold-deep)', fontWeight: 600 }}>{city.signals}</span> signals <span style={{ color: 'var(--border-default)' }}>|</span> {city.pipeline} pipeline
                    </div>
                    {/* Tooltip arrow */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-5px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '10px',
                      height: '10px',
                      background: 'var(--bg-card)',
                      borderRight: '1px solid var(--border-default)',
                      borderBottom: '1px solid var(--border-default)',
                    }}></div>
                  </div>
                )}
              </div>
            ))}

            {/* Map Controls */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
              {['+', '-'].map(btn => (
                <button key={btn} style={{
                  width: '32px', height: '32px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {btn}
                </button>
              ))}
            </div>
            
            {/* Overlay Label */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.8)', padding: '4px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                Global Signal Density
              </div>
            </div>
          </div>

          {/* BOTTOM PANEL */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
            
            {/* Regional Intelligence */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '16px' }}>Regional Intelligence</h3>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', paddingBottom: '8px', borderBottom: '1px solid var(--border-default)', fontSize: '10px', color: 'var(--text-muted-label)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div>Region</div>
                  <div>Signals</div>
                  <div>Growth</div>
                  <div>Status</div>
                </div>
                {regions.map((region, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', padding: '12px 0', borderBottom: i !== regions.length - 1 ? '1px solid var(--border-default)' : 'none', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ fontWeight: 500 }}>{region.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{region.signals}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--semantic-success)' }}>{region.growth}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-canvas)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${region.status}%`, height: '100%', background: 'var(--accent-gold)' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emerging Opportunities */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '16px' }}>Emerging Opportunities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {opportunities.map((opp, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-canvas)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{opp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--semantic-success)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        {opp.trend}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted-label)' }}>AI SCORE</span>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px' }}>
                        <div style={{ width: `${opp.score}%`, height: '100%', background: 'var(--text-primary)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{opp.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Risk Index */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', padding: '20px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 'auto' }}>Global Risk Index</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0' }}>
                <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--semantic-success)', letterSpacing: '-0.02em', lineHeight: 1 }}>LOW</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>System stability at 98.4%</div>
                
                {/* Sparkline */}
                <div style={{ width: '100%', height: '40px', marginTop: '24px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <path d="M0,30 Q20,25 40,32 T80,28 T120,35 T160,20 T200,25 L200,40 L0,40 Z" fill="var(--semantic-success-bg)" opacity="0.5" />
                    <path d="M0,30 Q20,25 40,32 T80,28 T120,35 T160,20 T200,25" fill="none" stroke="var(--semantic-success)" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMonitorGenerated;