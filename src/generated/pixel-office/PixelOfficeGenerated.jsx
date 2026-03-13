import React, { useState, useMemo, useEffect } from 'react';

const mockActivities = [
  { id: 1, agent: 'ATLAS', action: 'completed market scan — 12 leads found', time: 'Just now', type: 'success' },
  { id: 2, agent: 'HUNTER', action: 'initiated competitor pricing analysis', time: '2m ago', type: 'info' },
  { id: 3, agent: 'ORACLE', action: 'updated predictive revenue model v4', time: '15m ago', type: 'update' },
  { id: 4, agent: 'SYSTEM', action: 'daily data sync completed (4.2GB)', time: '1h ago', type: 'system' },
  { id: 5, agent: 'ATLAS', action: 'flagged anomaly in Q3 projections', time: '2h ago', type: 'warning' },
  { id: 6, agent: 'NOVA', action: 'drafted client communication sequence', time: '3h ago', type: 'info' },
  { id: 7, agent: 'HUNTER', action: 'scraped 450 new target profiles', time: '4h ago', type: 'success' },
  { id: 8, agent: 'ORACLE', action: 'recalibrated risk assessment matrix', time: '5h ago', type: 'update' },
];

const mockAgents = [
  { id: 'atlas', name: 'ATLAS', x: 20, y: 20, active: true },
  { id: 'hunter', name: 'HUNTER', x: 20, y: 60, active: true },
  { id: 'oracle', name: 'ORACLE', x: 60, y: 20, active: true },
  { id: 'nova', name: 'NOVA', x: 60, y: 60, active: false },
];

