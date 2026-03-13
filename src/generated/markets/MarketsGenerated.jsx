import React, { useState, useMemo } from 'react';

const CSS_VARIABLES = `
  :root {
    --bg-canvas: #FAFAF8;
    --bg-sidebar: #F5F0E8;
    --bg-card: #FFFFFF;
    --bg-hover-row: #FDFDFD;
    --bg-sidebar-active: #EBE4D8;
    --bg-table-header: #FAFAF8;
    
    --text-primary: #1A1A1A;
    --text-secondary: #6B6B6B;
    --text-tertiary: #9CA3AF;
    --text-muted: #99948D;
    
    --accent-gold: #FFD700;
    --accent-gold-muted: rgba(255,215,0,0.10);
    --accent-gold-deep: #9D7A39;
    
    --semantic-success: #10B981;
    --semantic-success-bg: #E6F5EC;
    --semantic-success-text: #15803D;
    --semantic-error: #EF4444;
    --semantic-error-bg: #FEF2F2;
    --semantic-error-text: #B91C1C;
    --semantic-warning-bg: #FFFCE6;
    --semantic-warning-text: #A68900;
    
    --border-default: #E5E5E0;
    --border-subtle: #F0F0EE;
    
    --font-sans: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    --shadow-card: inset 0 1px 0 rgba(255,255,255,0.80), 0 2px 8px rgba(0,0,0,0.05);
    --shadow-elevated: inset 0 1px 0 rgba(255,255,255,0.80), 0 4px 16px rgba(0,0,0,0.07);
  }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

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

  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes breathe {
    0% { box-shadow: 0 0 15px rgba(255,215,0,0.15); transform: scale(1) translate(-50%, -50%); }
    50% { box-shadow: 0 0 30px rgba(255,215,0,0.3); transform: scale(1.02) translate(-49%, -49%); }
    100% { box-shadow: 0 0 15px rgba(255,215,0,0.15); transform: scale(1) translate(-50%, -50%); }
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  @keyframes gridMove {
    0% { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .table-row:hover {
    background-color: var(--bg-hover-row);
  }
`;

// --- Icons ---
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

// --- Mock Data ---
const COMPETITIVE_DATA = [
  { id: 1, competitor: 'Nexus Corp', sector: 'Quantum Compute', threat: 'HIGH', move: 'Acquired DeepMind Talent', signal: 4, time: '2m ago' },
  { id: 2, competitor: 'Aether Systems', sector: 'Neural Networks', threat: 'MEDIUM', move: 'Patent Filed: Q-Routing', signal: 3, time: '15m ago' },
  { id: 3, competitor: 'Vanguard AI', sector: 'Enterprise SaaS', threat: 'LOW', move: 'Q3 Earnings Beat', signal: 1, time: '1h ago' },
  { id: 4, competitor: 'Stellar Dynamics', sector: 'Robotics', threat: 'HIGH', move: 'Supply Chain Disruption', signal: 4, time: '3h ago' },
  { id: 5, competitor: 'OmniCorp', sector: 'Data Synthesis', threat: 'MEDIUM', move: 'New API Release', signal: 2, time: '5h ago' },
  { id: 6, competitor: 'Cipher Logic', sector: 'Cybersecurity', threat: 'LOW', move: 'Board Member Resignation', signal: 1, time: '12h ago' },
];

const FLOATING_LABELS = [
  { text: 'NEXUS +4.2%', top: '20%', left: '15%', delay: '0s' },
  { text: 'AETH -1.1%', top: '70%', left: '20%', delay: '1s' },
  { text: 'VOL: 8.4M', top: '30%', left: '75%', delay: '0.5s' },
  { text: 'Q-SECTOR ACTIVE', top: '65%', left: '65%', delay: '1.5s' },
];

// --- Components ---

const Sidebar = () => {
  const items = ['Overview', 'Markets', 'Intelligence', 'Assets', 'Settings'];
  
  return (
    <div style={{
      width: '240px',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0
    }}>
      <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--text-primary)' }}></div>
        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>OS.INTEL</span>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
        {items.map(item => {
          const isActive = item === 'Markets';
          return (
            <div key={item} style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}>
              {item}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

const Header = () => (
  <header style={{
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    borderBottom: '1px solid var(--border-default)',
    backgroundColor: 'var(--bg-canvas)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <GlobeIcon />
      <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Markets</h1>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '20px',
        width: '240px'
      }}>
        <SearchIcon />
        <input 
          type="text" 
          placeholder="Search entities, tickers..." 
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: 'var(--text-primary)',
            width: '100%'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--semantic-error)',
          animation: 'pulse 2s infinite'
        }}></div>
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>LIVE</span>
      </div>
    </div>
  </header>
);

const Card = ({ children, style, elevated = false }) => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-default)',
    boxShadow: elevated ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
    padding: '20px',
    ...style
  }}>
    {children}
  </div>
);

