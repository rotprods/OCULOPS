import React, { useState } from 'react';

const KnowledgeGenerated = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filters = ['All', 'Proposals', 'Reports', 'Signals', 'Market Data', 'Agent Learnings'];

  const entries = [
    {
      id: 1,
      title: 'Q3 Global Market Sentiment Analysis',
      source: 'Agent SCRIBE',
      date: 'Mar 10, 2026',
      relevance: 98,
      preview: 'Comprehensive analysis of emerging market trends indicating a shift towards sustainable tech infrastructure investments...',
      type: 'report'
    },
    {
      id: 2,
      title: 'Projected Yield Curve Inversion Signals',
      source: 'Agent QUANT',
      date: 'Mar 09, 2026',
      relevance: 92,
      preview: 'Algorithmic detection of subtle yield curve anomalies in European markets, suggesting potential short-term volatility...',
      type: 'signal'
    },
    {
      id: 3,
      title: 'Acquisition Proposal: Nexus Dynamics',
      source: 'Agent STRAT',
      date: 'Mar 08, 2026',
      relevance: 85,
      preview: 'Draft proposal outlining strategic synergies and valuation models for the potential acquisition of Nexus Dynamics...',
      type: 'proposal'
    },
    {
      id: 4,
      title: 'Client Profile: Apex Holdings Ltd.',
      source: 'CRM Integration',
      date: 'Mar 05, 2026',
      relevance: 78,
      preview: 'Updated risk tolerance and portfolio diversification preferences based on recent quarterly review meetings...',
      type: 'document'
    },
    {
      id: 5,
      title: 'Commodity Price Fluctuation Models',
      source: 'Agent QUANT',
      date: 'Mar 01, 2026',
      relevance: 71,
      preview: 'Predictive models for precious metals and rare earth elements factoring in recent geopolitical supply chain disruptions...',
      type: 'chart'
    }
  ];

  const graphNodes = [
    { id: 1, cx: 50, cy: 140, r: 24, label: 'Market Signals' },
    { id: 2, cx: 180, cy: 80, r: 32, label: 'Proposals' },
    { id: 3, cx: 280, cy: 200, r: 28, label: 'Client Profiles' },
    { id: 4, cx: 120, cy: 220, r: 16, label: '' },
    { id: 5, cx: 240, cy: 120, r: 12, label: '' },
    { id: 6, cx: 340, cy: 100, r: 18, label: '' },
    { id: 7, cx: 90, cy: 60, r: 14, label: '' },
    { id: 8, cx: 200, cy: 260, r: 20, label: '' }
  ];

  const graphLinks = [
    { source: 1, target: 4 }, { source: 1, target: 7 }, { source: 1, target: 2 },
    { source: 2, target: 5 }, { source: 2, target: 7 }, { source: 2, target: 3 },
    { source: 3, target: 5 }, { source: 3, target: 6 }, { source: 3, target: 8 },
    { source: 4, target: 8 }, { source: 5, target: 4 }
  ];

  const getIconForType = (type) => {
    switch (type) {
      case 'report':
        return <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />;
      case 'signal':
        return <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />;
      case 'proposal':
        return <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />;
      case 'chart':
        return <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />;
      default:
        return <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-canvas)',
      fontFamily: 'var(--font-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <style>
        {`
          :root {
            --bg-canvas: #FAFAF8;
            --bg-sidebar: #F5F0E8;
            --bg-card: #FFFFFF;
            --bg-input: #F0F0EE;
            --bg-hover-nav: rgba(0,0,0,0.04);
            --bg-sidebar-active: #EBE4D8;
            --text-primary: #1A1A1A;
            --text-secondary: #6B6B6B;
            --text-tertiary: #9CA3AF;
            --accent-gold: #FFD700;
            --accent-gold-muted: rgba(255,215,0,0.10);
            --accent-gold-border: rgba(255,215,0,0.30);
            --border-default: #E5E5E0;
            --border-subtle: #F0F0EE;
            --font-primary: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
            --shadow-card: 0 2px 8px rgba(0,0,0,0.02);
            --shadow-glow: 0 0 0 3px rgba(255,215,0,0.15);
          }

          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

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

          @keyframes breathe {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }

          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .search-input::placeholder {
            color: #9A9A9A;
          }
          
          .search-input:focus {
            outline: none;
          }

          .entry-card:hover {
            background-color: #FAFAF8;
          }
        `}
      </style>

      {/* SIDEBAR */}
      <div style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>OS_CORE</span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '8px', padding: '0 8px' }}>OVERVIEW</div>
          <div style={{ padding: '8px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Dashboard</div>
          <div style={{ padding: '8px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Agents</div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '8px', padding: '0 8px' }}>INTELLIGENCE</div>
          <div style={{ padding: '8px', fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-sidebar-active)', borderRadius: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/>
            </svg>
            Knowledge
          </div>
          <div style={{ padding: '8px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Signals</div>
          <div style={{ padding: '8px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>Reports</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{
          height: '56px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--bg-canvas)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-primary)">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/>
            </svg>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Knowledge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-secondary)" style={{ cursor: 'pointer' }}>
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'breathe 2s infinite' }}></div>
              <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE AREA */}
        <div className="hide-scrollbar" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* HERO SEARCH */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle gold top border tint */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-gold-border), transparent)' }}></div>
            
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', letterSpacing: '-0.02em' }}>Knowledge Intelligence</h1>
            
            <div style={{
              position: 'relative',
              width: '100%',
              height: '48px',
              marginBottom: '16px',
              borderRadius: '12px',
              border: `1px solid ${isSearchFocused ? 'var(--accent-gold)' : 'var(--border-default)'}`,
              backgroundColor: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              transition: 'all 0.2s ease',
              boxShadow: isSearchFocused ? 'var(--shadow-glow)' : 'none'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-tertiary)" style={{ marginRight: '12px' }}>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              
              {/* AI Pulse Orb */}
              <div style={{
                position: 'absolute',
                left: '36px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-gold)',
                animation: 'pulse-gold 2s infinite'
              }}></div>

              <input 
                type="text" 
                className="search-input"
                placeholder="Search knowledge base with semantic AI..." 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-primary)',
                  marginLeft: '16px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.map(filter => (
                <div 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: `1px solid ${activeFilter === filter ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                    backgroundColor: activeFilter === filter ? 'var(--accent-gold-muted)' : 'var(--bg-card)',
                    color: activeFilter === filter ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {filter}
                </div>
              ))}
            </div>
          </div>

          {/* SPLIT VIEW */}
          <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
            
            {/* KNOWLEDGE GRAPH */}
            <div style={{
              flex: 1,
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-default)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Semantic Network
              </div>
              <div style={{ flex: 1, position: 'relative', backgroundColor: '#FDFDFD', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                  {/* Links */}
                  {graphLinks.map((link, i) => {
                    const sourceNode = graphNodes.find(n => n.id === link.source);
                    const targetNode = graphNodes.find(n => n.id === link.target);
                    return (
                      <line 
                        key={`link-${i}`}
                        x1={sourceNode.cx} 
                        y1={sourceNode.cy} 
                        x2={targetNode.cx} 
                        y2={targetNode.cy} 
                        stroke="var(--accent-gold)" 
                        strokeWidth="1" 
                        opacity="0.15"
                      />
                    );
                  })}
                  
                  {/* Nodes */}
                  {graphNodes.map(node => (
                    <g key={`node-${node.id}`}>
                      <circle 
                        cx={node.cx} 
                        cy={node.cy} 
                        r={node.r} 
                        fill="var(--accent-gold)" 
                        opacity={node.label ? "0.2" : "0.1"}
                      />
                      <circle 
                        cx={node.cx} 
                        cy={node.cy} 
                        r={node.r / 2} 
                        fill="var(--accent-gold)" 
                        opacity="0.8"
                      />
                      {node.label && (
                        <text 
                          x={node.cx} 
                          y={node.cy + node.r + 14} 
                          textAnchor="middle" 
                          fontSize="11" 
                          fill="var(--text-secondary)"
                          fontWeight="500"
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* ENTRIES LIST */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }} className="hide-scrollbar">
              {entries.map(entry => (
                <div key={entry.id} className="entry-card" style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      {getIconForType(entry.type)}
                    </svg>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '12px' }}>
                        {entry.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${entry.relevance}%`, height: '100%', backgroundColor: 'var(--accent-gold)' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{entry.relevance}%</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{entry.source}</span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--border-default)' }}></span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{entry.date}</span>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {entry.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STATS FOOTER */}
          <div style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            paddingTop: '8px',
            fontFamily: 'var(--font-mono)'
          }}>
            1,245 knowledge entries | 47 categories | Last indexed: 2h ago
          </div>

        </div>
      </div>
    </div>
  );
};

export default KnowledgeGenerated;