const PixelOfficeGenerated = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-hover: #FDFDFD;
          --bg-sidebar-active: #EBE4D8;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --text-muted: #99948D;
          
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-deep: #9D7A39;
          
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #15803D;
          --semantic-error: #EF4444;
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.04);
          --shadow-elevated: 0 12px 32px rgba(0, 0, 0, 0.08);
          --shadow-gold-glow: 0 0 15px rgba(255, 215, 0, 0.2);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: var(--font-sans);
          color: var(--text-primary);
          background-color: var(--bg-canvas);
          -webkit-font-smoothing: antialiased;
        }

        /* Layout */
        .app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .sidebar {
          width: 240px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-canvas);
          overflow-y: auto;
        }

        /* Sidebar Elements */
        .brand {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.02em;
          border-bottom: 1px solid var(--border-default);
        }

        .nav-menu {
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          padding: 10px 12px;
          border-radius: 8px;
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
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: var(--bg-sidebar-active);
          color: var(--text-primary);
          font-weight: 600;
        }

        /* Header */
        .header {
          height: 56px;
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background-color: var(--bg-canvas);
          border-bottom: 1px solid var(--border-default);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          width: 200px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .dot-red {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--semantic-error);
          animation: pulse-red 2s infinite;
        }

        /* Workspace Content */
        .workspace {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Hero Isometric Visualization */
        .hero-vis {
          width: 100%;
          height: 300px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          box-shadow: var(--shadow-elevated);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }

        .iso-plane {
          width: 800px;
          height: 600px;
          transform: rotateX(60deg) rotateZ(-45deg) scale(0.6);
          transform-style: preserve-3d;
          position: relative;
          background-image: 
            linear-gradient(var(--border-default) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-default) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: center center;
          border: 1px solid var(--border-default);
          background-color: var(--bg-sidebar); /* Warm cream tone */
        }

        .iso-desk {
          position: absolute;
          width: 80px;
          height: 120px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          transform: translateZ(10px);
          box-shadow: -10px 10px 20px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .iso-desk::before {
          content: '';
          position: absolute;
          top: 100%;
          left: -1px;
          width: 100%;
          height: 10px;
          background: #EBEBEB;
          transform-origin: top;
          transform: rotateX(-90deg);
          border: 1px solid var(--border-default);
        }
        
        .iso-desk::after {
          content: '';
          position: absolute;
          top: -1px;
          left: 100%;
          width: 10px;
          height: 100%;
          background: #F0F0F0;
          transform-origin: left;
          transform: rotateY(90deg);
          border: 1px solid var(--border-default);
        }

        .iso-meeting-room {
          position: absolute;
          top: 40px;
          right: 40px;
          width: 240px;
          height: 160px;
          background: rgba(255,255,255,0.5);
          border: 2px solid var(--border-default);
          transform: translateZ(2px);
          backdrop-filter: blur(4px);
        }

        .iso-data-wall {
          position: absolute;
          bottom: 40px;
          right: 40px;
          width: 200px;
          height: 40px;
          background: var(--text-primary);
          transform: translateZ(40px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .energy-sphere {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #FFF5C2, var(--accent-gold), var(--accent-gold-deep));
          box-shadow: var(--shadow-gold-glow), inset -10px -10px 20px rgba(0,0,0,0.2);
          position: absolute;
          bottom: 80px;
          right: 90px;
          transform: translateZ(60px) rotateX(-60deg) rotateZ(45deg); /* Counter-rotate to face camera */
          animation: breathe 4s infinite ease-in-out;
        }

        .agent-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-sidebar);
          border: 2px solid var(--text-primary);
          position: absolute;
          transform: translateZ(20px) rotateX(-60deg) rotateZ(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .agent-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-size: 10px;
          background: var(--bg-card);
          padding: 2px 6px;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          white-space: nowrap;
        }

        .pulse-gold {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent-gold);
          position: absolute;
          top: -4px;
          right: -4px;
          animation: pulse-gold-anim 2s infinite;
        }

        /* Grid Layout for Bottom Section */
        .dashboard-grid {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .feed-section {
          flex: 6;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px;
          box-shadow: var(--shadow-card);
        }

        .status-section {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Cards */
        .card-header {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feed-item {
          display: flex;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .feed-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .feed-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-sidebar);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          border: 1px solid var(--border-default);
        }

        .feed-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feed-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .feed-text strong {
          color: var(--text-primary);
          font-weight: 600;
        }

        .feed-meta {
          font-size: 12px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .status-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-card-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .status-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-subtext {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .dot-row {
          display: flex;
          gap: 6px;
        }

        .dot-green {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--semantic-success);
        }

        .pill-green {
          background-color: var(--semantic-success-bg);
          color: var(--semantic-success-text);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        /* Actions */
        .action-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background-color: var(--accent-gold);
          color: var(--text-primary);
        }

        .btn-primary:hover {
          background-color: var(--accent-gold-hover);
        }

        .btn-outline {
          background-color: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }

        .btn-outline:hover {
          background-color: var(--bg-hover);
          border-color: var(--text-tertiary);
        }

        /* Animations */
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes pulse-gold-anim {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes breathe {
          0% { transform: translateZ(60px) rotateX(-60deg) rotateZ(45deg) scale(0.95); opacity: 0.9; box-shadow: 0 0 15px rgba(255, 215, 0, 0.2); }
          50% { transform: translateZ(60px) rotateX(-60deg) rotateZ(45deg) scale(1.05); opacity: 1; box-shadow: 0 0 30px rgba(255, 215, 0, 0.4); }
          100% { transform: translateZ(60px) rotateX(-60deg) rotateZ(45deg) scale(0.95); opacity: 0.9; box-shadow: 0 0 15px rgba(255, 215, 0, 0.2); }
        }

        /* Icons (using simple SVG strings inline for independence) */
        .icon-svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <svg className="icon-svg" style={{ marginRight: '12px' }} viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            OS // CORE
          </div>
          <nav className="nav-menu">
            <div className="nav-item">
              <svg className="icon-svg" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Command Center
            </div>
            <div className="nav-item active">
              <svg className="icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Pixel Office
            </div>
            <div className="nav-item">
              <svg className="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Chronos
            </div>
            <div className="nav-item">
              <svg className="icon-svg" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              Knowledge Graph
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Header */}
          <header className="header">
            <div className="header-title">
              <svg className="icon-svg" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Pixel Office
            </div>
            <div className="header-actions">
              <div className="search-bar">
                <svg className="icon-svg" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Search workspace...
              </div>
              <div className="live-indicator">
                <div className="dot-red"></div>
                LIVE
              </div>
            </div>
          </header>

          {/* Workspace Area */}
          <div className="workspace">
            
            {/* Hero Visualization */}
            <div className="hero-vis">
              <div className="iso-plane">
                {/* Desks Cluster 1 */}
                <div className="iso-desk" style={{ top: '100px', left: '100px' }}>
                  <div className="agent-avatar">
                    <div className="agent-label">ATLAS</div>
                    A
                    <div className="pulse-gold"></div>
                  </div>
                </div>
                <div className="iso-desk" style={{ top: '100px', left: '200px' }}></div>
                <div className="iso-desk" style={{ top: '240px', left: '100px' }}>
                  <div className="agent-avatar">
                    <div className="agent-label">HUNTER</div>
                    H
                    <div className="pulse-gold"></div>
                  </div>
                </div>
                <div className="iso-desk" style={{ top: '240px', left: '200px' }}></div>

                {/* Desks Cluster 2 */}
                <div className="iso-desk" style={{ top: '100px', left: '400px' }}>
                  <div className="agent-avatar">
                    <div className="agent-label">ORACLE</div>
                    O
                    <div className="pulse-gold"></div>
                  </div>
                </div>
                <div className="iso-desk" style={{ top: '100px', left: '500px' }}></div>

                {/* Meeting Room */}
                <div className="iso-meeting-room">
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    STRATEGY_RM_01
                  </div>
                </div>

                {/* Data Wall & Energy Sphere */}
                <div className="iso-data-wall">
                  <div style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px' }}>
                    INTELLIGENCE CORE
                  </div>
                </div>
                <div className="energy-sphere"></div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="dashboard-grid">
              
              {/* Activity Feed */}
              <div className="feed-section">
                <div className="card-header">
                  Office Activity
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '400' }}>Today, {formatTime(currentTime)}</span>
                </div>
                <div className="feed-list">
                  {mockActivities.map((activity) => (
                    <div className="feed-item" key={activity.id}>
                      <div className="feed-icon">
                        {activity.agent.charAt(0)}
                      </div>
                      <div className="feed-content">
                        <div className="feed-text">
                          <strong>[{activity.agent}]</strong> {activity.action}
                        </div>
                        <div className="feed-meta">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Cards */}
              <div className="status-section">
                
                <div className="status-card">
                  <div className="status-card-title">Active Stations</div>
                  <div className="status-value">
                    7/7 Occupied
                    <div className="dot-row">
                      {[...Array(7)].map((_, i) => <div key={i} className="dot-green"></div>)}
                    </div>
                  </div>
                </div>

                <div className="status-card">
                  <div className="status-card-title">Meeting Room</div>
                  <div className="status-value">
                    <span className="pill-green">Available</span>
                  </div>
                  <div className="status-subtext">Next: Strategy Review 14:00</div>
                </div>

                <div className="status-card">
                  <div className="status-card-title">Data Wall</div>
                  <div className="status-value">
                    Live Intelligence Feed
                    <div className="pulse-gold" style={{ position: 'relative', top: 0, right: 0, marginLeft: '8px' }}></div>
                  </div>
                  <div className="status-subtext">1,245 data points streaming</div>
                </div>

                <div className="action-row">
                  <button className="btn btn-primary">Start Focus Session</button>
                  <button className="btn btn-outline">Schedule Meeting</button>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default PixelOfficeGenerated;