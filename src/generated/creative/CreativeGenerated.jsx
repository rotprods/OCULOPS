import React, { useState, useMemo } from 'react';

const CreativeGenerated = () => {
  const [activeTab, setActiveTab] = useState('All Assets');
  const [promptText, setPromptText] = useState('');

  // Mock Data
  const kpis = [
    { label: 'Total Creative Spend', value: '$142,850', trend: '+12.4%', isPositive: true },
    { label: 'Blended ROAS', value: '3.8x', trend: '+0.2x', isPositive: true },
    { label: 'Active Variations', value: '312', trend: '-14', isPositive: false },
    { label: 'AI Win Rate', value: '68%', trend: '+5.1%', isPositive: true },
  ];

  const assets = [
    { id: 1, name: 'Q3_Hero_Video_v4', type: 'Video', status: 'Active', ctr: '3.2%', roas: '4.5x', spend: '$12,400', ai: false },
    { id: 2, name: 'Gen_Lifestyle_01', type: 'Image', status: 'Learning', ctr: '2.8%', roas: '3.1x', spend: '$2,100', ai: true },
    { id: 3, name: 'Retarget_Static_B', type: 'Image', status: 'Active', ctr: '1.9%', roas: '2.4x', spend: '$8,900', ai: false },
    { id: 4, name: 'Gen_Product_Dark', type: 'Image', status: 'Active', ctr: '4.1%', roas: '5.2x', spend: '$15,200', ai: true },
    { id: 5, name: 'Story_Promo_Flash', type: 'Video', status: 'Paused', ctr: '0.8%', roas: '0.9x', spend: '$450', ai: false },
    { id: 6, name: 'Gen_Variant_C_Gold', type: 'Image', status: 'Learning', ctr: '2.5%', roas: '2.8x', spend: '$1,800', ai: true },
  ];

  const tabs = ['All Assets', 'Video', 'Static', 'AI Generated'];

  const filteredAssets = useMemo(() => {
    if (activeTab === 'All Assets') return assets;
    if (activeTab === 'AI Generated') return assets.filter(a => a.ai);
    return assets.filter(a => a.type === activeTab || (activeTab === 'Static' && a.type === 'Image'));
  }, [activeTab]);

  return (
    <div className="creative-dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap');

        .creative-dashboard {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-muted: #99948D;
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --border-default: #E5E5E0;
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #15803D;
          --semantic-error-bg: #FEF2F2;
          --semantic-error-text: #B91C1C;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --font-serif: 'Playfair Display', serif;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.05);
          --shadow-glow: 0 0 15px rgba(255,215,0,0.15);

          background-color: var(--bg-canvas);
          min-height: 100vh;
          font-family: var(--font-sans);
          color: var(--text-primary);
          padding: 32px 40px;
          box-sizing: border-box;
        }

        .creative-dashboard * {
          box-sizing: border-box;
        }

        /* Typography */
        .h1-editorial {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .section-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }

        /* Buttons */
        .btn-primary {
          background-color: var(--accent-gold);
          color: #000;
          border: 1px solid rgba(0,0,0,0.1);
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans);
        }
        .btn-primary:hover {
          background-color: var(--accent-gold-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-glow);
        }

        .btn-ai-generate {
          background-color: #000;
          color: var(--accent-gold);
          border: 1px solid var(--accent-gold);
          padding: 14px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          animation: pulse-gold 2.5s infinite;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }
        .btn-ai-generate:hover {
          background-color: var(--accent-gold);
          color: #000;
          animation: none;
        }

        /* Animations */
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.3); }
          70% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .shimmer-bg {
          background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }

        /* Layout */
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        /* Cards */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          box-shadow: var(--shadow-card);
          padding: 24px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 300;
          color: var(--text-primary);
          margin: 8px 0;
          letter-spacing: -0.02em;
        }

        .trend-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .trend-positive {
          background: var(--semantic-success-bg);
          color: var(--semantic-success-text);
        }
        .trend-negative {
          background: var(--semantic-error-bg);
          color: var(--semantic-error-text);
        }

        /* Asset Grid */
        .tabs-container {
          display: flex;
          gap: 24px;
          border-bottom: 1px solid var(--border-default);
          margin-bottom: 24px;
        }
        .tab {
          padding: 12px 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent-gold);
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        .asset-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .asset-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: rgba(255,215,0,0.4);
        }

        .asset-preview {
          height: 140px;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--border-default);
        }

        .asset-info {
          padding: 16px;
        }

        .asset-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 12px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .asset-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dashed var(--border-default);
        }

        .status-pill {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-active { background: var(--semantic-success-bg); color: var(--semantic-success-text); }
        .status-paused { background: #F3F4F6; color: var(--text-secondary); }
        .status-learning { background: var(--accent-gold-muted); color: #9D7A39; }

        /* AI Studio */
        .ai-studio-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          box-shadow: var(--shadow-card);
          position: sticky;
          top: 32px;
        }

        .ai-studio-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-sidebar);
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-studio-body {
          padding: 24px;
        }

        .prompt-input {
          width: 100%;
          height: 120px;
          background: var(--bg-canvas);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-primary);
          resize: none;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .prompt-input:focus {
          outline: none;
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 2px var(--accent-gold-muted);
        }

        .settings-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .select-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          font-size: 12px;
          color: var(--text-primary);
          background: var(--bg-card);
          font-family: var(--font-sans);
        }

        /* Icons */
        svg {
          display: block;
        }
      `}</style>

      {/* Header */}
      <header className="header-row">
        <div>
          <span className="section-label">Workspace / Marketing / Q3 Campaigns</span>
          <h1 className="h1-editorial">Creative Intelligence</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: 'transparent', border: '1px solid var(--border-default)', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Last 30 Days
          </button>
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Asset
          </button>
        </div>
      </header>

      <div className="main-grid">
        {/* Left Column: KPIs & Assets */}
        <div>
          {/* KPI Grid */}
          <div className="kpi-grid">
            {kpis.map((kpi, i) => (
              <div key={i} className="card">
                <span className="section-label">{kpi.label}</span>
                <div className="kpi-value">{kpi.value}</div>
                <div className={`trend-badge ${kpi.isPositive ? 'trend-positive' : 'trend-negative'}`}>
                  {kpi.trend} {kpi.isPositive ? '↑' : '↓'}
                </div>
              </div>
            ))}
          </div>

          {/* Asset Library */}
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '24px 24px 0 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Asset Performance</h2>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    style={{ padding: '6px 12px 6px 32px', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '12px', width: '200px' }}
                  />
                </div>
              </div>

              <div className="tabs-container">
                {tabs.map(tab => (
                  <div 
                    key={tab} 
                    className={`tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '0 24px 24px 24px' }}>
              <div className="asset-grid">
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="asset-card">
                    <div className="asset-preview shimmer-bg">
                      {asset.ai && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '4px', color: 'var(--accent-gold)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                          </svg>
                        </div>
                      )}
                      {asset.type === 'Video' ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="asset-info">
                      <h3 className="asset-title" title={asset.name}>{asset.name}</h3>
                      <div className="asset-meta-row">
                        <span>{asset.type}</span>
                        <span className={`status-pill status-${asset.status.toLowerCase()}`}>{asset.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{asset.ctr}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ROAS</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{asset.roas}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spend</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{asset.spend}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Studio */}
        <div>
          <div className="ai-studio-card">
            <div className="ai-studio-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold-deep, #9D7A39)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
              <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, fontFamily: 'var(--font-serif)' }}>Creative Copilot</h2>
            </div>
            <div className="ai-studio-body">
              <span className="section-label">Generation Prompt</span>
              <textarea 
                className="prompt-input" 
                placeholder="Describe the creative asset you want to generate. E.g., 'A cinematic product shot of a running shoe on a neon-lit city street at night, high contrast, 8k resolution...'"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>

              <span className="section-label">Parameters</span>
              <div className="settings-row">
                <select className="select-input">
                  <option>16:9 (Landscape)</option>
                  <option>1:1 (Square)</option>
                  <option>9:16 (Story)</option>
                </select>
                <select className="select-input">
                  <option>Photorealistic</option>
                  <option>3D Render</option>
                  <option>Illustration</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="brand-guidelines" defaultChecked style={{ accentColor: 'var(--accent-gold)' }} />
                <label htmlFor="brand-guidelines" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Apply Brand Guidelines (Colors, Logo)</label>
              </div>

              <button className="btn-ai-generate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Generate Variations
              </button>

              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <span className="section-label">Recent Generations</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="shimmer-bg" style={{ width: '48px', height: '48px', borderRadius: '4px', border: '1px solid var(--border-default)' }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeGenerated;