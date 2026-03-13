import React, { useState } from 'react';

const GtmGenerated = () => {
  const [activeNav, setActiveNav] = useState('GTM');

  const campaigns = [
    {
      id: 1,
      name: 'Q1 Enterprise Outreach',
      status: 'Active',
      channel: 'LinkedIn Outbound',
      icon: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-1.85 0-2.68.96-3.14 1.68v-1.42h-3v9.8h3v-5.46c0-.28.05-.55.14-.75.24-.55.75-1.12 1.63-1.12 1.15 0 1.61.88 1.61 2.16v5.2h3.02M5.88 8.56a1.56 1.56 0 1 0 0-3.12 1.56 1.56 0 0 0 0 3.12m1.5 9.94V9.2H4.38v9.3h3" /> ,
      spent: 3000,
      budget: 5000,
      leads: 24,
      cpl: 125,
      ctr: 3.2,
      timeline: 'Mar 1 - Mar 31',
      timelineStart: 0,
      timelineWidth: 50
    },
    {
      id: 2,
      name: 'SaaS Founder Webinar',
      status: 'Active',
      channel: 'Email + Social',
      icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />,
      spent: 4500,
      budget: 6000,
      leads: 18,
      cpl: 250,
      ctr: 2.1,
      timeline: 'Mar 15 - Apr 15',
      timelineStart: 25,
      timelineWidth: 50
    },
    {
      id: 3,
      name: 'AI Feature Launch',
      status: 'Draft',
      channel: 'Product Hunt',
      icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />,
      spent: 0,
      budget: 2000,
      leads: 0,
      cpl: 0,
      ctr: 0,
      timeline: 'Apr 1 - Apr 7',
      timelineStart: 50,
      timelineWidth: 12.5
    },
    {
      id: 4,
      name: 'Q2 Retargeting',
      status: 'Paused',
      channel: 'Google Ads',
      icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />,
      spent: 1000,
      budget: 1000,
      leads: 5,
      cpl: 200,
      ctr: 1.5,
      timeline: 'Apr 15 - Apr 30',
      timelineStart: 75,
      timelineWidth: 25
    }
  ];

  return (
    <div style={styles.container}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

          :root {
            --bg-canvas: #FAFAF8;
            --bg-sidebar: #F5F0E8;
            --bg-card: #FFFFFF;
            --text-primary: #1A1A1A;
            --text-secondary: #6B6B6B;
            --text-tertiary: #9CA3AF;
            --accent-gold: #FFD700;
            --accent-gold-hover: #F0C800;
            --border-default: #E5E5E0;
            --semantic-success-bg: #E6F5EC;
            --semantic-success-text: #15803D;
            --semantic-warning-bg: #FFFCE6;
            --semantic-warning-text: #A68900;
            --semantic-draft-bg: #F3F4F6;
            --semantic-draft-text: #4B5563;
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          @keyframes pulse-live {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }

          @keyframes heartbeat-gold {
            0% { opacity: 0.3; width: 10px; }
            50% { opacity: 1; width: 40px; }
            100% { opacity: 0.3; width: 10px; }
          }

          .btn-ghost:hover {
            background-color: rgba(0,0,0,0.02);
          }
          
          .btn-gold:hover {
            background-color: var(--accent-gold-hover) !important;
          }

          .nav-item:hover {
            background-color: rgba(0,0,0,0.04);
          }
          
          .card-hover:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transform: translateY(-1px);
            transition: all 0.2s ease;
          }
        `}
      </style>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoMark}></div>
          <span style={styles.logoText}>OS</span>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navSection}>
            <span style={styles.navSectionTitle}>CORE</span>
            {['Dashboard', 'Contacts', 'Companies'].map(item => (
              <div key={item} style={styles.navItem} className="nav-item">
                {item}
              </div>
            ))}
          </div>
          
          <div style={styles.navSection}>
            <span style={styles.navSectionTitle}>INTELLIGENCE</span>
            {['Signals', 'Knowledge Graph', 'GTM'].map(item => (
              <div 
                key={item} 
                style={{
                  ...styles.navItem,
                  ...(activeNav === item ? styles.navItemActive : {})
                }}
                onClick={() => setActiveNav(item)}
                className="nav-item"
              >
                {item}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
            </svg>
            <h1 style={styles.headerTitle}>Go-To-Market</h1>
          </div>
          
          <div style={styles.headerRight}>
            <div style={styles.searchBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search campaigns..." style={styles.searchInput} />
            </div>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot}></div>
              <span style={styles.liveText}>LIVE</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE AREA */}
        <div style={styles.contentArea}>
          
          {/* HERO SECTION */}
          <div style={styles.heroSection}>
            <div>
              <div style={styles.heroTitleRow}>
                <h2 style={styles.heroTitle}>GTM Strategy Board</h2>
                <div style={styles.heartbeatContainer}>
                  <div style={styles.heartbeatBar}></div>
                </div>
              </div>
              <p style={styles.heroSubtitle}>Campaign planning and execution tracking</p>
            </div>
            <div style={styles.heroActions}>
              <button style={{...styles.btn, ...styles.btnGhost}} className="btn-ghost">Strategy Playbook</button>
              <button style={{...styles.btn, ...styles.btnOutline}}>Import from n8n</button>
              <button style={{...styles.btn, ...styles.btnGold}} className="btn-gold">+ New Campaign</button>
            </div>
          </div>

          {/* KPI ROW */}
          <div style={styles.kpiRow}>
            <div style={{...styles.kpiCard, border: '1px solid var(--accent-gold)'}}>
              <span style={styles.kpiLabel}>ACTIVE CAMPAIGNS</span>
              <span style={styles.kpiValue}>3</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>TOTAL SPEND</span>
              <span style={styles.kpiValue}>€8,500</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>LEADS GENERATED</span>
              <span style={styles.kpiValue}>47</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>COST PER LEAD</span>
              <span style={styles.kpiValue}>€180</span>
            </div>
          </div>

          {/* CAMPAIGNS GRID */}
          <div style={styles.campaignGrid}>
            {campaigns.map(camp => (
              <div key={camp.id} style={styles.campaignCard} className="card-hover">
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{camp.name}</h3>
                  <span style={{
                    ...styles.statusPill,
                    ...(camp.status === 'Active' ? styles.statusActive : 
                        camp.status === 'Draft' ? styles.statusDraft : styles.statusPaused)
                  }}>
                    {camp.status}
                  </span>
                </div>
                
                <div style={styles.channelRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-tertiary)'}}>
                    {camp.icon}
                  </svg>
                  <span style={styles.channelText}>{camp.channel}</span>
                </div>

                <div style={styles.budgetSection}>
                  <div style={styles.budgetLabels}>
                    <span style={styles.budgetText}>Budget</span>
                    <span style={styles.budgetValue}>€{camp.spent.toLocaleString()} / €{camp.budget.toLocaleString()}</span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div style={{
                      ...styles.progressBarFill, 
                      width: `${camp.budget > 0 ? (camp.spent / camp.budget) * 100 : 0}%`,
                      backgroundColor: camp.status === 'Active' ? 'var(--accent-gold)' : 'var(--text-tertiary)'
                    }}></div>
                  </div>
                </div>

                <div style={styles.metricsRow}>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{camp.leads}</span>
                    <span style={styles.metricLabel}>Leads</span>
                  </div>
                  <div style={styles.metricDivider}></div>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>€{camp.cpl}</span>
                    <span style={styles.metricLabel}>CPL</span>
                  </div>
                  <div style={styles.metricDivider}></div>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{camp.ctr}%</span>
                    <span style={styles.metricLabel}>CTR</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.timelineText}>{camp.timeline}</span>
                  <button style={styles.viewBtn} className="btn-ghost">View Details</button>
                </div>
              </div>
            ))}
          </div>

          {/* TIMELINE VIEW */}
          <div style={styles.timelineCard}>
            <div style={styles.timelineHeader}>
              <h3 style={styles.timelineTitle}>Campaign Timeline</h3>
              <div style={styles.timelineLegend}>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--accent-gold)'}}></div>Active</div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: 'var(--border-default)'}}></div>Planned</div>
              </div>
            </div>
            
            <div style={styles.ganttContainer}>
              {/* X-Axis */}
              <div style={styles.ganttAxis}>
                <div style={styles.ganttLabelSpace}></div>
                <div style={styles.ganttWeeks}>
                  {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map(w => (
                    <div key={w} style={styles.ganttWeekLabel}>{w}</div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {campaigns.map((camp, idx) => (
                <div key={idx} style={styles.ganttRow}>
                  <div style={styles.ganttRowLabel}>{camp.name}</div>
                  <div style={styles.ganttTrack}>
                    {/* Grid lines */}
                    {[1,2,3,4,5,6,7].map(i => (
                      <div key={i} style={{...styles.ganttGridLine, left: `${(i/8)*100}%`}}></div>
                    ))}
                    
                    {/* Bar */}
                    <div style={{
                      ...styles.ganttBar,
                      left: `${camp.timelineStart}%`,
                      width: `${camp.timelineWidth}%`,
                      backgroundColor: camp.status === 'Active' ? 'var(--accent-gold)' : 'var(--border-default)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-canvas)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    overflow: 'hidden'
  },
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-default)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    flexShrink: 0
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
    padding: '0 8px'
  },
  logoMark: {
    width: '24px',
    height: '24px',
    backgroundColor: 'var(--text-primary)',
    borderRadius: '4px'
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.05em'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    letterSpacing: '0.1em',
    padding: '0 8px',
    marginBottom: '4px'
  },
  navItem: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  navItemActive: {
    backgroundColor: '#EBE4D8',
    color: 'var(--text-primary)',
    fontWeight: '600'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    height: '56px',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    backgroundColor: 'var(--bg-canvas)',
    flexShrink: 0
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0F0EE',
    padding: '6px 12px',
    borderRadius: '20px',
    width: '200px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    width: '100%'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#EF4444',
    borderRadius: '50%',
    animation: 'pulse-live 2s infinite'
  },
  liveText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em'
  },
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px'
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  heartbeatContainer: {
    height: '24px',
    display: 'flex',
    alignItems: 'center'
  },
  heartbeatBar: {
    height: '4px',
    backgroundColor: 'var(--accent-gold)',
    borderRadius: '2px',
    animation: 'heartbeat-gold 3s infinite ease-in-out'
  },
  heroSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  heroActions: {
    display: 'flex',
    gap: '12px'
  },
  btn: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s ease',
    border: 'none'
  },
  btnGhost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
  },
  btnGold: {
    backgroundColor: 'var(--accent-gold)',
    color: '#1A1A1A',
    fontWeight: '600'
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px'
  },
  kpiCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-default)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)'
  },
  campaignGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  campaignCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-default)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    height: '100%'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '12px',
  },
  statusActive: {
    backgroundColor: 'var(--semantic-success-bg)',
    color: 'var(--semantic-success-text)'
  },
  statusDraft: {
    backgroundColor: 'var(--semantic-draft-bg)',
    color: 'var(--semantic-draft-text)'
  },
  statusPaused: {
    backgroundColor: 'var(--semantic-warning-bg)',
    color: 'var(--semantic-warning-text)'
  },
  channelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '-8px'
  },
  channelText: {
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },
  budgetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px'
  },
  budgetLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  budgetText: {
    fontSize: '12px',
    color: 'var(--text-secondary)'
  },
  budgetValue: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  progressBarBg: {
    height: '4px',
    backgroundColor: 'var(--border-default)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease'
  },
  metricsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF8',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '4px'
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metricValue: {
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--text-tertiary)'
  },
  metricDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border-default)'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-default)'
  },
  timelineText: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  },
  viewBtn: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  timelineCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-default)',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  timelineTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  timelineLegend: {
    display: 'flex',
    gap: '16px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '2px'
  },
  ganttContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  ganttAxis: {
    display: 'flex',
    borderBottom: '1px solid var(--border-default)',
    paddingBottom: '8px',
    marginBottom: '8px'
  },
  ganttLabelSpace: {
    width: '200px',
    flexShrink: 0
  },
  ganttWeeks: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    paddingRight: '12px' // Account for bar ending
  },
  ganttWeekLabel: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)'
  },
  ganttRow: {
    display: 'flex',
    alignItems: 'center',
    height: '32px'
  },
  ganttRowLabel: {
    width: '200px',
    flexShrink: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: '16px'
  },
  ganttTrack: {
    flex: 1,
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  ganttGridLine: {
    position: 'absolute',
    top: '-16px',
    bottom: '-16px',
    width: '1px',
    backgroundColor: 'var(--border-default)',
    opacity: 0.5,
    zIndex: 0
  },
  ganttBar: {
    position: 'absolute',
    height: '16px',
    borderRadius: '4px',
    zIndex: 1,
    transition: 'all 0.3s ease'
  }
};

export default GtmGenerated;