import React, { useState, useMemo } from 'react';

const STAGES = [
  { id: 'inbound', label: 'Inbound', color: '#9CA3AF' },
  { id: 'discovery', label: 'Discovery', color: '#3B82F6' },
  { id: 'proposal', label: 'Proposal', color: '#D4AF37' },
  { id: 'negotiation', label: 'Negotiation', color: '#F0C800' },
  { id: 'closed_won', label: 'Closed Won', color: '#10B981' }
];

const MOCK_DEALS = [
  { id: 'd1', title: 'Enterprise Platform License', company: 'Acme Corp', value: 125000, stage: 'proposal', probability: 60, date: 'Oct 24', tags: ['Enterprise', 'Expansion'], avatar: 'JD' },
  { id: 'd2', title: 'Q4 Cloud Migration', company: 'TechFlow Inc', value: 85000, stage: 'negotiation', probability: 85, date: 'Oct 28', tags: ['Cloud', 'New Logo'], avatar: 'AS' },
  { id: 'd3', title: 'Security Audit & Implementation', company: 'Global Bank', value: 250000, stage: 'discovery', probability: 30, date: 'Nov 02', tags: ['Security'], avatar: 'MR' },
  { id: 'd4', title: 'API Integration Pilot', company: 'StartupX', value: 15000, stage: 'inbound', probability: 10, date: 'Nov 15', tags: ['API'], avatar: 'JD' },
  { id: 'd5', title: 'Annual Renewal + Upsell', company: 'DataCorp', value: 180000, stage: 'closed_won', probability: 100, date: 'Oct 10', tags: ['Renewal'], avatar: 'AS' },
  { id: 'd6', title: 'Managed Services Contract', company: 'HealthPlus', value: 95000, stage: 'proposal', probability: 50, date: 'Nov 05', tags: ['Services'], avatar: 'MR' },
  { id: 'd7', title: 'Data Warehouse Setup', company: 'RetailGiant', value: 110000, stage: 'discovery', probability: 40, date: 'Nov 12', tags: ['Data'], avatar: 'JD' },
  { id: 'd8', title: 'Custom Analytics Dashboard', company: 'MediaGroup', value: 45000, stage: 'negotiation', probability: 90, date: 'Oct 30', tags: ['Analytics'], avatar: 'AS' }
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const PipelineGenerated = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('board');

  const filteredDeals = useMemo(() => {
    return MOCK_DEALS.filter(deal => 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const metrics = useMemo(() => {
    const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
    const activeDeals = filteredDeals.filter(d => d.stage !== 'closed_won').length;
    const wonValue = filteredDeals.filter(d => d.stage === 'closed_won').reduce((sum, deal) => sum + deal.value, 0);
    const winRate = totalValue > 0 ? Math.round((wonValue / totalValue) * 100) : 0;

    return { totalValue, activeDeals, winRate };
  }, [filteredDeals]);

  return (
    <div style={{
      backgroundColor: 'var(--bg-canvas)',
      minHeight: '100vh',
      fontFamily: 'var(--font-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-card: #FFFFFF;
          --bg-hover: #FDFDFD;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-muted: #99948D;
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --font-primary: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-sm: 0 2px 8px rgba(0,0,0,0.03);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
          --shadow-gold: 0 0 15px rgba(255,215,0,0.15);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .pipeline-header {
          padding: 32px 40px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-canvas);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .btn-primary {
          background: var(--accent-gold);
          color: #000;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover {
          background: var(--accent-gold-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-gold);
        }

        .search-input {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          padding: 10px 16px;
          border-radius: 6px;
          font-family: var(--font-primary);
          font-size: 13px;
          width: 280px;
          transition: all 0.2s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 3px var(--accent-gold-muted);
        }

        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 20px 24px;
          flex: 1;
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }

        .metric-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: var(--border-default);
          transition: background 0.3s ease;
        }

        .metric-card:hover::after {
          background: var(--accent-gold);
        }

        .board-container {
          display: flex;
          gap: 24px;
          padding: 32px 40px;
          overflow-x: auto;
          flex: 1;
          align-items: flex-start;
        }

        .board-column {
          min-width: 320px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .deal-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 20px;
          cursor: grab;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .deal-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: rgba(255,215,0,0.40);
        }

        .deal-card:active {
          cursor: grabbing;
          transform: scale(0.98);
        }

        .tag {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px;
          border-radius: 4px;
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-canvas);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .progress-track {
          height: 4px;
          background: var(--border-subtle);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s infinite;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-canvas);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>

      {/* Header Section */}
      <header className="pipeline-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>Sales Pipeline</h1>
              <span className="live-indicator" title="Live Sync Active"></span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage and track enterprise deals across all stages.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search deals, companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '2px' }}>
              <button 
                onClick={() => setActiveView('board')}
                style={{ 
                  padding: '6px 12px', 
                  border: 'none', 
                  background: activeView === 'board' ? 'var(--bg-canvas)' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeView === 'board' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>Board</button>
              <button 
                onClick={() => setActiveView('list')}
                style={{ 
                  padding: '6px 12px', 
                  border: 'none', 
                  background: activeView === 'list' ? 'var(--bg-canvas)' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeView === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}>List</button>
            </div>
            <button className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Deal
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <div className="metric-card">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Pipeline Value</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em' }}>
              {formatCurrency(metrics.totalValue)}
            </div>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Deals</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em' }}>
              {metrics.activeDeals}
            </div>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px' }}>Win Rate (YTD)</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em' }}>
                {metrics.winRate}%
              </div>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>+2.4%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Board Area */}
      <main className="board-container">
        {STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={stage.id} className="board-column">
              {/* Column Header */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                paddingBottom: '16px',
                borderBottom: `2px solid ${stage.color}20` // 20 is hex for 12% opacity
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }}></div>
                    <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {stage.label}
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', background: 'var(--border-subtle)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {stageDeals.length}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {formatCurrency(stageValue)}
                </div>
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '200px' }}>
                {stageDeals.map(deal => (
                  <div key={deal.id} className="deal-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>{deal.company}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{deal.title}</div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="12" cy="5" r="1"></circle>
                          <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                      </button>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      {formatCurrency(deal.value)}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {deal.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar">{deal.avatar}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{deal.date}</span>
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {deal.probability}%
                      </div>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${deal.probability}%`,
                          backgroundColor: deal.probability >= 80 ? '#10B981' : deal.probability >= 40 ? '#F0C800' : '#9CA3AF'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {stageDeals.length === 0 && (
                  <div style={{ 
                    border: '1px dashed var(--border-default)', 
                    borderRadius: '8px', 
                    padding: '32px 20px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default PipelineGenerated;