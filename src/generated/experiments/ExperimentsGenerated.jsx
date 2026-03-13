import React, { useState, useMemo } from 'react';

const ExperimentsGenerated = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const kpis = [
    { label: 'Running', value: '3', active: true },
    { label: 'Completed', value: '12', active: false },
    { label: 'Win Rate', value: '67%', active: false },
    { label: 'Value Generated', value: '€2,400', active: false },
  ];

  const experiments = [
    {
      id: 'exp-001',
      name: 'Checkout Flow Optimization',
      status: 'Running',
      hypothesis: 'If we remove address line 2, then conversion rate will improve by 5%',
      variants: [
        { label: 'Variant A', rate: '3.2%', sample: '1,200', isWinner: false, barWidth: '45%' },
        { label: 'Variant B', rate: '3.8%', sample: '1,150', isWinner: false, barWidth: '55%' },
      ],
      pValue: 'p = 0.08',
      isSignificant: false,
    },
    {
      id: 'exp-002',
      name: 'Pricing Page Tier Highlight',
      status: 'Completed',
      hypothesis: 'If we highlight the Pro tier in gold, then MRR will increase',
      variants: [
        { label: 'Variant A', rate: '1.5%', sample: '5,000', isWinner: false, barWidth: '30%' },
        { label: 'Variant B', rate: '2.1%', sample: '5,100', isWinner: true, barWidth: '70%' },
      ],
      pValue: 'p < 0.01',
      isSignificant: true,
    },
    {
      id: 'exp-003',
      name: 'Hero Image vs Video Background',
      status: 'Completed',
      hypothesis: 'If we use a video background, then engagement time will rise',
      variants: [
        { label: 'Variant A', rate: '45s', sample: '3,000', isWinner: true, barWidth: '52%' },
        { label: 'Variant B', rate: '42s', sample: '2,950', isWinner: false, barWidth: '48%' },
      ],
      pValue: 'Not significant',
      isSignificant: false,
    },
  ];

  return (
    <div style={styles.container}>
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
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-text: #B29600;
          --border-default: #E5E5E0;
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #15803D;
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.6); }
          70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-4px) scale(1.1); opacity: 0.3; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .btn-hover:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-ghost-hover:hover {
          background-color: rgba(0,0,0,0.02);
        }
        .nav-item-hover:hover {
          background-color: rgba(0,0,0,0.04);
        }
      `}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoMark}></div>
          <span style={styles.logoText}>Nexus OS</span>
        </div>
        <nav style={styles.nav}>
          {['Overview', 'Models', 'Data', 'Experiments', 'Settings'].map((item) => (
            <div
              key={item}
              className="nav-item-hover"
              style={{
                ...styles.navItem,
                ...(item === 'Experiments' ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>
                {item === 'Experiments' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H15M10 9H14M3 19.5L10 8.5V3M21 19.5L14 8.5V3M3 19.5C3 20.8807 4.11929 22 5.5 22H18.5C19.8807 22 21 20.8807 21 19.5C21 18.1193 19.8807 17 18.5 17H5.5C4.11929 17 3 18.1193 3 19.5Z"/></svg>
                ) : (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid currentColor', opacity: 0.5 }} />
                )}
              </span>
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H15M10 9H14M3 19.5L10 8.5V3M21 19.5L14 8.5V3M3 19.5C3 20.8807 4.11929 22 5.5 22H18.5C19.8807 22 21 20.8807 21 19.5C21 18.1193 19.8807 17 18.5 17H5.5C4.11929 17 3 18.1193 3 19.5Z"/></svg>
            <h1 style={styles.headerTitle}>Experiments</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.searchContainer}>
              <svg style={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input 
                type="text" 
                placeholder="Search experiments..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={styles.liveIndicator}>
              <div style={styles.liveDot}></div>
              LIVE
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Area */}
        <div className="hide-scrollbar" style={styles.dashboardContent}>
          
          {/* Hero Section */}
          <section style={styles.heroSection}>
            <div style={{ position: 'relative' }}>
              <h2 style={styles.heroTitle}>Experiment Lab</h2>
              <p style={styles.heroSubtitle}>A/B testing and hypothesis validation</p>
              
              {/* Decorative Particles */}
              <div style={{...styles.particle, top: '-10px', left: '180px', animationDelay: '0s'}}></div>
              <div style={{...styles.particle, top: '15px', left: '210px', width: '3px', height: '3px', animationDelay: '1s'}}></div>
              <div style={{...styles.particle, top: '40px', left: '160px', width: '5px', height: '5px', animationDelay: '2s'}}></div>
            </div>
            
            <div style={styles.heroActions}>
              <button className="btn-ghost-hover" style={styles.btnGhost}>Archive</button>
              <button className="btn-hover" style={styles.btnPrimary}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Experiment
              </button>
            </div>
          </section>

          {/* KPI Row */}
          <section style={styles.kpiGrid}>
            {kpis.map((kpi, idx) => (
              <div key={idx} style={{...styles.kpiCard, ...(kpi.active ? styles.kpiCardActive : {})}}>
                <div style={styles.kpiLabel}>{kpi.label}</div>
                <div style={styles.kpiValue}>{kpi.value}</div>
              </div>
            ))}
          </section>

          {/* Experiment List */}
          <section style={styles.experimentList}>
            {experiments.map((exp) => (
              <div key={exp.id} style={styles.experimentCard}>
                
                {/* Left Section (70%) */}
                <div style={styles.expLeft}>
                  <div style={styles.expHeader}>
                    <h3 style={styles.expName}>{exp.name}</h3>
                    <div style={{
                      ...styles.statusPill,
                      ...(exp.status === 'Running' ? styles.statusRunning : styles.statusCompleted)
                    }}>
                      {exp.status === 'Running' && <div style={styles.runningDot}></div>}
                      {exp.status}
                    </div>
                  </div>
                  
                  <p style={styles.expHypothesis}>
                    <span style={{fontStyle: 'normal', color: 'var(--text-tertiary)', marginRight: 4}}>Hypothesis:</span>
                    "{exp.hypothesis}"
                  </p>

                  <div style={styles.variantsContainer}>
                    {exp.variants.map((variant, vIdx) => (
                      <div key={vIdx} style={styles.variantBlock}>
                        <div style={styles.variantHeader}>
                          <span style={styles.variantLabel}>{variant.label}</span>
                          {variant.isWinner && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-gold)" stroke="var(--accent-gold)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 6}}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          )}
                        </div>
                        <div style={styles.variantMetrics}>
                          <span style={styles.variantRate}>{variant.rate}</span>
                          <span style={styles.variantSample}>n={variant.sample}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Section (30%) */}
                <div style={styles.expRight}>
                  <div style={styles.chartContainer}>
                    {exp.variants.map((variant, vIdx) => (
                      <div key={vIdx} style={styles.chartRow}>
                        <span style={styles.chartLabel}>{variant.label.split(' ')[1]}</span>
                        <div style={styles.barTrack}>
                          <div style={{
                            ...styles.barFill,
                            width: variant.barWidth,
                            backgroundColor: variant.isWinner ? 'var(--accent-gold)' : '#D4D4CF'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    ...styles.significance,
                    color: exp.isSignificant ? 'var(--semantic-success-text)' : 'var(--text-tertiary)'
                  }}>
                    {exp.pValue}
                  </div>
                </div>

              </div>
            ))}
          </section>

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
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-default)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoContainer: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid var(--border-default)',
  },
  logoMark: {
    width: '16px',
    height: '16px',
    backgroundColor: 'var(--text-primary)',
    borderRadius: '4px',
    marginRight: '12px',
  },
  logoText: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  nav: {
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  navItemActive: {
    backgroundColor: '#EBE4D8',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  navIcon: {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    height: '56px',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    backgroundColor: 'var(--bg-canvas)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: 'var(--text-tertiary)',
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    borderRadius: '6px',
    padding: '6px 12px 6px 32px',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    width: '200px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    color: 'var(--semantic-success-text)',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--semantic-success)',
    borderRadius: '50%',
    animation: 'pulse-green 2s infinite',
  },
  dashboardContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    backgroundColor: 'var(--accent-gold)',
    borderRadius: '50%',
    animation: 'float-particle 4s ease-in-out infinite',
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-sans)',
  },
  btnPrimary: {
    backgroundColor: 'var(--accent-gold)',
    border: 'none',
    color: '#1A1A1A',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 2px 4px rgba(255,215,0,0.2)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  kpiCardActive: {
    borderColor: 'var(--accent-gold)',
    boxShadow: '0 2px 12px rgba(255,215,0,0.08)',
  },
  kpiLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  experimentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  experimentCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  expLeft: {
    flex: '0 0 70%',
    paddingRight: '32px',
  },
  expHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  expName: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: '500',
  },
  statusRunning: {
    backgroundColor: 'var(--accent-gold-muted)',
    color: 'var(--accent-gold-text)',
  },
  statusCompleted: {
    backgroundColor: 'var(--semantic-success-bg)',
    color: 'var(--semantic-success-text)',
  },
  runningDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--accent-gold)',
    borderRadius: '50%',
    animation: 'pulse-gold 2s infinite',
  },
  expHypothesis: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  variantsContainer: {
    display: 'flex',
    gap: '48px',
  },
  variantBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  variantHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  variantLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  variantMetrics: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  variantRate: {
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
  },
  variantSample: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
  },
  expRight: {
    flex: '0 0 30%',
    borderLeft: '1px solid var(--border-default)',
    paddingLeft: '32px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '16px',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  chartRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chartLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    width: '12px',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: '6px',
    backgroundColor: '#F0F0EE',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease-in-out',
  },
  significance: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '500',
  },
};

export default ExperimentsGenerated;