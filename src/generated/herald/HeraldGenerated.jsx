import React, { useState, useMemo } from 'react';

const HeraldGenerated = () => {
  const [actions, setActions] = useState([
    { id: 1, text: "Review and approve updated firewall rules for EU-West", priority: "HIGH", completed: false },
    { id: 2, text: "Allocate additional compute resources to HUNTER agent", priority: "MEDIUM", completed: false },
    { id: 3, text: "Acknowledge competitor pricing alert and notify sales team", priority: "LOW", completed: false }
  ]);

  const toggleAction = (id) => {
    setActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const archiveData = useMemo(() => [
    { id: 1, date: "Mar 12", title: "Morning Intelligence Brief", read: false, current: true },
    { id: 2, date: "Mar 11", title: "Evening Summary & Threat Intel", read: true, current: false },
    { id: 3, date: "Mar 11", title: "Morning Intelligence Brief", read: true, current: false },
    { id: 4, date: "Mar 10", title: "Weekly Market Synthesis", read: true, current: false },
    { id: 5, date: "Mar 09", title: "Morning Intelligence Brief", read: true, current: false },
    { id: 6, date: "Mar 08", title: "Weekend Activity Report", read: true, current: false },
  ], []);

  return (
    <>
      <style>{`
        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.30);
          --semantic-error: #EF4444;
          --semantic-error-bg: #FEF2F2;
          --semantic-warning-text: #A68900;
          --semantic-warning-bg: #FFFCE6;
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

        .herald-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-canvas);
        }

        /* Sidebar */
        .herald-sidebar {
          width: 240px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          flex-shrink: 0;
        }

        .sidebar-logo {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 40px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-logo-mark {
          width: 20px;
          height: 20px;
          background: var(--text-primary);
          border-radius: 4px;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-tertiary);
          margin-bottom: 8px;
          padding: 0 12px;
          font-weight: 600;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 2px;
        }

        .nav-item:hover {
          background-color: rgba(0,0,0,0.04);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: #EBE4D8;
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Main Content */
        .herald-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header */
        .herald-header {
          height: 56px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background-color: var(--bg-canvas);
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          padding: 6px 12px;
          width: 240px;
        }

        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          font-family: var(--font-sans);
          width: 100%;
          color: var(--text-primary);
        }

        .search-bar input::placeholder {
          color: var(--text-tertiary);
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background-color: var(--semantic-error);
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        /* Content Area */
        .content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 32px 40px;
        }

        .content-grid {
          display: flex;
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .main-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .side-column {
          width: 300px;
          flex-shrink: 0;
        }

        /* Cards */
        .card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Hero Card */
        .hero-card {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          overflow: hidden;
        }

        .hero-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .hero-meta {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .hero-footer {
          font-size: 11px;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Pulse Animation */
        .pulse-container {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--accent-gold);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .pulse-ring-1 {
          width: 24px;
          height: 24px;
          border-width: 2px;
          opacity: 0.3;
        }

        .pulse-ring-2 {
          width: 48px;
          height: 48px;
          opacity: 0.15;
          animation: pulse-expand 3s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
        }

        .pulse-ring-3 {
          width: 72px;
          height: 72px;
          opacity: 0.05;
          animation: pulse-expand 3s infinite cubic-bezier(0.215, 0.61, 0.355, 1) 0.5s;
        }

        .pulse-core {
          width: 8px;
          height: 8px;
          background-color: var(--accent-gold);
          border-radius: 50%;
          position: absolute;
          z-index: 2;
        }

        /* Priority Alerts */
        .alert-card {
          border-color: var(--accent-gold-border);
          background: linear-gradient(to bottom right, #FFFFFF, #FFFCF5);
        }

        .alert-item {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-default);
        }
        .alert-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          height: fit-content;
        }

        .pill-critical {
          background-color: var(--semantic-error-bg);
          color: var(--semantic-error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .pill-high {
          background-color: var(--semantic-warning-bg);
          color: var(--semantic-warning-text);
          border: 1px solid rgba(166, 137, 0, 0.2);
        }

        .pill-medium {
          background-color: #F3F4F6;
          color: #4B5563;
          border: 1px solid #E5E7EB;
        }

        .pill-low {
          background-color: #F8FAFC;
          color: #64748B;
          border: 1px solid #E2E8F0;
        }

        .alert-content {
          flex: 1;
        }

        .alert-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .alert-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .alert-time {
          font-size: 11px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        /* Market Signals */
        .signal-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 60px;
          align-items: center;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-default);
          font-size: 13px;
        }
        .signal-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .signal-name {
          font-weight: 500;
        }

        .signal-source {
          color: var(--text-secondary);
        }

        .impact-bar-bg {
          height: 4px;
          background-color: #F0F0EE;
          border-radius: 2px;
          width: 100%;
          overflow: hidden;
        }

        .impact-bar-fill {
          height: 100%;
          background-color: var(--accent-gold);
          border-radius: 2px;
        }

        .signal-conf {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-secondary);
          text-align: right;
        }

        /* Agent Activity */
        .agent-summary-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .agent-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .sparkline-inline {
          display: inline-flex;
          align-items: center;
          margin-left: 6px;
          margin-right: 4px;
          vertical-align: middle;
        }

        /* Recommended Actions */
        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-default);
        }
        .action-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.2s;
          background: var(--bg-card);
        }

        .checkbox.checked {
          background-color: var(--text-primary);
          border-color: var(--text-primary);
        }

        .action-text {
          font-size: 13px;
          flex: 1;
          line-height: 1.4;
          color: var(--text-primary);
          transition: color 0.2s;
        }

        .action-text.completed {
          color: var(--text-tertiary);
          text-decoration: line-through;
        }

        /* Archive Panel */
        .archive-panel {
          background-color: transparent;
          border: none;
          padding: 0;
          box-shadow: none;
        }

        .archive-header {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-tertiary);
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-default);
        }

        .archive-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .archive-item:hover {
          opacity: 0.8;
        }

        .archive-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .archive-dot.unread {
          background-color: var(--accent-gold);
          box-shadow: 0 0 8px rgba(255,215,0,0.4);
        }

        .archive-dot.read {
          background-color: var(--border-default);
        }

        .archive-content {
          flex: 1;
        }

        .archive-date {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 2px;
          font-family: var(--font-mono);
        }

        .archive-title {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .archive-item.current .archive-title {
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Animations */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes pulse-expand {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>

      <div className="herald-layout">
        {/* Sidebar */}
        <aside className="herald-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark"></div>
            OS
          </div>
          
          <div className="nav-section">
            <div className="nav-section-title">Intelligence</div>
            <div className="nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                <path d="M12 12v9"></path>
                <path d="m8 17 4 4 4-4"></path>
              </svg>
              Herald
            </div>
            <div className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Discovery
            </div>
            <div className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              Analytics
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Automation</div>
            <div className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
              Workflows
            </div>
            <div className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                <path d="M12 12 2.1 7.1"></path>
                <path d="m12 12 9.9 4.9"></path>
              </svg>
              Agents
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="herald-main">
          {/* Header */}
          <header className="herald-header">
            <div className="header-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                <path d="M3 11l18-5v12L3 14v-3z"></path>
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
              </svg>
              <span className="header-title">Herald</span>
            </div>
            <div className="header-right">
              <div className="search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Search briefings..." />
              </div>
              <div className="live-indicator">
                <div className="live-dot"></div>
                LIVE
              </div>
            </div>
          </header>

          {/* Content Scroll Area */}
          <div className="content-scroll">
            <div className="content-grid">
              
              {/* Left Column (70%) */}
              <div className="main-column">
                
                {/* Hero Card */}
                <div className="card hero-card">
                  <div>
                    <h1 className="hero-title">Daily Intelligence Briefing</h1>
                    <div className="hero-meta">March 12, 2026 | 08:00 CET</div>
                    <div className="hero-footer">Compiled by HERALD agent</div>
                  </div>
                  <div className="pulse-container">
                    <div className="pulse-ring pulse-ring-3"></div>
                    <div className="pulse-ring pulse-ring-2"></div>
                    <div className="pulse-ring pulse-ring-1"></div>
                    <div className="pulse-core"></div>
                  </div>
                </div>

                {/* Priority Alerts */}
                <div className="card alert-card">
                  <div className="card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span className="card-title">Priority Alerts</span>
                  </div>
                  <div className="alert-list">
                    <div className="alert-item">
                      <div className="pill pill-critical">Critical</div>
                      <div className="alert-content">
                        <div className="alert-title">Unauthorized Access Attempt</div>
                        <div className="alert-desc">Multiple failed authentication requests detected targeting the EU-West database cluster from unknown IP ranges.</div>
                        <div className="alert-time">07:42 CET</div>
                      </div>
                    </div>
                    <div className="alert-item">
                      <div className="pill pill-high">High</div>
                      <div className="alert-content">
                        <div className="alert-title">API Rate Limit Approaching</div>
                        <div className="alert-desc">Alpha Vantage integration is currently at 92% of daily quota. Potential data pipeline disruption expected within 2 hours.</div>
                        <div className="alert-time">06:15 CET</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Signals */}
                <div className="card">
                  <div className="card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span className="card-title">Market Signals</span>
                  </div>
                  <div className="signal-list">
                    <div className="signal-item">
                      <div className="signal-name">Tech Sector Volatility</div>
                      <div className="signal-source">Bloomberg API</div>
                      <div className="impact-bar-bg"><div className="impact-bar-fill" style={{ width: '85%' }}></div></div>
                      <div className="signal-conf">85%</div>
                    </div>
                    <div className="signal-item">
                      <div className="signal-name">Supply Chain Disruption</div>
                      <div className="signal-source">Global Trade Monitor</div>
                      <div className="impact-bar-bg"><div className="impact-bar-fill" style={{ width: '60%' }}></div></div>
                      <div className="signal-conf">60%</div>
                    </div>
                    <div className="signal-item">
                      <div className="signal-name">Competitor Pricing Change</div>
                      <div className="signal-source">Web Scraper Bot</div>
                      <div className="impact-bar-bg"><div className="impact-bar-fill" style={{ width: '40%' }}></div></div>
                      <div className="signal-conf">40%</div>
                    </div>
                  </div>
                </div>

                {/* Agent Activity Summary */}
                <div className="card">
                  <div className="card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                      <circle cx="12" cy="5" r="2"></circle>
                      <path d="M12 7v4"></path>
                      <line x1="8" y1="16" x2="8" y2="16"></line>
                      <line x1="16" y1="16" x2="16" y2="16"></line>
                    </svg>
                    <span className="card-title">Agent Activity Summary</span>
                  </div>
                  <div className="agent-summary-text">
                    <span className="agent-name">ATLAS</span> completed 4 network scans 
                    <span className="sparkline-inline">
                      <svg width="30" height="12" viewBox="0 0 30 12" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5">
                        <polyline points="0,10 5,8 10,11 15,4 20,6 25,2 30,5" />
                      </svg>
                    </span>
                    overnight. <span className="agent-name">HUNTER</span> captured 2 high-value leads from targeted forums 
                    <span className="sparkline-inline">
                      <svg width="30" height="12" viewBox="0 0 30 12" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5">
                        <polyline points="0,8 10,8 15,2 20,10 30,4" />
                      </svg>
                    </span>
                    . <span className="agent-name">CORTEX</span> successfully orchestrated 12 background tasks and optimized database indexing.
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="card">
                  <div className="card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span className="card-title">Recommended Actions</span>
                  </div>
                  <div className="action-list">
                    {actions.map(action => (
                      <div key={action.id} className="action-item" onClick={() => toggleAction(action.id)}>
                        <div className={`checkbox ${action.completed ? 'checked' : ''}`}>
                          {action.completed && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                        <div className={`action-text ${action.completed ? 'completed' : ''}`}>
                          {action.text}
                        </div>
                        <div className={`pill pill-${action.priority.toLowerCase()}`}>
                          {action.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column (30%) */}
              <div className="side-column">
                <div className="archive-panel">
                  <div className="archive-header">Briefing Archive</div>
                  <div className="archive-list">
                    {archiveData.map(item => (
                      <div key={item.id} className={`archive-item ${item.current ? 'current' : ''}`}>
                        <div className={`archive-dot ${item.read ? 'read' : 'unread'}`}></div>
                        <div className="archive-content">
                          <div className="archive-date">{item.date}</div>
                          <div className="archive-title">{item.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default HeraldGenerated;