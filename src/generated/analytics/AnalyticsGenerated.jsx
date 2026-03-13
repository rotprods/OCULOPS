import React, { useState, useMemo } from 'react';

const AnalyticsGenerated = () => {
  const [activeTab, setActiveTab] = useState('All');

  const kpiData = [
    { label: 'TOTAL VISITS', value: '1,245', isPrimary: true },
    { label: 'CONVERSION RATE', value: '3.2%', isPrimary: false },
    { label: 'CAC', value: '€4,200', isPrimary: false },
    { label: 'LTV', value: '€12,800', isPrimary: false },
  ];

  const topChannels = [
    { name: 'Organic Search', value: 72 },
    { name: 'LinkedIn', value: 18 },
    { name: 'Direct', value: 10 },
  ];

  const funnelData = [
    { stage: 'Visit', value: 100 },
    { stage: 'Lead', value: 45 },
    { stage: 'Qualified', value: 15 },
    { stage: 'Deal', value: 4 },
  ];

  const campaignData = [
    { name: 'Q3 Enterprise Alpha', channel: 'LinkedIn', spend: '€12,500', leads: 142, cpa: '€88', roi: '+124%', signal: 4 },
    { name: 'Brand Awareness EU', channel: 'Organic', spend: '€4,200', leads: 89, cpa: '€47', roi: '+210%', signal: 3 },
    { name: 'Retargeting Sequence', channel: 'Paid Search', spend: '€8,900', leads: 64, cpa: '€139', roi: '-12%', signal: 2 },
    { name: 'Partner Webinar', channel: 'Referral', spend: '€1,500', leads: 210, cpa: '€7', roi: '+450%', signal: 5 },
    { name: 'Cold Outbound V2', channel: 'Email', spend: '€3,000', leads: 12, cpa: '€250', roi: '-45%', signal: 1 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --color-canvas: #FAFAF8;
          --color-sidebar: #F5F0E8;
          --color-card: #FFFFFF;
          --color-text-primary: #1A1A1A;
          --color-text-secondary: #6B6B6B;
          --color-text-tertiary: #9A9A9A;
          --color-accent-gold: #FFD700;
          --color-border: #E5E5E0;
          --color-success: #10B981;
          --color-error: #EF4444;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8);
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

        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes heartbeat {
          0% { opacity: 0.2; width: 10px; }
          50% { opacity: 1; width: 60px; }
          100% { opacity: 0.2; width: 10px; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-canvas)' }}>
        
        {/* SIDEBAR */}
        <aside style={{ 
          width: '240px', 
          backgroundColor: 'var(--color-sidebar)', 
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--color-text-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-accent-gold)', borderRadius: '50%' }}></div>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>OS.CORE</span>
          </div>

          <nav style={{ padding: '0 12px', marginTop: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '12px' }}>ANALYTICS</div>
            
            <div style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              backgroundColor: 'rgba(0,0,0,0.04)', 
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '16px', backgroundColor: 'var(--color-accent-gold)', borderRadius: '0 2px 2px 0' }}></div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Analytics
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '6px', color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Reports
            </div>
          </nav>
        </aside>

        {/* MAIN AREA */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            borderBottom: '1px solid var(--color-border)', 
            backgroundColor: 'var(--color-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Analytics</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span style={{ fontSize: '13px' }}>Search...</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '20px' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)', borderRadius: '50%', animation: 'blink 2s infinite' }}></div>
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>LIVE</span>
              </div>
            </div>
          </header>

          {/* SCROLLABLE CONTENT */}
          <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO CARD */}
            <section style={{ 
              backgroundColor: 'var(--color-card)', 
              borderRadius: '12px', 
              padding: '24px', 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>Performance Analytics</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Channel performance and conversion analysis</p>
              
              <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  height: '4px', 
                  background: 'linear-gradient(90deg, transparent, var(--color-accent-gold))', 
                  borderRadius: '2px',
                  animation: 'heartbeat 3s ease-in-out infinite'
                }}></div>
              </div>
            </section>

            {/* KPI ROW */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {kpiData.map((kpi, i) => (
                <div key={i} style={{ 
                  backgroundColor: 'var(--color-card)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  border: kpi.isPrimary ? '1px solid var(--color-accent-gold)' : '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative'
                }}>
                  {kpi.isPrimary && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', backgroundColor: 'var(--color-accent-gold)', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}></div>}
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', marginBottom: '8px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{kpi.value}</div>
                </div>
              ))}
            </section>

            {/* CHART & SIDE PANEL */}
            <section style={{ display: 'flex', gap: '24px' }}>
              
              {/* MAIN CHART */}
              <div style={{ 
                flex: '7', 
                backgroundColor: 'var(--color-card)', 
                borderRadius: '12px', 
                padding: '24px', 
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Channel Performance</h3>
                  <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-canvas)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {['All', 'Organic', 'Paid', 'Referral'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: activeTab === tab ? 600 : 500,
                          color: activeTab === tab ? '#000' : 'var(--color-text-secondary)',
                          backgroundColor: activeTab === tab ? 'var(--color-accent-gold)' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', minHeight: '260px' }}>
                  {/* Y-Axis Labels */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    <span>10k</span><span>7.5k</span><span>5k</span><span>2.5k</span><span>0</span>
                  </div>
                  
                  {/* Chart Area */}
                  <div style={{ position: 'absolute', left: '30px', right: 0, top: '6px', bottom: '20px' }}>
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map(pos => (
                      <div key={pos} style={{ position: 'absolute', top: `${pos}%`, left: 0, right: 0, borderTop: '1px dashed #F0F0EE' }}></div>
                    ))}

                    {/* SVG Lines */}
                    <svg width="100%" height="100%" viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                      <defs>
                        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      
                      {/* Secondary Line 1 */}
                      <path d="M 0 200 L 100 180 L 200 190 L 300 150 L 400 160 L 500 130 L 600 140 L 700 110 L 800 120 L 900 90 L 1000 100" fill="none" stroke="#E5E5E0" strokeWidth="2" />
                      
                      {/* Secondary Line 2 */}
                      <path d="M 0 150 L 100 160 L 200 130 L 300 140 L 400 110 L 500 120 L 600 90 L 700 100 L 800 70 L 900 80 L 1000 50" fill="none" stroke="#D4D4CF" strokeWidth="2" />
                      
                      {/* Primary Gold Line */}
                      <path d="M 0 220 L 100 190 L 200 210 L 300 140 L 400 150 L 500 80 L 600 100 L 700 40 L 800 60 L 900 20 L 1000 30" fill="none" stroke="var(--color-accent-gold)" strokeWidth="3" filter="url(#gold-glow)" />
                      
                      {/* Live Dot */}
                      <circle cx="1000" cy="30" r="4" fill="var(--color-accent-gold)" style={{ animation: 'pulse-gold 2s infinite' }} />
                    </svg>
                  </div>

                  {/* X-Axis Labels */}
                  <div style={{ position: 'absolute', left: '30px', right: 0, bottom: '-20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                    <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span><span>W8</span><span>W9</span><span>W10</span><span>W11</span>
                  </div>
                </div>
              </div>

              {/* SIDE PANEL */}
              <div style={{ flex: '3', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Top Channels */}
                <div style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Top Channels</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {topChannels.map((channel, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{i + 1}. {channel.name}</span>
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{channel.value}%</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: '#F0F0EE', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${channel.value}%`, 
                            backgroundColor: i === 0 ? 'var(--color-accent-gold)' : '#D4D4CF',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Conversion Funnel</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    {funnelData.map((stage, i) => (
                      <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                          width: `${Math.max(stage.value, 15)}%`, 
                          height: '24px', 
                          backgroundColor: 'var(--color-accent-gold)', 
                          opacity: 1 - (i * 0.2),
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: i > 1 ? 'var(--color-text-primary)' : '#000',
                          transition: 'width 0.3s ease'
                        }}>
                          {stage.value}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: '4px' }}>{stage.stage}</div>
                        {i < funnelData.length - 1 && <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--color-border)' }}></div>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* SECONDARY TABLE */}
            <section style={{ 
              backgroundColor: 'var(--color-card)', 
              borderRadius: '12px', 
              padding: '24px', 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px' }}>Campaign Performance</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    {['Campaign', 'Channel', 'Spend', 'Leads', 'CPA', 'ROI', 'Signal'].map((head, i) => (
                      <th key={i} style={{ 
                        paddingBottom: '12px', 
                        borderBottom: '1px solid var(--color-border)', 
                        fontSize: '10px', 
                        fontWeight: 600, 
                        color: 'var(--color-text-tertiary)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        textAlign: i > 1 && i < 6 ? 'right' : 'left'
                      }}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i === campaignData.length - 1 ? 'none' : '1px solid #F0F0EE' }}>
                      <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.name}</td>
                      <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.channel}</td>
                      <td style={{ padding: '16px 0', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{row.spend}</td>
                      <td style={{ padding: '16px 0', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{row.leads}</td>
                      <td style={{ padding: '16px 0', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{row.cpa}</td>
                      <td style={{ 
                        padding: '16px 0', 
                        fontSize: '13px', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 500,
                        textAlign: 'right',
                        color: row.roi.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)' 
                      }}>
                        {row.roi}
                      </td>
                      <td style={{ padding: '16px 0', textAlign: 'left', paddingLeft: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
                          {[1, 2, 3, 4, 5].map(bar => (
                            <div key={bar} style={{ 
                              width: '3px', 
                              height: `${bar * 2.8}px`, 
                              backgroundColor: bar <= row.signal ? 'var(--color-accent-gold)' : '#E5E5E0',
                              borderRadius: '1px'
                            }}></div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

          </div>
        </main>
      </div>
    </>
  );
};

export default AnalyticsGenerated;