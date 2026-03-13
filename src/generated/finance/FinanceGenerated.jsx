import React, { useState, useMemo } from 'react';

const FinanceGenerated = () => {
  const [activePeriod, setActivePeriod] = useState('30D');

  const transactions = [
    { id: 1, date: 'Oct 24, 2023', desc: 'Stripe Payout', cat: 'Revenue', amount: 12450.00, type: 'income', status: 'Completed' },
    { id: 2, date: 'Oct 23, 2023', desc: 'AWS Web Services', cat: 'Infrastructure', amount: -840.50, type: 'expense', status: 'Completed' },
    { id: 3, date: 'Oct 21, 2023', desc: 'Enterprise License - Acme Corp', cat: 'Revenue', amount: 45000.00, type: 'income', status: 'Pending' },
    { id: 4, date: 'Oct 20, 2023', desc: 'Google Workspace', cat: 'Software', amount: -120.00, type: 'expense', status: 'Completed' },
    { id: 5, date: 'Oct 18, 2023', desc: 'Q3 Legal Retainer', cat: 'Legal', amount: -2500.00, type: 'expense', status: 'Completed' },
    { id: 6, date: 'Oct 15, 2023', desc: 'Annual Subscription - Globex', cat: 'Revenue', amount: 8900.00, type: 'income', status: 'Completed' },
  ];

  const expenses = [
    { cat: 'Infrastructure', amount: 4200, pct: 45, color: '#1A1A1A' },
    { cat: 'Software', amount: 2100, pct: 22, color: '#6B6B6B' },
    { cat: 'Legal & Admin', amount: 1800, pct: 19, color: '#9A9A9A' },
    { cat: 'Marketing', amount: 1300, pct: 14, color: '#E5E5E0' },
  ];

  const maxTxAmount = Math.max(...transactions.map(t => Math.abs(t.amount)));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9A9A9A;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.08);
          --border-default: #E5E5E0;
          --semantic-success: #34C759;
          --semantic-error: #E53E3E;
          --semantic-warning: #FF9F43;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          --shadow-inner: inset 0 1px 0 rgba(255,255,255,0.8);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background-color: var(--bg-canvas);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          box-shadow: var(--shadow-card), var(--shadow-inner);
          padding: 20px;
          position: relative;
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }

        .value-large {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          line-height: 1.2;
        }

        @keyframes breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(255,215,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background-color: var(--semantic-error);
          border-radius: 50%;
          animation: breathe 3s ease-in-out infinite;
        }

        .gold-orb {
          width: 24px;
          height: 24px;
          background: radial-gradient(circle at 30% 30%, #FFF4B3, var(--accent-gold));
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(255,215,0,0.25);
          animation: pulse-gold 4s infinite;
        }

        .nav-item {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-item:hover { background: rgba(0,0,0,0.04); }
        .nav-item.active {
          background: #EBE4D8;
          color: var(--text-primary);
          font-weight: 600;
        }

        .pill {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .pill.active {
          background: var(--accent-gold);
          color: var(--text-primary);
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 2fr 1.5fr 1.5fr 1fr;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-default);
          align-items: center;
          font-size: 13px;
        }
        .table-row:last-child { border-bottom: none; }
        
        .table-header {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 12px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          background: #F5F5F5;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }

        .mono { font-family: var(--font-mono); }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 3px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{ 
          width: '240px', 
          background: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-default)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'col',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--accent-gold)', borderRadius: '4px' }}></div>
              <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.1em' }}>OCULOPS</span>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="label" style={{ padding: '0 12px', marginBottom: '8px' }}>Command</div>
              <div className="nav-item">Overview</div>
              <div className="nav-item">Intelligence</div>
              <div className="nav-item active">Finance</div>
              <div className="nav-item">Operations</div>
              
              <div className="label" style={{ padding: '0 12px', marginTop: '24px', marginBottom: '8px' }}>System</div>
              <div className="nav-item">Settings</div>
              <div className="nav-item">Access Control</div>
            </nav>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: 'var(--bg-canvas)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-6 6" />
              </svg>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>Finance</span>
            </div>

            <div style={{ 
              width: '320px', 
              height: '32px', 
              background: '#F0F0EE', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              color: 'var(--text-tertiary)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span style={{ fontSize: '13px', marginLeft: '8px' }}>Search transactions...</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="live-dot"></div>
              <span className="label" style={{ color: 'var(--semantic-error)' }}>LIVE</span>
            </div>
          </header>

          {/* SCROLLABLE CONTENT */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO CARD */}
            <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Financial Intelligence</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Revenue tracking and expense analysis</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="label">MRR</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="value-large">E0</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Target: E20k</span>
                </div>
                <div className="gold-orb"></div>
              </div>
            </div>

            {/* CHART & PANEL ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
              
              {/* REVENUE CHART */}
              <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Monthly Revenue</h2>
                  <div style={{ display: 'flex', gap: '4px', background: '#F5F5F5', padding: '4px', borderRadius: '16px' }}>
                    {['7D', '30D', '90D', '1Y'].map(p => (
                      <div 
                        key={p} 
                        className={`pill ${activePeriod === p ? 'active' : ''}`}
                        onClick={() => setActivePeriod(p)}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  {/* Y-Axis Labels */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>E50k</span>
                    <span>E25k</span>
                    <span>E0</span>
                  </div>
                  
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', left: '40px', right: 0, top: '6px', bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ borderTop: '1px solid #F0F0EB', width: '100%' }}></div>
                    <div style={{ borderTop: '1px solid #F0F0EB', width: '100%' }}></div>
                    <div style={{ borderTop: '1px solid #F0F0EB', width: '100%' }}></div>
                  </div>

                  {/* SVG Chart */}
                  <div style={{ position: 'absolute', left: '40px', right: 0, top: 0, bottom: '20px' }}>
                    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 200">
                      <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,215,0,0.15)" />
                          <stop offset="100%" stopColor="rgba(255,215,0,0.0)" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area */}
                      <path 
                        d="M 0 180 L 100 150 L 250 160 L 400 90 L 550 110 L 700 40 L 850 60 L 1000 20 L 1000 200 L 0 200 Z" 
                        fill="url(#areaFill)" 
                      />
                      
                      {/* Line */}
                      <path 
                        d="M 0 180 L 100 150 L 250 160 L 400 90 L 550 110 L 700 40 L 850 60 L 1000 20" 
                        fill="none" 
                        stroke="var(--accent-gold)" 
                        strokeWidth="2"
                        filter="url(#glow)"
                      />

                      {/* Data Points (Local Maxima) */}
                      <circle cx="400" cy="90" r="3" fill="var(--accent-gold)" />
                      <circle cx="700" cy="40" r="3" fill="var(--accent-gold)" />
                      <circle cx="1000" cy="20" r="3" fill="var(--accent-gold)" />
                    </svg>
                  </div>

                  {/* X-Axis Labels */}
                  <div style={{ position: 'absolute', left: '40px', right: 0, bottom: '-4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                  </div>
                </div>
              </div>

              {/* EXPENSE BREAKDOWN */}
              <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>Expense Breakdown</h2>
                
                {/* Stacked Bar */}
                <div style={{ height: '12px', width: '100%', display: 'flex', borderRadius: '6px', overflow: 'hidden', marginBottom: '32px' }}>
                  {expenses.map((exp, i) => (
                    <div key={i} style={{ width: `${exp.pct}%`, background: exp.color, height: '100%' }}></div>
                  ))}
                </div>

                {/* Legend List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                  {expenses.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: exp.color }}></div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{exp.cat}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="mono" style={{ fontSize: '13px', fontWeight: '500' }}>E{exp.amount.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '24px', textAlign: 'right' }}>{exp.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { label: 'MRR', value: 'E0', target: 'Target: E20k', border: 'var(--accent-gold)' },
                { label: 'Pipeline', value: 'E242,600', target: '+12% vs last month' },
                { label: 'Active Deals', value: '6', target: '2 closing this week' },
                { label: 'Expenses', value: 'E0', target: 'Under budget' }
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: '16px', borderColor: kpi.border || 'var(--border-default)' }}>
                  <div className="label" style={{ marginBottom: '12px' }}>{kpi.label}</div>
                  <div className="value-large" style={{ marginBottom: '8px' }}>{kpi.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{kpi.target}</div>
                </div>
              ))}
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Recent Transactions</h2>
              
              <div style={{ width: '100%' }}>
                <div className="table-row table-header">
                  <div>Date</div>
                  <div>Description</div>
                  <div>Category</div>
                  <div>Amount</div>
                  <div>Status</div>
                </div>
                
                {transactions.map(tx => (
                  <div key={tx.id} className="table-row">
                    <div style={{ color: 'var(--text-secondary)' }}>{tx.date}</div>
                    <div style={{ fontWeight: '500' }}>{tx.desc}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{tx.cat}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="mono" style={{ 
                        color: tx.type === 'income' ? 'var(--semantic-success)' : 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {tx.type === 'income' ? '+' : '-'}E{Math.abs(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                      {/* Gold Signal Bar */}
                      <div style={{ width: '40px', height: '4px', background: '#F0F0EE', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${(Math.abs(tx.amount) / maxTxAmount) * 100}%`, 
                          height: '100%', 
                          background: 'var(--accent-gold)' 
                        }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="status-pill">
                        <div className="status-dot" style={{ 
                          background: tx.status === 'Completed' ? 'var(--semantic-success)' : 'var(--semantic-warning)' 
                        }}></div>
                        <span style={{ color: 'var(--text-secondary)' }}>{tx.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default FinanceGenerated;