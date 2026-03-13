import React, { useMemo } from 'react';

const WatchtowerGenerated = () => {
  // Mock Data
  const agents = useMemo(() => [
    { name: 'ATLAS', health: 98, status: 'success', lastActive: 'Just now', sparkline: 'M0,12 L8,8 L16,14 L24,4 L32,10 L40,2' },
    { name: 'HUNTER', health: 95, status: 'success', lastActive: '1m ago', sparkline: 'M0,14 L8,10 L16,12 L24,6 L32,8 L40,4' },
    { name: 'ORACLE', health: 92, status: 'success', lastActive: '2m ago', sparkline: 'M0,10 L8,12 L16,6 L24,8 L32,4 L40,6' },
    { name: 'FORGE', health: 88, status: 'warning', lastActive: '5m ago', sparkline: 'M0,6 L8,4 L16,10 L24,8 L32,14 L40,12' },
    { name: 'SENTINEL', health: 96, status: 'success', lastActive: '1m ago', sparkline: 'M0,12 L8,6 L16,8 L24,4 L32,6 L40,2' },
    { name: 'SCRIBE', health: 90, status: 'success', lastActive: '3m ago', sparkline: 'M0,8 L8,10 L16,6 L24,12 L32,8 L40,10' },
    { name: 'HERALD', health: 85, status: 'warning', lastActive: '8m ago', sparkline: 'M0,4 L8,8 L16,4 L24,10 L32,12 L40,14' },
  ], []);

  const alerts = useMemo(() => [
    { id: 1, severity: 'error', time: '10:42:05', agent: 'FORGE', message: 'Memory threshold exceeded (92%) in processing queue.', signal: 90 },
    { id: 2, severity: 'warning', time: '10:38:12', agent: 'HERALD', message: 'API rate limit approaching for external data source.', signal: 75 },
    { id: 3, severity: 'success', time: '10:15:00', agent: 'ATLAS', message: 'Global index optimization completed successfully.', signal: 30 },
    { id: 4, severity: 'warning', time: '09:55:22', agent: 'ORACLE', message: 'Query latency spike detected (>500ms).', signal: 60 },
    { id: 5, severity: 'success', time: '09:30:10', agent: 'SENTINEL', message: 'Security definitions updated to latest definitions.', signal: 20 },
  ], []);

  const uptimeData = useMemo(() => {
    return agents.map(agent => {
      // Generate 30 days of uptime (mostly 1s, some 0s for lower health agents)
      const days = Array.from({ length: 30 }, (_, i) => {
        if (agent.health === 98) return 1; // Atlas perfect
        if (agent.health < 90 && i % 8 === 0) return 0; // Forge/Herald have drops
        if (agent.health < 95 && i === 15) return 0; // Oracle/Scribe have one drop
        return 1;
      });
      return { name: agent.name, days, perfect: agent.health >= 98 };
    });
  }, [agents]);

  // CSS Variables & Animations
  const styles = `
    :root {
      --bg-canvas: #FAFAF8;
      --bg-sidebar: #F5F0E8;
      --bg-card: #FFFFFF;
      --text-primary: #1A1A1A;
      --text-secondary: #6B6B6B;
      --text-tertiary: #9A9A9A;
      --accent-gold: #FFD700;
      --border-default: #E5E5E0;
      --border-subtle: #F0F0EE;
      --semantic-success: #10B981;
      --semantic-warning: #F59E0B;
      --semantic-error: #EF4444;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes pulse-dot {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    @keyframes heartbeat-sweep {
      0% { transform: translateX(-100%); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateX(100%); opacity: 0; }
    }

    .live-dot {
      width: 8px; height: 8px;
      background-color: var(--semantic-error);
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    .heartbeat-container {
      position: relative;
      height: 2px;
      background: var(--border-subtle);
      overflow: hidden;
      border-radius: 2px;
      margin-top: 16px;
    }

    .heartbeat-bar {
      position: absolute;
      top: 0; left: 0; height: 100%; width: 30%;
      background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
      animation: heartbeat-sweep 3s infinite linear;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }

    .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D1D1D1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #A8A8A8; }
  `;

  // SVG Icons
  const Icons = {
    Binoculars: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h4z"/><path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/><path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H4z"/>
      </svg>
    ),
    Search: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    Activity: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    Shield: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    Database: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    )
  };

  // Helper for Circular Progress
  const CircularProgress = ({ percent }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    return (
      <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="48" height="48" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx="24" cy="24" r={radius} fill="none" stroke="var(--border-default)" strokeWidth="4" />
          <circle 
            cx="24" cy="24" r={radius} fill="none" 
            stroke="var(--accent-gold)" strokeWidth="4" 
            strokeDasharray={circumference} strokeDashoffset={offset} 
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{percent}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-canvas)', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* SIDEBAR */}
      <aside style={{ width: '240px', backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em' }}>OS.CORE</span>
        </div>
        <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 12px 8px' }}>System</div>
          {[
            { name: 'Overview', icon: <Icons.Activity /> },
            { name: 'Watchtower', icon: <Icons.Binoculars />, active: true },
            { name: 'Security', icon: <Icons.Shield /> },
            { name: 'Databases', icon: <Icons.Database /> },
          ].map(item => (
            <div key={item.name} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '6px',
              backgroundColor: item.active ? '#EBE4D8' : 'transparent',
              color: item.active ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: item.active ? 600 : 400,
              fontSize: '14px', cursor: 'pointer'
            }}>
              <span style={{ color: item.active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{item.icon}</span>
              {item.name}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <header style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-canvas)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}><Icons.Binoculars /></span>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Watchtower</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-default)', fontSize: '13px' }}>
              <Icons.Search />
              <span>Search agents, alerts...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              <div className="live-dot"></div>
              LIVE
            </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. HERO CARD */}
          <section className="card" style={{ padding: '24px 32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>System Watchtower</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Real-time monitoring of all agents and services</p>
            <div className="heartbeat-container">
              <div className="heartbeat-bar"></div>
            </div>
          </section>

          {/* 2. KPI ROW */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Agents Online', value: '7/7', highlight: true },
              { label: 'Errors Today', value: '0' },
              { label: 'Events Processed', value: '2,847' },
              { label: 'Avg Latency', value: '12ms' },
            ].map((kpi, i) => (
              <div key={i} className="card" style={{ 
                padding: '20px', 
                border: kpi.highlight ? '1px solid var(--accent-gold)' : '1px solid var(--border-default)',
                boxShadow: kpi.highlight ? '0 0 15px rgba(255,215,0,0.05)' : '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{kpi.value}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kpi.label}</div>
              </div>
            ))}
          </section>

          {/* 3. AGENT HEALTH MATRIX */}
          <section className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Agent Health Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
              {agents.map(agent => (
                <div key={agent.name} style={{ 
                  border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px 12px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FAFAFA'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', letterSpacing: '0.02em' }}>{agent.name}</div>
                  <CircularProgress percent={agent.health} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', marginBottom: '4px' }}>
                    <div style={{ 
                      width: '6px', height: '6px', borderRadius: '50%', 
                      backgroundColor: agent.status === 'success' ? 'var(--semantic-success)' : 'var(--semantic-warning)' 
                    }}></div>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{agent.lastActive}</span>
                  </div>
                  
                  <div style={{ marginTop: '12px', height: '16px', width: '40px' }}>
                    <svg viewBox="0 0 40 16" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                      <polyline 
                        points={agent.sparkline} 
                        fill="none" 
                        stroke="var(--accent-gold)" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BOTTOM ROW: ALERTS & UPTIME */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* 4. ALERT FEED */}
            <section className="card" style={{ padding: '0' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Alerts</h3>
              </div>
              <div style={{ padding: '0 24px' }}>
                {alerts.map((alert, i) => (
                  <div key={alert.id} style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0',
                    borderBottom: i < alerts.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: `var(--semantic-${alert.severity})` 
                    }}></div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', width: '65px', flexShrink: 0 }}>{alert.time}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, width: '70px', flexShrink: 0 }}>{alert.agent}</div>
                    <div className="text-truncate" style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{alert.message}</div>
                    <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ 
                        height: '100%', width: `${alert.signal}%`, 
                        backgroundColor: alert.severity === 'error' ? 'var(--semantic-error)' : (alert.severity === 'warning' ? 'var(--accent-gold)' : 'var(--semantic-success)')
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. UPTIME CHART */}
            <section className="card" style={{ padding: '0' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>30-Day Uptime</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Trailing 30 Days</span>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {uptimeData.map(data => (
                  <div key={data.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '70px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{data.name}</div>
                    <div style={{ 
                      flex: 1, display: 'flex', gap: '2px', height: '16px',
                      padding: data.perfect ? '2px' : '0',
                      border: data.perfect ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                      borderRadius: '4px'
                    }}>
                      {data.days.map((status, i) => (
                        <div key={i} style={{ 
                          flex: 1, borderRadius: '1px',
                          backgroundColor: status === 1 ? 'var(--semantic-success)' : 'var(--semantic-error)',
                          opacity: status === 1 ? 0.8 : 1
                        }}></div>
                      ))}
                    </div>
                    <div style={{ width: '40px', textAlign: 'right', fontSize: '12px', fontFamily: 'var(--font-mono)', color: data.perfect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {((data.days.filter(d => d===1).length / 30) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchtowerGenerated;