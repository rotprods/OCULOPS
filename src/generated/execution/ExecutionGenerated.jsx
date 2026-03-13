import React, { useState, useMemo } from 'react';

const navGroups = [
  {
    label: 'CORE',
    items: [
      { name: 'Dashboard', icon: 'grid' },
      { name: 'Knowledge Graph', icon: 'share-2' }
    ]
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { name: 'Agents', icon: 'cpu' },
      { name: 'Data Sources', icon: 'database' }
    ]
  },
  {
    label: 'AUTOMATION',
    items: [
      { name: 'Workflows', icon: 'git-merge' },
      { name: 'Execution', icon: 'rocket', active: true }
    ]
  },
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Performance', icon: 'activity' },
      { name: 'Logs', icon: 'terminal' }
    ]
  }
];

const kpiData = [
  { label: 'ACTIVE TASKS', value: '14', sub: 'Across 4 agents', active: true },
  { label: 'SYSTEM LOAD', value: '28%', sub: 'Optimal range' },
  { label: 'TASKS COMPLETED', value: '1,284', sub: '+124 today' },
  { label: 'ERROR RATE', value: '0.02%', sub: 'Down 0.01%' }
];

const taskData = [
  { id: 'TSK-8921', agent: 'Alpha-Scraper', status: 'running', priority: 'High', time: '00:12:45' },
  { id: 'TSK-8920', agent: 'Beta-Analyzer', status: 'completed', priority: 'Medium', time: '00:05:12' },
  { id: 'TSK-8919', agent: 'Gamma-Sync', status: 'running', priority: 'Low', time: '01:45:00' },
  { id: 'TSK-8918', agent: 'Delta-Parser', status: 'error', priority: 'High', time: '00:00:34' },
  { id: 'TSK-8917', agent: 'Alpha-Scraper', status: 'completed', priority: 'Medium', time: '00:22:10' },
  { id: 'TSK-8916', agent: 'Omega-Router', status: 'running', priority: 'Critical', time: '00:01:02' },
];

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const icons = {
    'grid': <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
    'share-2': <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    'cpu': <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
    'database': <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    'git-merge': <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></>,
    'rocket': <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>,
    'activity': <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    'terminal': <><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>,
    'search': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    'more-vertical': <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

const ExecutionGenerated = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="os-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9A9A9A;
          --accent-gold: #FFD700;
          --border-default: #E5E5E0;
          
          --semantic-success: #34C759;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #15803D;
          
          --semantic-error: #E53E3E;
          --semantic-error-bg: #FEF2F2;
          --semantic-error-text: #B91C1C;
          
          --semantic-warning: #FF9F43;

          --shadow-card: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          --highlight-card: inset 0 1px 0 rgba(255,255,255,0.8);
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .os-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          font-family: var(--font-sans);
          background-color: var(--bg-canvas);
          color: var(--text-primary);
          overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
          width: 240px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sidebar-header {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 12px;
        }

        .logo-mark {
          width: 28px;
          height: 28px;
          background-color: var(--accent-gold);
          border-radius: 50%;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .nav-section {
          padding: 16px 12px 0;
        }

        .nav-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .nav-item:hover:not(.active) {
          background-color: rgba(0,0,0,0.03);
        }

        .nav-item.active {
          background-color: rgba(255,215,0,0.10);
          border-color: rgba(255,215,0,0.20);
          color: var(--text-primary);
          font-weight: 600;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .footer-version {
          font-size: 10px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        /* Main Area */
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header */
        .header {
          height: 56px;
          background-color: var(--bg-canvas);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
        }

        .search-bar {
          width: 320px;
          height: 32px;
          background-color: #F0F0EB;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 8px;
          color: var(--text-secondary);
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-family: var(--font-sans);
          font-size: 13px;
          width: 100%;
          color: var(--text-primary);
        }

        .search-input::placeholder {
          color: var(--text-tertiary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: var(--semantic-success);
          border-radius: 50%;
          animation: pulse-green 2s infinite;
        }

        .status-text {
          font-size: 11px;
          font-weight: 700;
          color: var(--semantic-success);
          letter-spacing: 0.1em;
        }

        /* Content */
        .content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card {
          background-color: var(--bg-card);
          border-radius: 12px;
          border: 1px solid var(--border-default);
          box-shadow: var(--highlight-card), var(--shadow-card);
          padding: 24px;
          position: relative;
        }

        /* Hero */
        .hero-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hero-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .throughput-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .heartbeat-track {
          width: 120px;
          height: 4px;
          background-color: #F0F0EE;
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .heartbeat-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
          width: 60px;
          animation: heartbeat-slide 2s infinite linear;
        }

        .throughput-text {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        /* KPIs */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .kpi-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kpi-card.active {
          border: 1px solid rgba(255,215,0,0.30);
        }

        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .kpi-value {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .kpi-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Table */
        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .table-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-default);
          font-size: 14px;
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-default);
          background-color: #FAFAFA;
        }

        td {
          padding: 16px 24px;
          font-size: 13px;
          border-bottom: 1px solid #F0F0EE;
          color: var(--text-primary);
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover td {
          background-color: #FDFDFD;
        }

        .cell-id {
          font-family: var(--font-mono);
          color: var(--text-secondary);
          font-size: 12px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-running {
          background-color: var(--semantic-success-bg);
          color: var(--semantic-success-text);
        }
        
        .badge-running .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--semantic-success);
        }

        .badge-completed {
          background-color: #F0F0EE;
          color: var(--text-secondary);
        }

        .badge-error {
          background-color: var(--semantic-error-bg);
          color: var(--semantic-error-text);
        }
        
        .badge-error .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--semantic-error);
        }

        /* Animations */
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }

        @keyframes heartbeat-slide {
          0% { left: -60px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 120px; opacity: 0; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-mark"></div>
          <div className="logo-text">OCULOPS</div>
        </div>
        
        <nav>
          {navGroups.map((group, idx) => (
            <div key={idx} className="nav-section">
              <div className="nav-label">{group.label}</div>
              {group.items.map((item, iIdx) => (
                <div key={iIdx} className={`nav-item ${item.active ? 'active' : ''}`}>
                  <Icon name={item.icon} color={item.active ? '#C8A200' : 'currentColor'} />
                  {item.name}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-text">dev@oculops.os</div>
          <div className="footer-version">v1.0.0-rc.4</div>
        </div>
      </aside>

      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <Icon name="rocket" size={20} />
            Execution
          </div>
          
          <div className="search-bar">
            <Icon name="search" size={14} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search tasks, agents, or logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-right">
            <div className="status-dot"></div>
            <div className="status-text">LIVE</div>
          </div>
        </header>

        <main className="content">
          <div className="card hero-card">
            <div>
              <h1 className="hero-title">Task Execution Center</h1>
              <div className="hero-subtitle">14 active tasks across 4 agents</div>
            </div>
            <div className="throughput-container">
              <div className="heartbeat-track">
                <div className="heartbeat-bar"></div>
              </div>
              <div className="throughput-text">System Throughput: 94%</div>
            </div>
          </div>

          <div className="kpi-grid">
            {kpiData.map((kpi, idx) => (
              <div key={idx} className={`card kpi-card ${kpi.active ? 'active' : ''}`}>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-sub">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="card table-card">
            <div className="table-header">Active Operations</div>
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Uptime</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {taskData.map((task, idx) => (
                  <tr key={idx}>
                    <td className="cell-id">{task.id}</td>
                    <td style={{ fontWeight: 500 }}>{task.agent}</td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status !== 'completed' && <span className="dot"></span>}
                        {task.status}
                      </span>
                    </td>
                    <td style={{ color: task.priority === 'Critical' ? 'var(--semantic-error)' : 'inherit' }}>
                      {task.priority}
                    </td>
                    <td className="cell-id">{task.time}</td>
                    <td style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                      <Icon name="more-vertical" size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExecutionGenerated;