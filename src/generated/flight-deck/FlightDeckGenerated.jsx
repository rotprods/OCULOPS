import React, { useState, useMemo } from 'react';

const FlightDeckGenerated = () => {
  const agents = useMemo(() => [
    { id: 'ag-1', name: 'ATLAS', icon: 'public', status: 'online', statusText: 'Running', time: 'Just now' },
    { id: 'ag-2', name: 'HUNTER', icon: 'radar', status: 'online', statusText: 'Running', time: '12s ago' },
    { id: 'ag-3', name: 'ORACLE', icon: 'visibility', status: 'idle', statusText: 'Idle', time: '2m ago' },
    { id: 'ag-4', name: 'FORGE', icon: 'build', status: 'online', statusText: 'Running', time: '1s ago' },
    { id: 'ag-5', name: 'SENTINEL', icon: 'shield', status: 'error', statusText: 'Error', time: '5m ago' },
    { id: 'ag-6', name: 'SCRIBE', icon: 'edit_document', status: 'online', statusText: 'Running', time: '45s ago' },
    { id: 'ag-7', name: 'HERALD', icon: 'campaign', status: 'idle', statusText: 'Idle', time: '10m ago' },
  ], []);

  const logs = useMemo(() => [
    { id: 'log-1', time: '14:32:01.045', agent: 'ATLAS', action: 'Synchronized global market data feeds across 14 regions.', status: 'success' },
    { id: 'log-2', time: '14:31:58.920', agent: 'FORGE', action: 'Compiled daily executive brief and distributed to core team.', status: 'success' },
    { id: 'log-3', time: '14:30:12.112', agent: 'HUNTER', action: 'Detected anomaly in Q3 revenue projections. Flagged for review.', status: 'warning' },
    { id: 'log-4', time: '14:28:45.003', agent: 'SCRIBE', action: 'Drafted response to PR inquiry regarding recent platform update.', status: 'success' },
    { id: 'log-5', time: '14:25:00.000', agent: 'SENTINEL', action: 'Unauthorized access attempt blocked at API gateway.', status: 'error' },
    { id: 'log-6', time: '14:20:11.442', agent: 'ORACLE', action: 'Predictive model retraining paused due to resource constraints.', status: 'idle' },
    { id: 'log-7', time: '14:15:09.881', agent: 'ATLAS', action: 'Ingested 50k new data points from secondary providers.', status: 'success' },
    { id: 'log-8', time: '14:10:00.000', agent: 'HERALD', action: 'Dispatched weekly automated newsletter to 120k subscribers.', status: 'success' },
  ], []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': case 'success': return 'var(--semantic-success)';
      case 'error': return 'var(--semantic-error)';
      case 'warning': return '#F59E0B';
      case 'idle': default: return 'var(--semantic-idle)';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'online': case 'success': return 'var(--semantic-success-bg)';
      case 'error': return 'var(--semantic-error-bg)';
      case 'warning': return '#FEF3C7';
      case 'idle': default: return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'online': case 'success': return 'var(--semantic-success-text)';
      case 'error': return 'var(--semantic-error-text)';
      case 'warning': return '#B45309';
      case 'idle': default: return 'var(--text-secondary)';
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-sidebar-active: #EBE4D8;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9A9A9A;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.25);
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #008F39;
          --semantic-error: #EF4444;
          --semantic-error-bg: #FEF2F2;
          --semantic-error-text: #B91C1C;
          --semantic-idle: #9CA3AF;
          --border-default: #E5E5E0;
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .btn-hover:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-hover { transition: all 0.2s ease; cursor: pointer; }
        
        .card-shadow { box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      `}</style>

      <div style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        overflow: 'hidden'
      }}>
        
        {/* SIDEBAR */}
        <aside style={{
          width: '240px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--text-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#FFF', fontSize: '18px' }}>change_history</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>NEXUS</span>
          </div>

          <nav style={{ padding: '0 12px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px', marginTop: '8px' }}>Core</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Overview</span>
            </div>
            
            <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px', marginTop: '16px' }}>Automation</div>
            
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
              borderRadius: '8px', backgroundColor: 'var(--bg-sidebar-active)', color: 'var(--text-primary)',
              borderLeft: '3px solid var(--accent-gold)', cursor: 'pointer'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>flight_takeoff</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Flight Deck</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_toy</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Agents</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>route</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Workflows</span>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* HEADER */}
          <header style={{
            height: '56px',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-primary)' }}>flight_takeoff</span>
              <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Flight Deck</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', 
                borderRadius: '20px', padding: '6px 16px', width: '240px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>search</span>
                <input 
                  type="text" 
                  placeholder="Search missions..." 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%', color: 'var(--text-primary)' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--semantic-success)', animation: 'breathe 2s infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* DASHBOARD CONTENT */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. CORTEX MASTER PANEL */}
            <section className="card-shadow" style={{
              width: '100%',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, var(--bg-card) 40%, var(--bg-card) 100%)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Left: Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-primary)', zIndex: 2 }}>psychology</span>
                  <div style={{ 
                    position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', 
                    backgroundColor: 'var(--accent-gold)', top: '50%', left: '50%', 
                    transform: 'translate(-50%, -50%)', zIndex: 1,
                    animation: 'pulse-gold 2.5s infinite'
                  }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>CORTEX</h2>
                    <div style={{ 
                      backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success-text)', 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>Live</div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Master Orchestrator — All Systems Nominal</p>
                </div>
              </div>

              {/* Center: Metrics */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missions Active</span>
                  <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>7</span>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-default)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</span>
                  <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>96.4%</span>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-default)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</span>
                  <span style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>99.9%</span>
                </div>
              </div>

              {/* Right: Controls & Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ width: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>Orchestration Trigger</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: '600' }}>65%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: '65%', height: '100%', borderRadius: '2px',
                      background: 'linear-gradient(90deg, #FFD700, #FFF099, #FFD700)', 
                      backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' 
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-hover" style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1A1A1A' }}>play_arrow</span>
                  </button>
                  <button className="btn-hover" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>pause</span>
                  </button>
                  <button className="btn-hover" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>stop</span>
                  </button>
                  <button className="btn-hover" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>settings</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2. AGENT STATUS GRID */}
            <section>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
                {agents.map((agent) => (
                  <div key={agent.id} className="card-shadow btn-hover" style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    position: 'relative'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>{agent.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0.02em' }}>{agent.name}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusColor(agent.status), animation: agent.status === 'online' ? 'breathe 2s infinite' : 'none' }} />
                      <span style={{ fontSize: '10px', fontWeight: '500', color: 'var(--text-secondary)' }}>{agent.statusText}</span>
                    </div>
                    
                    <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{agent.time}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. MISSION LOG */}
            <section className="card-shadow" style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '24px',
              flex: 1
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 24px 0', color: 'var(--text-primary)' }}>Active Missions</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {logs.map((log, index) => (
                  <div key={log.id} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: index === logs.length - 1 ? '0' : '20px' }}>
                    
                    {/* Timeline Line & Dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px', flexShrink: 0 }}>
                      <div style={{ 
                        width: '10px', height: '10px', borderRadius: '50%', 
                        backgroundColor: 'var(--bg-card)', border: '2px solid var(--accent-gold)', 
                        zIndex: 2, marginTop: '4px'
                      }} />
                      {index !== logs.length - 1 && (
                        <div style={{ width: '2px', flex: 1, backgroundColor: 'rgba(255,215,0,0.15)', marginTop: '4px' }} />
                      )}
                    </div>

                    {/* Log Content */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, paddingTop: '1px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', width: '90px', flexShrink: 0 }}>{log.time}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', width: '80px', flexShrink: 0 }}>{log.agent}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, lineHeight: '1.5' }}>{log.action}</span>
                      <div style={{ 
                        backgroundColor: getStatusBg(log.status), 
                        color: getStatusTextColor(log.status),
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '10px', 
                        fontWeight: '600', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        flexShrink: 0
                      }}>
                        {log.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. ACTIONS */}
            <section style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
              <button className="btn-hover" style={{
                backgroundColor: 'var(--accent-gold)',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rocket_launch</span>
                Launch Mission
              </button>
              
              <button className="btn-hover" style={{
                backgroundColor: 'transparent',
                color: 'var(--semantic-error)',
                border: '1px solid var(--semantic-error)',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                Emergency Stop
              </button>

              <button className="btn-hover" style={{
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid transparent',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '500',
                marginLeft: 'auto'
              }}>
                View Full Logs →
              </button>
            </section>

          </div>
        </main>
      </div>
    </>
  );
};

export default FlightDeckGenerated;