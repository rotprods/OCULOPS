import React, { useState, useMemo } from 'react';

const BillingGenerated = () => {
  const [activeNav] = useState('Billing');

  const navItems = [
    { name: 'Flight Deck', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'Knowledge', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { name: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  const billingHistory = useMemo(() => [
    { id: 'INV-2026-03', date: 'Mar 01, 2026', desc: 'Operator Pro - Monthly', amount: '€0.00', status: 'Paid' },
    { id: 'INV-2026-02', date: 'Feb 01, 2026', desc: 'Operator Pro - Monthly', amount: '€0.00', status: 'Paid' },
    { id: 'INV-2026-01', date: 'Jan 01, 2026', desc: 'Operator Pro - Monthly', amount: '€0.00', status: 'Paid' },
  ], []);

  const features = [
    '7 AI Agents',
    'Unlimited Contacts',
    'n8n Integration',
    'Real-time Intelligence'
  ];

  return (
    <>
      <style>{`
        :root {
          --color-canvas: #FAFAF8;
          --color-sidebar: #F5F0E8;
          --color-card: #FFFFFF;
          --color-text-primary: #1A1A1A;
          --color-text-secondary: #6B6B6B;
          --color-text-tertiary: #9CA3AF;
          --color-accent-gold: #FFD700;
          --color-accent-gold-muted: rgba(255,215,0,0.10);
          --color-accent-gold-border: rgba(255,215,0,0.30);
          --color-border: #E5E5E0;
          --color-success-bg: #E6F5EC;
          --color-success-text: #008F39;
          --color-warning-bg: #FFFCE6;
          --color-warning-text: #A68900;
          --color-error-bg: #FEF2F2;
          --color-error-text: #B91C1C;
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: var(--color-canvas);
          font-family: var(--font-sans);
          color: var(--color-text-primary);
          -webkit-font-smoothing: antialiased;
        }

        @keyframes breathe {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes pulse-live {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-ghost:hover {
          background: var(--color-canvas);
          border-color: #D1D1D1;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-paid {
          background: var(--color-success-bg);
          color: var(--color-success-text);
        }
        .status-pending {
          background: var(--color-warning-bg);
          color: var(--color-warning-text);
        }
        .status-failed {
          background: var(--color-error-bg);
          color: var(--color-error-text);
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #D1D1D1;
          border-radius: 3px;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <aside style={{ 
          width: '240px', 
          backgroundColor: 'var(--color-sidebar)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            letterSpacing: '0.1em', 
            textTransform: 'uppercase',
            marginBottom: '40px',
            paddingLeft: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '16px', height: '16px', background: 'var(--color-text-primary)', borderRadius: '2px' }}></div>
            Operator
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {navItems.map((item) => (
              <div 
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeNav === item.name ? 'rgba(0,0,0,0.04)' : 'transparent',
                  color: activeNav === item.name ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeNav === item.name ? 600 : 400,
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d={item.icon}></path>
                </svg>
                {item.name}
              </div>
            ))}
          </nav>

          <div style={{ 
            marginTop: 'auto', 
            padding: '16px 12px', 
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E5E0' }}></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Admin User</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Pro Workspace</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            backgroundColor: 'var(--color-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Billing</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  style={{
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '6px 12px 6px 32px',
                    fontSize: '13px',
                    width: '200px',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success-text)', animation: 'pulse-live 2s infinite' }}></div>
                LIVE
              </div>
            </div>
          </header>

          {/* SCROLLABLE AREA */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* PLAN CARD */}
            <div className="card" style={{ border: '1px solid var(--color-accent-gold-border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--color-accent-gold)' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Current Plan: Operator Pro</h2>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--color-accent-gold)',
                      animation: 'breathe 2s infinite'
                    }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>€0</span>
                    <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>/month</span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '8px', padding: '2px 8px', background: 'var(--color-canvas)', borderRadius: '4px' }}>Free during beta</span>
                  </div>

                  <div style={{ display: 'flex', gap: '24px' }}>
                    {features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className="btn-ghost">Upgrade Plan</button>
              </div>
            </div>

            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div className="card" style={{ borderTop: '2px solid var(--color-accent-gold)', paddingTop: '22px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Current Bill</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€0.00</div>
              </div>
              <div className="card">
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total Spent</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>€0.00</div>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success-text)' }}></div>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>FREE TIER active</span>
                </div>
              </div>
            </div>

            {/* 2-COLUMN GRID: PAYMENT & USAGE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* PAYMENT METHOD */}
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Payment Method</h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '24px', 
                      background: '#1434CB', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontStyle: 'italic'
                    }}>VISA</div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                      Visa ending in <span style={{ fontFamily: 'var(--font-mono)' }}>4242</span>
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>Update</button>
                </div>
                
                <button style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'transparent', 
                  border: '1px dashed var(--color-border)', 
                  borderRadius: '8px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}>+ Add Payment Method</button>
              </div>

              {/* USAGE METERS */}
              <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Current Usage</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>API Calls</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>12,450 / 100,000</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-canvas)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '12.45%', height: '100%', background: 'var(--color-accent-gold)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Storage</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>2.1 GB / 10 GB</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-canvas)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '21%', height: '100%', background: 'var(--color-accent-gold)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BILLING HISTORY TABLE */}
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Billing History</h3>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((row) => (
                    <tr key={row.id} style={{ transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-canvas)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}>{row.date}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-primary)' }}>{row.desc}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{row.amount}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                        <span className={`status-pill status-${row.status.toLowerCase()}`}>{row.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="Download PDF">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default BillingGenerated;