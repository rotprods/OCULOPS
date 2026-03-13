import React, { useState, useMemo } from 'react';

const LabGenerated = () => {
  const [temperature, setTemperature] = useState(0.7);

  const navItems = [
    { icon: 'grid_view', label: 'Overview' },
    { icon: 'smart_toy', label: 'Agents' },
    { icon: 'account_tree', label: 'Workflows' },
    { icon: 'science', label: 'Lab', active: true },
    { icon: 'database', label: 'Data' },
    { icon: 'settings', label: 'Settings' },
  ];

  const activeExperiments = [
    { id: 1, name: 'Alpha-Omega Routing', type: 'Workflow', desc: 'Testing dynamic fallback paths for high-latency endpoints.', status: 'Running', time: '4h 22m', progress: 65 },
    { id: 2, name: 'Sentiment Analyzer v2', type: 'Model', desc: 'Fine-tuned on Q3 customer interaction dataset.', status: 'Running', time: '1h 15m', progress: 32 },
    { id: 3, name: 'Data Scraper Bot', type: 'Agent', desc: 'Headless browser extraction with heuristic DOM parsing.', status: 'Running', time: '0h 45m', progress: 88 },
  ];

  const recentResults = [
    { id: 1, name: 'GPT-4 Turbo Cache', type: 'Model', result: 'Success', imp: 15.2, date: 'Oct 24, 2023' },
    { id: 2, name: 'Heuristic Parser', type: 'Workflow', result: 'Failed', imp: -4.5, date: 'Oct 23, 2023' },
    { id: 3, name: 'Customer Support Agent', type: 'Agent', result: 'Success', imp: 8.7, date: 'Oct 22, 2023' },
    { id: 4, name: 'Embeddings V3', type: 'Model', result: 'Success', imp: 22.1, date: 'Oct 21, 2023' },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

    :root {
      --color-canvas: #FAFAF8;
      --color-sidebar: #F5F0E8;
      --color-card: #FFFFFF;
      --color-text-primary: #1A1A1A;
      --color-text-secondary: #6B6B6B;
      --color-text-tertiary: #9CA3AF;
      --color-border: #E5E5E0;
      --color-gold: #FFD700;
      --color-gold-hover: #F0C800;
      --color-gold-muted: rgba(255,215,0,0.15);
      --color-success: #10B981;
      --color-error: #EF4444;
      
      --font-sans: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --font-icon: 'Material Symbols Outlined';
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background-color: var(--color-canvas);
      color: var(--color-text-primary);
      -webkit-font-smoothing: antialiased;
    }

    @keyframes pulse-gold {
      0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.6); }
      70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }

    @keyframes pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
      70% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0px); }
    }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes dash {
      to { stroke-dashoffset: 0; }
    }

    .material-symbols-outlined {
      font-family: var(--font-icon);
      font-weight: normal;
      font-style: normal;
      font-size: 20px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }

    .custom-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      background: var(--color-border);
      border-radius: 2px;
      outline: none;
    }

    .custom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-gold);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.1s;
    }

    .custom-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-sans);
      gap: 8px;
    }

    .btn-gold {
      background-color: var(--color-gold);
      color: #1A1A1A;
      border: none;
      font-weight: 600;
    }
    .btn-gold:hover {
      background-color: var(--color-gold-hover);
    }

    .btn-outline {
      background-color: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }
    .btn-outline:hover {
      background-color: rgba(0,0,0,0.02);
      border-color: #D0D0CA;
    }

    .btn-ghost {
      background-color: transparent;
      border: 1px solid transparent;
      color: var(--color-text-secondary);
    }
    .btn-ghost:hover {
      color: var(--color-text-primary);
      background-color: rgba(0,0,0,0.02);
    }

    .card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
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
      background: #D0D0CA;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #B0B0AA;
    }
  `;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <style>{css}</style>

      {/* SIDEBAR */}
      <aside style={{ 
        width: '240px', 
        backgroundColor: 'var(--color-sidebar)', 
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--color-gold)' }}></div>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em' }}>Nexus OS</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: item.active ? '#EBE4D8' : 'transparent',
              color: item.active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: item.active ? '500' : '400',
              transition: 'all 0.2s ease'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: item.active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '14px' }}>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <header style={{ 
          height: '56px', 
          borderBottom: '1px solid var(--color-border)', 
          backgroundColor: 'var(--color-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-text-secondary)' }}>science</span>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Lab</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--color-text-tertiary)' }}>search</span>
              <input 
                type="text" 
                placeholder="Search experiments..." 
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                  fontSize: '13px',
                  width: '240px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', animation: 'pulse-green 2s infinite' }}></div>
              LIVE
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* HERO VISUALIZATION */}
          <section className="card" style={{ 
            height: '280px', 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle, #E5E5E0 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: 'center center'
          }}>
            {/* Overlay Text */}
            <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.02em' }}>R&D Sandbox</h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Test hypotheses, prototype agents, validate models</p>
            </div>

            {/* SVG Tendrils */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.3" fill="none">
                <path d="M 50% 50% Q 30% 20% 20% 30%" strokeDasharray="4 4" />
                <path d="M 50% 50% Q 70% 20% 80% 40%" strokeDasharray="4 4" />
                <path d="M 50% 50% Q 80% 80% 60% 80%" strokeDasharray="4 4" />
                <path d="M 50% 50% Q 20% 70% 30% 80%" strokeDasharray="4 4" />
                <path d="M 50% 50% L 15% 50%" strokeDasharray="4 4" />
                <path d="M 50% 50% L 85% 50%" strokeDasharray="4 4" />
              </g>
            </svg>

            {/* Nodes */}
            {[
              { top: '30%', left: '20%', label: 'exp_alpha_v1' },
              { top: '40%', left: '80%', label: 'model_tune_q3' },
              { top: '80%', left: '60%', label: 'agent_swarm_test' },
              { top: '80%', left: '30%', label: 'heuristic_eval' },
              { top: '50%', left: '15%', label: 'data_pipe_01' },
              { top: '50%', left: '85%', label: 'embed_v3_beta' },
            ].map((node, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: node.top,
                left: node.left,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-gold)', boxShadow: '0 0 8px var(--color-gold)' }}></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-text-secondary)', backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 4px', borderRadius: '4px' }}>{node.label}</span>
              </div>
            ))}

            {/* Central Sphere */}
            <div style={{
              position: 'relative',
              zIndex: 5,
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.8) 0%, rgba(212,175,55,0.2) 60%, transparent 100%)',
              boxShadow: '0 0 40px rgba(255,215,0,0.15), inset 0 0 20px rgba(255,255,255,0.5)',
              animation: 'float 6s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '1px dashed rgba(255,215,0,0.4)',
                animation: 'spin-slow 20s linear infinite'
              }}></div>
              <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 0 20px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#9D7A39', fontSize: '20px' }}>memory</span>
              </div>
            </div>
          </section>

          {/* WORKBENCH */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            
            {/* Left: Active Experiments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Experiments</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeExperiments.map(exp => (
                  <div key={exp.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{exp.name}</h4>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{exp.type}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{exp.desc}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-gold)', animation: 'pulse-gold 2s infinite' }}></div>
                          <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{exp.status}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{exp.time}</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-canvas)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${exp.progress}%`, height: '100%', backgroundColor: 'var(--color-gold)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Launch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Launch</h3>
              
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-gold" style={{ width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    New Agent Prototype
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button className="btn btn-outline">Test Workflow</button>
                    <button className="btn btn-outline">Model Eval</button>
                  </div>
                  <button className="btn btn-ghost" style={{ width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                    Import from Production
                  </button>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Model</label>
                    <select style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--color-border)', 
                      backgroundColor: 'var(--color-canvas)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}>
                      <option>GPT-4 Turbo</option>
                      <option>Claude 3 Opus</option>
                      <option>Llama 3 70B</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temperature</label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-primary)' }}>{temperature.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="2" step="0.01" 
                      value={temperature} 
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="custom-slider"
                    />
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* RESULTS LOG */}
          <section className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Recent Results</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experiment</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Improvement</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentResults.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: idx === recentResults.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{row.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{row.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: row.result === 'Success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {row.result === 'Success' ? 'check_circle' : 'cancel'}
                          </span>
                          {row.result}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontSize: '12px', 
                            color: row.imp > 0 ? 'var(--color-success)' : 'var(--color-error)',
                            width: '45px'
                          }}>
                            {row.imp > 0 ? '+' : ''}{row.imp}%
                          </span>
                          <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--color-canvas)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(Math.abs(row.imp) * 3, 100)}%`, 
                              height: '100%', 
                              backgroundColor: row.imp > 0 ? 'var(--color-gold)' : 'var(--color-error)',
                              borderRadius: '2px'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default LabGenerated;