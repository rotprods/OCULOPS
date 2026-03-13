import React, { useState, useMemo } from 'react';

const CrmGenerated = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- MOCK DATA ---
  const kpis = [
    { label: 'Total Pipeline', value: '$2.4M', trend: '+12.5%', isPositive: true },
    { label: 'Active Deals', value: '48', trend: '+4', isPositive: true },
    { label: 'Win Rate', value: '64.2%', trend: '-1.2%', isPositive: false },
    { label: 'Avg Deal Size', value: '$50k', trend: '+5.0%', isPositive: true },
  ];

  const clients = [
    { id: 'C-1042', name: 'Acme Corp', contact: 'Sarah Jenkins', stage: 'Negotiation', value: 125000, lastActive: '2h ago', status: 'hot' },
    { id: 'C-1043', name: 'Globex Inc', contact: 'Michael Chang', stage: 'Discovery', value: 45000, lastActive: '1d ago', status: 'warm' },
    { id: 'C-1044', name: 'Initech', contact: 'Peter Gibbons', stage: 'Closed Won', value: 85000, lastActive: '3d ago', status: 'won' },
    { id: 'C-1045', name: 'Soylent', contact: 'John Doe', stage: 'Proposal', value: 210000, lastActive: '4h ago', status: 'hot' },
    { id: 'C-1046', name: 'Massive Dynamic', contact: 'William Bell', stage: 'Lead', value: 0, lastActive: '5d ago', status: 'cold' },
    { id: 'C-1047', name: 'Umbrella Corp', contact: 'Albert Wesker', stage: 'Negotiation', value: 500000, lastActive: '10m ago', status: 'hot' },
  ];

  const activities = [
    { id: 1, type: 'email', text: 'Proposal sent to Acme Corp', time: '10:42 AM' },
    { id: 2, type: 'meeting', text: 'Discovery call with Globex', time: 'Yesterday' },
    { id: 3, type: 'status', text: 'Initech marked as Closed Won', time: 'Oct 24' },
    { id: 4, type: 'note', text: 'Left voicemail for William Bell', time: 'Oct 22' },
  ];

  // --- FILTERING ---
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.contact.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'active') return matchesSearch && c.stage !== 'Closed Won';
      if (activeTab === 'won') return matchesSearch && c.stage === 'Closed Won';
      return matchesSearch;
    });
  }, [clients, activeTab, searchQuery]);

  // --- STYLES ---
  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-canvas)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)',
    },
    sidebar: {
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      height: '72px',
      borderBottom: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      backgroundColor: 'var(--bg-canvas)',
    },
    content: {
      flex: 1,
      padding: '32px',
      overflowY: 'auto',
    },
    pageTitle: {
      fontSize: 'var(--text-h1)',
      fontWeight: 'var(--weight-semibold)',
      margin: '0 0 24px 0',
      letterSpacing: 'var(--tracking-tight)',
    },
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    card: {
      backgroundColor: 'var(--bg-card)',
      borderRadius: '8px',
      border: '1px solid var(--border-default)',
      padding: '24px',
      boxShadow: 'var(--shadow-sm)',
      animation: 'fadeIn 0.5s ease-out forwards',
    },
    kpiLabel: {
      fontSize: 'var(--text-label)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-secondary)',
      marginBottom: '8px',
      fontWeight: 'var(--weight-medium)',
    },
    kpiValue: {
      fontSize: 'var(--text-kpi)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      marginBottom: '8px',
    },
    trendBadge: (isPositive) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: 'var(--text-tiny)',
      fontWeight: 'var(--weight-medium)',
      backgroundColor: isPositive ? 'var(--success-bg)' : 'var(--error-bg)',
      color: isPositive ? 'var(--success-text)' : 'var(--error-text)',
    }),
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: '12px',
    },
    sectionTitle: {
      fontSize: 'var(--text-h3)',
      fontWeight: 'var(--weight-semibold)',
      margin: 0,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
    },
    th: {
      fontSize: 'var(--text-table-header)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--tracking-wide)',
      color: 'var(--text-muted)',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-default)',
      fontWeight: 'var(--weight-medium)',
    },
    td: {
      padding: '16px',
      borderBottom: '1px solid var(--border-subtle)',
      fontSize: 'var(--text-body)',
      color: 'var(--text-secondary)',
    },
    tdPrimary: {
      color: 'var(--text-primary)',
      fontWeight: 'var(--weight-medium)',
    },
    monoText: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-body-sm)',
    },
    statusPill: (status) => {
      const colors = {
        hot: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', dot: 'var(--accent-gold)' },
        warm: { bg: '#F3F4F6', text: 'var(--text-secondary)', dot: '#9CA3AF' },
        cold: { bg: '#F3F4F6', text: 'var(--text-tertiary)', dot: '#D1D5DB' },
        won: { bg: 'var(--success-bg)', text: 'var(--success-text)', dot: '#10B981' },
      };
      const config = colors[status] || colors.cold;
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: 'var(--text-tiny)',
        fontWeight: 'var(--weight-medium)',
        backgroundColor: config.bg,
        color: config.text,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      };
    },
    statusDot: (status) => {
      const colors = { hot: 'var(--accent-gold)', warm: '#9CA3AF', cold: '#D1D5DB', won: '#10B981' };
      return {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: colors[status] || colors.cold,
        ...(status === 'hot' ? { animation: 'pulseGold 2s infinite' } : {})
      };
    },
    buttonPrimary: {
      backgroundColor: 'var(--accent-gold)',
      color: '#000',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: 'var(--text-body-sm)',
      fontWeight: 'var(--weight-medium)',
      cursor: 'pointer',
      transition: 'background 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    searchInput: {
      padding: '8px 12px 8px 32px',
      borderRadius: '4px',
      border: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-input)',
      fontSize: 'var(--text-body-sm)',
      width: '240px',
      outline: 'none',
      fontFamily: 'var(--font-sans)',
    },
    tabs: {
      display: 'flex',
      gap: '24px',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-default)',
    },
    tab: (isActive) => ({
      padding: '8px 0',
      fontSize: 'var(--text-body-sm)',
      fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      borderBottom: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
      cursor: 'pointer',
      background: 'none',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }),
    activityItem: {
      display: 'flex',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)',
    },
    activityIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'var(--bg-sidebar)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      color: 'var(--text-secondary)',
    },
    activityContent: {
      flex: 1,
    },
    activityText: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-primary)',
      margin: '0 0 4px 0',
    },
    activityTime: {
      fontSize: 'var(--text-tiny)',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --bg-canvas: #FAFAF8;
            --bg-sidebar: #F5F0E8;
            --bg-card: #FFFFFF;
            --bg-input: #FAFAF8;
            --bg-hover-row: #FDFDFD;
            
            --text-primary: #1A1A1A;
            --text-secondary: #6B6B6B;
            --text-tertiary: #9CA3AF;
            --text-muted: #99948D;
            
            --accent-gold: #FFD700;
            --accent-gold-hover: #F0C800;
            
            --border-default: #E5E5E0;
            --border-subtle: #F0F0EE;
            
            --success-bg: #E6F5EC;
            --success-text: #15803D;
            --error-bg: #FEF2F2;
            --error-text: #B91C1C;
            --warning-bg: #FFFCE6;
            --warning-text: #A68900;
            
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            
            --weight-regular: 400;
            --weight-medium: 500;
            --weight-semibold: 600;
            --weight-bold: 700;
            
            --text-h1: 24px;
            --text-h3: 18px;
            --text-kpi: 28px;
            --text-body: 14px;
            --text-body-sm: 13px;
            --text-label: 10px;
            --text-table-header: 10px;
            --text-tiny: 11px;
            
            --tracking-tight: -0.02em;
            --tracking-wide: 0.08em;
            
            --shadow-sm: 0 2px 8px rgba(0,0,0,0.05);
          }

          @keyframes pulseGold {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
            70% { box-shadow: 0 0 0 4px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .hover-row:hover {
            background-color: var(--bg-hover-row);
          }
          
          .btn-primary:hover {
            background-color: var(--accent-gold-hover) !important;
          }
        `}
      </style>

      <div style={styles.container}>
        {/* Minimal Sidebar for context */}
        <div style={styles.sidebar}>
          <div style={{ padding: '0 24px', marginBottom: '40px', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)' }}>
            NEXUS<span style={{ color: 'var(--accent-gold)' }}>.</span>CRM
          </div>
          <div style={{ padding: '0 16px' }}>
            {['Dashboard', 'Pipeline', 'Clients', 'Reports', 'Settings'].map((item, i) => (
              <div key={item} style={{
                padding: '10px 16px',
                fontSize: 'var(--text-body-sm)',
                color: i === 2 ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: i === 2 ? 'rgba(0,0,0,0.04)' : 'transparent',
                borderRadius: '6px',
                marginBottom: '4px',
                fontWeight: i === 2 ? 'var(--weight-medium)' : 'var(--weight-regular)',
                cursor: 'pointer'
              }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          <header style={styles.header}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '14px', color: 'var(--text-tertiary)' }}>⚲</span>
              <input 
                type="text" 
                placeholder="Search clients, deals..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-default)' }}></div>
            </div>
          </header>

          <main style={styles.content}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <h1 style={styles.pageTitle}>Client Relationships</h1>
              <button style={styles.buttonPrimary} className="btn-primary">
                <span style={{ fontSize: '16px' }}>+</span> New Deal
              </button>
            </div>

            {/* KPIs */}
            <div style={styles.kpiGrid}>
              {kpis.map((kpi, index) => (
                <div key={index} style={{...styles.card, animationDelay: `${index * 0.1}s`}}>
                  <div style={styles.kpiLabel}>{kpi.label}</div>
                  <div style={styles.kpiValue}>{kpi.value}</div>
                  <div style={styles.trendBadge(kpi.isPositive)}>
                    {kpi.trend} vs last month
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid: Table + Sidebar */}
            <div style={styles.mainGrid}>
              
              {/* Left Col: Client Table */}
              <div style={{...styles.card, padding: '24px 0'}}>
                <div style={{ padding: '0 24px' }}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Active Pipeline</h2>
                  </div>
                  
                  <div style={styles.tabs}>
                    {['all', 'active', 'won'].map(tab => (
                      <button 
                        key={tab} 
                        style={styles.tab(activeTab === tab)}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab} Deals
                      </button>
                    ))}
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Client / ID</th>
                      <th style={styles.th}>Primary Contact</th>
                      <th style={styles.th}>Stage</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Est. Value</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover-row" style={{ transition: 'background 0.2s' }}>
                        <td style={styles.td}>
                          <div style={styles.tdPrimary}>{client.name}</div>
                          <div style={{...styles.monoText, color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '4px'}}>{client.id}</div>
                        </td>
                        <td style={styles.td}>{client.contact}</td>
                        <td style={styles.td}>
                          <span style={{ fontSize: 'var(--text-body-sm)' }}>{client.stage}</span>
                        </td>
                        <td style={{...styles.td, ...styles.monoText, textAlign: 'right', color: 'var(--text-primary)'}}>
                          {client.value > 0 ? `$${client.value.toLocaleString()}` : '--'}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.statusPill(client.status)}>
                            <div style={styles.statusDot(client.status)}></div>
                            {client.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Col: Activity Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={styles.card}>
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Recent Activity</h2>
                    <span style={{ fontSize: 'var(--text-tiny)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View All</span>
                  </div>
                  
                  <div>
                    {activities.map((act) => (
                      <div key={act.id} style={styles.activityItem}>
                        <div style={styles.activityIcon}>
                          {act.type === 'email' ? '✉' : act.type === 'meeting' ? '◷' : '✎'}
                        </div>
                        <div style={styles.activityContent}>
                          <p style={styles.activityText}>{act.text}</p>
                          <span style={styles.activityTime}>{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{...styles.card, backgroundColor: 'var(--bg-sidebar)', border: 'none'}}>
                  <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--weight-semibold)', margin: '0 0 8px 0' }}>Need Help?</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    Connect with your dedicated account manager to optimize your pipeline setup.
                  </p>
                  <button style={{...styles.buttonPrimary, backgroundColor: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-primary)'}}>
                    Schedule Call
                  </button>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CrmGenerated;