const HeroVisualization = () => {
  return (
    <Card elevated style={{ flex: '6', height: '320px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Perspective Grid Background */}
      <div style={{
        position: 'absolute',
        top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
        backgroundImage: `
          linear-gradient(var(--text-tertiary) 1px, transparent 1px),
          linear-gradient(90deg, var(--text-tertiary) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.08,
        transform: 'perspective(600px) rotateX(60deg) translateY(-100px)',
        animation: 'gridMove 20s linear infinite'
      }}></div>

      {/* Golden Energy Sphere */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FFD700 30%, #C5A059 70%, transparent 100%)',
        animation: 'breathe 6s ease-in-out infinite',
        zIndex: 2
      }}>
        {/* Tendrils (simulated with rotated blurred lines) */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '140%', height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)',
            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
            filter: 'blur(2px)',
            opacity: 0.6
          }}></div>
        ))}
      </div>

      {/* Floating Labels */}
      {FLOATING_LABELS.map((label, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: label.top,
          left: label.left,
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-primary)',
          opacity: 0.5,
          animation: `float 4s ease-in-out infinite`,
          animationDelay: label.delay,
          zIndex: 3,
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          {label.text}
        </div>
      ))}

      {/* Bottom Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border-default)',
        backdropFilter: 'blur(4px)',
        zIndex: 10
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--semantic-success)' }}></div>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Market Sentiment: Bullish</span>
      </div>
    </Card>
  );
};

const KPIStack = () => {
  const kpiStyle = { height: 'calc((320px - 48px) / 3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
  
  return (
    <div style={{ flex: '3.5', display: 'flex', flexDirection: 'column', gap: '24px', height: '320px' }}>
      <Card style={kpiStyle}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Competitive Threats</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>3</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--semantic-error-bg)', padding: '4px 8px', borderRadius: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--semantic-error)' }}></div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--semantic-error-text)', letterSpacing: '0.05em' }}>HIGH ALERT</span>
          </div>
        </div>
      </Card>
      
      <Card style={kpiStyle}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Market Signals</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>12</span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '24px' }}>
            {[4, 8, 14, 20, 12, 24].map((h, i) => (
              <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: 'var(--accent-gold)', borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>
      </Card>
      
      <Card style={kpiStyle}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Sector Growth</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--semantic-success)' }}>
          <span style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>+4.2%</span>
          <ArrowUpIcon />
        </div>
      </Card>
    </div>
  );
};

const ThreatPill = ({ level }) => {
  const config = {
    HIGH: { bg: 'var(--semantic-error-bg)', text: 'var(--semantic-error-text)' },
    MEDIUM: { bg: 'var(--semantic-warning-bg)', text: 'var(--semantic-warning-text)' },
    LOW: { bg: 'var(--bg-canvas)', text: 'var(--text-secondary)' }
  };
  const style = config[level];
  
  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.text,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      border: level === 'LOW' ? '1px solid var(--border-default)' : 'none'
    }}>
      {level}
    </span>
  );
};

const SignalBars = ({ strength }) => {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '14px' }}>
      {[1, 2, 3, 4].map((bar) => (
        <div key={bar} style={{
          width: '4px',
          height: `${bar * 3.5}px`,
          backgroundColor: bar <= strength ? 'var(--accent-gold)' : 'var(--border-default)',
          borderRadius: '1px'
        }}></div>
      ))}
    </div>
  );
};

const CompetitiveTable = () => {
  return (
    <Card style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-default)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Competitive Intelligence</h2>
      </div>
      
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: '800px' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 2fr 1fr 1fr',
            backgroundColor: 'var(--bg-table-header)',
            borderBottom: '1px solid var(--border-default)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ padding: '12px 20px' }}>Competitor</div>
            <div style={{ padding: '12px 20px' }}>Sector</div>
            <div style={{ padding: '12px 20px' }}>Threat Level</div>
            <div style={{ padding: '12px 20px' }}>Recent Move</div>
            <div style={{ padding: '12px 20px', backgroundColor: 'var(--accent-gold-muted)' }}>Signal Strength</div>
            <div style={{ padding: '12px 20px' }}>Last Detected</div>
          </div>
          
          {/* Rows */}
          <div>
            {COMPETITIVE_DATA.map((row, idx) => (
              <div key={row.id} className="table-row" style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 2fr 1fr 1fr',
                borderBottom: idx === COMPETITIVE_DATA.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                fontSize: '13px',
                alignItems: 'center',
                transition: 'background-color 0.2s ease'
              }}>
                <div style={{ padding: '16px 20px', fontWeight: 500 }}>{row.competitor}</div>
                <div style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{row.sector}</div>
                <div style={{ padding: '16px 20px' }}><ThreatPill level={row.threat} /></div>
                <div style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>{row.move}</div>
                <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,215,0,0.02)' }}><SignalBars strength={row.signal} /></div>
                <div style={{ padding: '16px 20px', color: 'var(--text-tertiary)', fontSize: '12px' }}>{row.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const TrendCards = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
      <Card>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>AI Services Market</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ width: '60%', height: '40px' }}>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <path d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ color: 'var(--semantic-success)', fontSize: '14px', fontWeight: 600 }}>+12% QoQ</div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Client Acquisition Cost</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ width: '60%', height: '40px' }}>
            <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <path d="M0,10 L20,15 L40,12 L60,25 L80,22 L100,35" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>$320 avg</div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Market Share</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--border-default)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--accent-gold)" strokeWidth="4" strokeDasharray="35 65" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>35%</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>vs Top 3</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default function MarketsGenerated() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_VARIABLES }} />
      
      <Sidebar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        
        <main className="hide-scrollbar" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <HeroVisualization />
            <KPIStack />
          </div>
          
          <CompetitiveTable />
          <TrendCards />
          
          {/* Bottom padding for scroll */}
          <div style={{ height: '32px', flexShrink: 0 }}></div>
        </main>
      </div>
    </div>
  );
}