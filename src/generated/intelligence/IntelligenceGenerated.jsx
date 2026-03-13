import React, { useState, useEffect, useMemo } from 'react';

const IntelligenceGenerated = () => {
  const [activeTab, setActiveTab] = useState('predictive');
  const [isScanning, setIsScanning] = useState(true);

  // Mock Data
  const kpis = useMemo(() => [
    { id: 1, label: 'Signal Confidence', value: '98.4%', trend: '+1.2%', status: 'success' },
    { id: 2, label: 'Anomalies Detected', value: '14', trend: '-3', status: 'success' },
    { id: 3, label: 'Threat Prevention', value: '99.9%', trend: '0.0%', status: 'neutral' },
    { id: 4, label: 'Active AI Agents', value: '6', trend: '+2', status: 'success' }
  ], []);

  const insights = useMemo(() => [
    { id: 101, type: 'critical', text: 'Unusual data exfiltration pattern detected in US-East cluster.', time: '2m ago', score: 0.98 },
    { id: 102, type: 'warning', text: 'API rate limits approaching threshold for Service Account A.', time: '15m ago', score: 0.85 },
    { id: 103, type: 'info', text: 'Resource allocation optimized based on predictive load model.', time: '1h ago', score: 0.92 },
    { id: 104, type: 'info', text: 'New entity relationship mapped in Knowledge Graph.', time: '3h ago', score: 0.78 }
  ], []);

  const signals = useMemo(() => [
    { id: 'SIG-8921', source: 'Auth Gateway', type: 'Credential Stuffing', confidence: 0.96, status: 'Mitigated', time: '10:42:05' },
    { id: 'SIG-8922', source: 'DB Cluster', type: 'Query Anomaly', confidence: 0.82, status: 'Investigating', time: '10:38:12' },
    { id: 'SIG-8923', source: 'Edge Node', type: 'DDoS Attempt', confidence: 0.99, status: 'Blocked', time: '10:15:00' },
    { id: 'SIG-8924', source: 'Internal API', type: 'Unauthorized Access', confidence: 0.75, status: 'Flagged', time: '09:55:30' }
  ], []);

  // SVG Chart Data Generation
  const chartPoints = "0,80 10,75 20,85 30,60 40,65 50,40 60,45 70,20 80,30 90,10 100,15";
  const areaPoints = `${chartPoints} 100,100 0,100`;

  return (
    <div className="intelligence-dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-card: #FFFFFF;
          --bg-sidebar: #F5F0E8;
          --bg-graph: #F8F8F8;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-muted: #99948D;
          
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.30);
          --accent-gold-deep: #9D7A39;
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --semantic-success: #10B981;
          --semantic-error: #EF4444;
          --semantic-warning: #F59E0B;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02);
          --glow-gold: 0 0 15px rgba(255,215,0,0.15);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .intelligence-dashboard {
          font-family: var(--font-sans);
          background-color: var(--bg-canvas);
          color: var(--text-primary);
          min-height: 100vh;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Typography */
        h1 { font-size: 24px; font-weight: 500; letter-spacing: -0.02em; }
        h2 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); margin-bottom: 16px; }
        .mono { font-family: var(--font-mono); }
        .text-small { font-size: 12px; }
        .text-muted { color: var(--text-muted); }

        /* Layout */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr; }
        }

        /* Cards */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 24px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
        }

        /* Specific Components */
        .kpi-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .kpi-value {
          font-size: 28px;
          font-weight: 400;
          font-family: var(--font-mono);
          letter-spacing: -0.05em;
        }

        .kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .trend-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-family: var(--font-mono);
          padding: 2px 6px;
          border-radius: 4px;
          background: #E6F5EC;
          color: #008F39;
          width: fit-content;
        }
        .trend-badge.neutral { background: var(--bg-sidebar); color: var(--text-secondary); }

        /* Chart Area */
        .chart-container {
          height: 240px;
          width: 100%;
          position: relative;
          margin-top: 16px;
          border-bottom: 1px solid var(--border-subtle);
          border-left: 1px solid var(--border-subtle);
        }

        .chart-tabs {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .chart-tab {
          background: none;
          border: none;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          padding-bottom: 4px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .chart-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent-gold);
          font-weight: 500;
        }

        /* Insights List */
        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-canvas);
          transition: border-color 0.2s ease;
        }

        .insight-item:hover {
          border-color: var(--accent-gold-border);
        }

        .insight-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .dot-critical { background: var(--semantic-error); }
        .dot-warning { background: var(--semantic-warning); }
        .dot-info { background: var(--accent-gold); box-shadow: var(--glow-gold); animation: pulse-gold 2s infinite; }

        .insight-content { flex: 1; }
        .insight-text { font-size: 13px; line-height: 1.5; margin-bottom: 4px; }
        .insight-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }

        /* Knowledge Graph */
        .graph-container {
          height: 200px;
          background: var(--bg-graph);
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
          position: relative;
          overflow: hidden;
          background-image: linear-gradient(#E5E5E0 1px, transparent 1px), linear-gradient(90deg, #E5E5E0 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .graph-node {
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--bg-card);
          border: 2px solid var(--text-secondary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }
        
        .graph-node.active {
          border-color: var(--accent-gold);
          box-shadow: var(--glow-gold);
          background: var(--accent-gold-muted);
        }

        .graph-line {
          position: absolute;
          background: var(--border-default);
          transform-origin: left center;
          z-index: 1;
          height: 1px;
        }

        .scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--accent-gold);
          opacity: 0.5;
          box-shadow: 0 0 10px var(--accent-gold);
          animation: scan 3s linear infinite;
          z-index: 3;
        }

        /* Table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-canvas);
        }

        .data-table td {
          padding: 12px 16px;
          font-size: 13px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .data-table tr:hover td {
          background: #FDFDFD;
        }

        .status-pill {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
          display: inline-block;
        }

        /* Animations */
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255,215,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
        }

        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { top: 110%; opacity: 0; }
        }

        /* Utilities */
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border-default);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: var(--font-sans);
          font-size: 12px;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .btn-outline:hover {
          border-color: var(--accent-gold);
          background: var(--accent-gold-muted);
        }
      `}</style>

      <header className="header">
        <div>
          <h1>Intelligence Core</h1>
          <div className="text-small text-muted" style={{ marginTop: '4px' }}>System Status: Optimal • Last updated: Just now</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="mono text-small text-muted">UTC 10:45:22</div>
          <button className="btn-outline">Export Report</button>
        </div>
      </header>

      <section className="kpi-grid">
        {kpis.map(kpi => (
          <div key={kpi.id} className="card kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`trend-badge ${kpi.status}`}>
              {kpi.trend} vs last 24h
            </div>
          </div>
        ))}
      </section>

      <div className="main-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Chart Card */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2>Predictive Threat Model</h2>
              <div className="chart-tabs">
                <button className={`chart-tab ${activeTab === 'predictive' ? 'active' : ''}`} onClick={() => setActiveTab('predictive')}>Predictive</button>
                <button className={`chart-tab ${activeTab === 'historical' ? 'active' : ''}`} onClick={() => setActiveTab('historical')}>Historical</button>
              </div>
            </div>
            
            <div className="chart-container">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-subtle)" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-subtle)" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-subtle)" strokeWidth="0.5" />
                
                {/* Area fill */}
                <polygon points={areaPoints} fill="var(--accent-gold-muted)" opacity="0.3" />
                
                {/* Line */}
                <polyline points={chartPoints} fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round" />
                
                {/* Current Data Point Indicator */}
                <circle cx="90" cy="10" r="2" fill="var(--accent-gold)" stroke="var(--bg-card)" strokeWidth="1" style={{ animation: 'pulse-gold 2s infinite' }} />
              </svg>
              
              {/* X-Axis Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                <span>-24h</span>
                <span>-12h</span>
                <span>-6h</span>
                <span>Now</span>
              </div>
            </div>
          </div>

          {/* Signals Table Card */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 16px 24px' }}>
              <h2>Recent Anomalous Signals</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Signal ID</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Classification</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {signals.map(signal => (
                  <tr key={signal.id}>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{signal.id}</td>
                    <td className="mono text-muted">{signal.time}</td>
                    <td>{signal.source}</td>
                    <td>{signal.type}</td>
                    <td className="mono">{signal.confidence.toFixed(2)}</td>
                    <td>
                      <span className="status-pill" style={{ 
                        borderColor: signal.status === 'Blocked' ? 'var(--semantic-success)' : 'var(--border-default)',
                        color: signal.status === 'Blocked' ? 'var(--semantic-success)' : 'var(--text-secondary)'
                      }}>
                        {signal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Knowledge Graph Card */}
          <div className="card">
            <div className="flex-between">
              <h2>Entity Graph</h2>
              <button className="btn-outline" onClick={() => setIsScanning(!isScanning)} style={{ padding: '2px 8px', fontSize: '10px' }}>
                {isScanning ? 'Stop Scan' : 'Scan'}
              </button>
            </div>
            <div className="graph-container" style={{ marginTop: '16px' }}>
              {isScanning && <div className="scanline"></div>}
              
              {/* Mock Nodes */}
              <div className="graph-node active" style={{ top: '50%', left: '50%' }}></div>
              <div className="graph-node" style={{ top: '20%', left: '30%' }}></div>
              <div className="graph-node" style={{ top: '70%', left: '20%' }}></div>
              <div className="graph-node" style={{ top: '30%', left: '80%' }}></div>
              <div className="graph-node" style={{ top: '80%', left: '70%' }}></div>

              {/* Mock Edges (Calculated roughly for visual effect) */}
              <div className="graph-line" style={{ top: '50%', left: '50%', width: '60px', transform: 'rotate(-145deg)' }}></div>
              <div className="graph-line" style={{ top: '50%', left: '50%', width: '70px', transform: 'rotate(145deg)' }}></div>
              <div className="graph-line" style={{ top: '50%', left: '50%', width: '80px', transform: 'rotate(-35deg)' }}></div>
              <div className="graph-line" style={{ top: '50%', left: '50%', width: '65px', transform: 'rotate(45deg)' }}></div>
            </div>
            <div className="text-small text-muted" style={{ marginTop: '12px', textAlign: 'center' }}>
              Mapping relationships across 4,291 active nodes.
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="card" style={{ flex: 1 }}>
            <h2>AI Insights & Actions</h2>
            <div className="insight-list">
              {insights.map(insight => (
                <div key={insight.id} className="insight-item">
                  <div className={`insight-dot dot-${insight.type}`}></div>
                  <div className="insight-content">
                    <div className="insight-text">{insight.text}</div>
                    <div className="insight-meta">
                      <span>{insight.time}</span>
                      <span>Score: {insight.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IntelligenceGenerated;