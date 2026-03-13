import React, { useState, useEffect, useMemo } from 'react';

const ControlTowerGenerated = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kpis = useMemo(() => [
    { id: 'kpi-1', label: 'ACTIVE AGENTS', value: '1,248', trend: '+12.4%', status: 'success' },
    { id: 'kpi-2', label: 'SYSTEM LOAD', value: '42.8%', trend: '-2.1%', status: 'success' },
    { id: 'kpi-3', label: 'TASKS IN FLIGHT', value: '8,932', trend: '+845', status: 'warning' },
    { id: 'kpi-4', label: 'ERROR RATE', value: '0.04%', trend: '-0.01%', status: 'success' }
  ], []);

  const liveFeed = useMemo(() => [
    { id: 'evt-1', time: '14:32:01', action: 'Model Sync', entity: 'Cluster-Alpha', status: 'success' },
    { id: 'evt-2', time: '14:31:58', action: 'Data Ingestion', entity: 'Pipeline-X', status: 'success' },
    { id: 'evt-3', time: '14:31:45', action: 'Node Failure', entity: 'Worker-7B', status: 'error' },
    { id: 'evt-4', time: '14:31:22', action: 'Auto-Scaling', entity: 'Cluster-Beta', status: 'warning' },
    { id: 'evt-5', time: '14:30:10', action: 'Query Exec', entity: 'DB-Main', status: 'success' },
    { id: 'evt-6', time: '14:29:55', action: 'Cache Purge', entity: 'Edge-US-East', status: 'success' },
  ], []);

  const systemHealth = useMemo(() => [
    { service: 'API Gateway', load: 34, status: 'success' },
    { service: 'Compute Engine', load: 78, status: 'warning' },
    { service: 'Database Cluster', load: 45, status: 'success' },
    { service: 'Message Queue', load: 12, status: 'success' },
  ], []);

  const nodes = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    id: i,
    active: Math.random() > 0.3,
    processing: Math.random() > 0.8,
    error: Math.random() > 0.95
  })), []);

  return (
    <div style={styles.container}>
      <style>
        {`
          :root {
            --bg-canvas: #FAFAF8;
            --bg-card: #FFFFFF;
            --text-primary: #1A1A1A;
            --text-secondary: #6B6B6B;
            --text-tertiary: #9CA3AF;
            --text-muted: #99948D;
            --accent-gold: #FFD700;
            --accent-gold-muted: rgba(255,215,0,0.10);
            --border-default: #E5E5E0;
            --border-subtle: #F0F0EE;
            --semantic-success: #10B981;
            --semantic-success-bg: #E6F5EC;
            --semantic-success-text: #15803D;
            --semantic-error: #EF4444;
            --semantic-error-bg: #FEF2F2;
            --semantic-error-text: #B91C1C;
            --semantic-warning: #FFFCE6;
            --semantic-warning-text: #A68900;
            
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            
            --shadow-card: 0 2px 8px rgba(0,0,0,0.05);
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          @keyframes pulse-gold {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
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

          .card-hover {
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-color: var(--accent-gold);
          }

          .row-hover {
            transition: background-color 0.15s ease;
          }
          .row-hover:hover {
            background-color: #FDFDFD;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--border-default);
            border-radius: 3px;
          }
        `}
      </style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.globalStatusIndicator}></div>
          <div>
            <h1 style={styles.title}>Control Tower</h1>
            <div style={styles.subtitle}>Global System Overview</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.timeDisplay}>
            {currentTime.toLocaleTimeString('en-US', { hour12: false })} UTC
          </div>
          <button style={styles.actionButton}>
            SYSTEM LOGS
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <section style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <div key={kpi.id} style={styles.kpiCard} className="card-hover">
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>{kpi.label}</span>
              <span style={{
                ...styles.kpiTrend,
                color: kpi.status === 'success' ? 'var(--semantic-success-text)' : 
                       kpi.status === 'warning' ? 'var(--semantic-warning-text)' : 'var(--semantic-error-text)',
                backgroundColor: kpi.status === 'success' ? 'var(--semantic-success-bg)' : 
                                 kpi.status === 'warning' ? 'var(--semantic-warning)' : 'var(--semantic-error-bg)'
              }}>
                {kpi.trend}
              </span>
            </div>
            <div style={styles.kpiValue}>{kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section style={styles.mainGrid}>
        
        {/* Live Feed */}
        <div style={{...styles.card, gridColumn: 'span 8'}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>FLIGHT PATH / LIVE FEED</h2>
            <span style={styles.cardAction}>View All</span>
          </div>
          <div style={styles.tableContainer} className="custom-scrollbar">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>TIMESTAMP</th>
                  <th style={styles.th}>ACTION</th>
                  <th style={styles.th}>ENTITY</th>
                  <th style={{...styles.th, textAlign: 'right'}}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {liveFeed.map((evt) => (
                  <tr key={evt.id} style={styles.tr} className="row-hover">
                    <td style={styles.tdMono}>{evt.time}</td>
                    <td style={styles.tdPrimary}>{evt.action}</td>
                    <td style={styles.tdSecondary}>{evt.entity}</td>
                    <td style={{...styles.td, textAlign: 'right'}}>
                      <div style={styles.statusWrapper}>
                        <div style={{
                          ...styles.statusDot,
                          backgroundColor: evt.status === 'success' ? 'var(--semantic-success)' :
                                           evt.status === 'warning' ? 'var(--accent-gold)' : 'var(--semantic-error)',
                          animation: evt.status === 'error' ? 'pulse-error 2s infinite' : 'none'
                        }}></div>
                        <span style={{
                          ...styles.statusText,
                          color: evt.status === 'success' ? 'var(--semantic-success-text)' :
                                 evt.status === 'warning' ? 'var(--semantic-warning-text)' : 'var(--semantic-error-text)'
                        }}>
                          {evt.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div style={{...styles.card, gridColumn: 'span 4', display: 'flex', flexDirection: 'column'}}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>SYSTEM HEALTH</h2>
          </div>
          <div style={styles.healthContainer}>
            {systemHealth.map((sys, idx) => (
              <div key={idx} style={styles.healthRow}>
                <div style={styles.healthHeader}>
                  <span style={styles.healthLabel}>{sys.service}</span>
                  <span style={styles.healthValue}>{sys.load}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${sys.load}%`,
                    backgroundColor: sys.load > 75 ? 'var(--accent-gold)' : 'var(--semantic-success)'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={styles.nodeMapContainer}>
             <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>ACTIVE NODES</h2>
            </div>
            <div style={styles.nodeGrid}>
              {nodes.map(node => (
                <div 
                  key={node.id} 
                  style={{
                    ...styles.node,
                    backgroundColor: node.error ? 'var(--semantic-error)' : 
                                     node.processing ? 'var(--accent-gold)' : 
                                     node.active ? 'var(--semantic-success)' : 'var(--border-default)',
                    animation: node.processing ? 'pulse-gold 2s infinite' : 
                               node.error ? 'pulse-error 1.5s infinite' : 'none'
                  }}
                  title={`Node ${node.id} - ${node.error ? 'Error' : node.processing ? 'Processing' : node.active ? 'Idle' : 'Offline'}`}
                />
              ))}
            </div>
            <div style={styles.nodeLegend}>
              <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--semantic-success)'}}></div> Idle</div>
              <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--accent-gold)'}}></div> Active</div>
              <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--semantic-error)'}}></div> Error</div>
              <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--border-default)'}}></div> Offline</div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'var(--font-sans)',
    backgroundColor: 'var(--bg-canvas)',
    color: 'var(--text-primary)',
    minHeight: '100vh',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-default)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  globalStatusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--semantic-success)',
    animation: 'pulse-success 2s infinite',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '4px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  timeDisplay: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    letterSpacing: 'tracking-tight',
  },
  actionButton: {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
  },
  kpiCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  kpiTrend: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
    flex: 1,
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  cardTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
  },
  cardAction: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '12px 20px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
  },
  td: {
    padding: '12px 20px',
    fontSize: '13px',
  },
  tdMono: {
    padding: '12px 20px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  tdPrimary: {
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  tdSecondary: {
    padding: '12px 20px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  statusWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  healthContainer: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  healthRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  healthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  healthValue: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    height: '4px',
    backgroundColor: 'var(--border-subtle)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  nodeMapContainer: {
    padding: '0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  nodeGrid: {
    padding: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '8px',
    justifyContent: 'center',
  },
  node: {
    aspectRatio: '1',
    borderRadius: '2px',
    transition: 'background-color 0.3s ease',
  },
  nodeLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    padding: '0 20px 20px 20px',
    marginTop: 'auto',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '2px',
  }
};

export default ControlTowerGenerated;