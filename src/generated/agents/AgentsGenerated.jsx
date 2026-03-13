import React, { useState, useMemo } from 'react';

const MOCK_AGENTS = [
  { id: 'ag-001', name: 'Data Ingestion Alpha', role: 'ETL Pipeline', status: 'active', tasks: 14320, successRate: 99.8, latency: '42ms', currentTask: 'Syncing Postgres -> Snowflake', lastActive: 'Just now' },
  { id: 'ag-002', name: 'Sentiment Analyzer', role: 'NLP Processing', status: 'active', tasks: 8450, successRate: 98.5, latency: '120ms', currentTask: 'Processing batch #8842', lastActive: 'Just now' },
  { id: 'ag-003', name: 'Report Generator', role: 'Document AI', status: 'idle', tasks: 1205, successRate: 100, latency: '-', currentTask: 'Awaiting trigger', lastActive: '2h ago' },
  { id: 'ag-004', name: 'Anomaly Detector', role: 'Security Ops', status: 'error', tasks: 450, successRate: 92.1, latency: 'timeout', currentTask: 'Failed to connect to Redis cluster', lastActive: '5m ago' },
  { id: 'ag-005', name: 'Customer Support Bot', role: 'Conversational', status: 'active', tasks: 32010, successRate: 95.4, latency: '85ms', currentTask: 'Handling 4 concurrent sessions', lastActive: 'Just now' },
  { id: 'ag-006', name: 'Lead Scraper', role: 'Web Automation', status: 'idle', tasks: 5600, successRate: 97.2, latency: '-', currentTask: 'Scheduled for 02:00 UTC', lastActive: '12h ago' },
  { id: 'ag-007', name: 'Market Predictor', role: 'Predictive Model', status: 'active', tasks: 890, successRate: 88.5, latency: '450ms', currentTask: 'Training on new dataset', lastActive: 'Just now' },
  { id: 'ag-008', name: 'Log Aggregator', role: 'Infrastructure', status: 'active', tasks: 102400, successRate: 99.9, latency: '12ms', currentTask: 'Tailing syslogs', lastActive: 'Just now' },
];

const cssStyles = `
  .agents-module {
    --bg-canvas: #FAFAF8;
    --bg-card: #FFFFFF;
    --text-primary: #1A1A1A;
    --text-secondary: #6B6B6B;
    --text-tertiary: #9CA3AF;
    --accent-gold: #FFD700;
    --accent-gold-hover: #F0C800;
    --accent-gold-muted: rgba(255,215,0,0.10);
    --border-default: #E5E5E0;
    --semantic-success: #10B981;
    --semantic-error: #EF4444;
    --semantic-warning: #A68900;
    --font-primary: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    font-family: var(--font-primary);
    background-color: var(--bg-canvas);
    min-height: 100vh;
    color: var(--text-primary);
    box-sizing: border-box;
  }

  .agents-module * {
    box-sizing: border-box;
  }

  @keyframes pulse-success {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  @keyframes pulse-error {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-dot.active {
    background-color: var(--semantic-success);
    animation: pulse-success 2s infinite;
  }

  .status-dot.error {
    background-color: var(--semantic-error);
    animation: pulse-error 2s infinite;
  }

  .status-dot.idle {
    background-color: var(--text-tertiary);
  }

  .agent-card {
    transition: all 0.2s ease;
  }

  .agent-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.04);
    border-color: rgba(255,215,0,0.30) !important;
  }

  .btn-primary {
    transition: background-color 0.2s ease;
  }
  .btn-primary:hover {
    background-color: var(--accent-gold-hover) !important;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--accent-gold) !important;
    box-shadow: 0 0 0 2px var(--accent-gold-muted);
  }

  /* Custom Scrollbar for a premium feel */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #E5E5E0;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #D0D0C8;
  }
`;

const AgentsGenerated = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAgents = useMemo(() => {
    return MOCK_AGENTS.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            agent.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: MOCK_AGENTS.length,
      active: MOCK_AGENTS.filter(a => a.status === 'active').length,
      error: MOCK_AGENTS.filter(a => a.status === 'error').length,
      idle: MOCK_AGENTS.filter(a => a.status === 'idle').length,
    };
  }, []);

  return (
    <div className="agents-module" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <style>{cssStyles}</style>

      {/* Header Section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>Autonomous Agents</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Manage, monitor, and deploy your AI workforce.</p>
        </div>
        <button 
          className="btn-primary"
          style={{ 
            backgroundColor: 'var(--accent-gold)', 
            color: '#000', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            fontWeight: 500, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Deploy Agent
        </button>
      </header>

      {/* KPI Stats Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Agents', value: stats.total, color: 'var(--text-primary)' },
          { label: 'Active & Running', value: stats.active, color: 'var(--semantic-success)' },
          { label: 'Idle / Standby', value: stats.idle, color: 'var(--text-secondary)' },
          { label: 'Requires Attention', value: stats.error, color: 'var(--semantic-error)' },
        ].map((stat, idx) => (
          <div key={idx} style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-default)', 
            borderRadius: '8px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {stat.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 400, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </span>
          </div>
        ))}
      </section>

      {/* Controls / Toolbar */}
      <section style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            className="input-field"
            type="text" 
            placeholder="Search agents by name or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px 10px 36px', 
              border: '1px solid var(--border-default)', 
              borderRadius: '6px', 
              backgroundColor: 'var(--bg-card)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)'
            }} 
          />
        </div>
        <select 
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ 
            padding: '10px 32px 10px 12px', 
            border: '1px solid var(--border-default)', 
            borderRadius: '6px', 
            backgroundColor: 'var(--bg-card)',
            fontSize: '13px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" stroke="%236B6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"/></svg>')`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '12px'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="error">Error</option>
        </select>
      </section>

      {/* Agent Grid */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredAgents.map(agent => (
          <div key={agent.id} className="agent-card" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-default)', 
            borderRadius: '10px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--accent-gold-muted)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#9D7A39',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {agent.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{agent.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FAFAF8', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                <span className={`status-dot ${agent.status}`}></span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {agent.status}
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px 0', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Tasks</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>{agent.tasks.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Success</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: agent.successRate < 95 ? 'var(--semantic-warning)' : 'var(--semantic-success)' }}>
                  {agent.successRate}%
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Latency</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: agent.status === 'error' ? 'var(--semantic-error)' : 'var(--text-primary)' }}>
                  {agent.latency}
                </span>
              </div>
            </div>

            {/* Current Task & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Current Activity</span>
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', 
                  color: agent.status === 'error' ? 'var(--semantic-error)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  backgroundColor: '#FAFAF8',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #F0F0EE'
                }}>
                  > {agent.currentTask}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Updated: {agent.lastActive}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Logs
                  </button>
                  <button style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Config
                  </button>
                </div>
              </div>
            </div>

          </div>
        ))}
        {filteredAgents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-default)', borderRadius: '8px' }}>
            No agents found matching your criteria.
          </div>
        )}
      </section>
    </div>
  );
};

export default AgentsGenerated;