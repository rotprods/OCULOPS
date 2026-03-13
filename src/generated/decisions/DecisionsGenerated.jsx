import React, { useState, useMemo } from 'react';

const DecisionsGenerated = () => {
  const [selectedDecisionId, setSelectedDecisionId] = useState('DEC-001');

  const mockDecisions = useMemo(() => [
    {
      id: 'DEC-001',
      title: 'Q3 Cloud Infrastructure Migration',
      category: 'Engineering',
      status: 'Pending',
      optionsCount: 3,
      confidence: 85,
      outcome: 'TBD',
      date: 'Oct 24, 2023',
      context: 'Evaluating the transition of core microservices from AWS to GCP to leverage specific AI/ML tooling and reduce compute costs by an estimated 18% annually.',
      options: [
        { name: 'Full GCP Migration', pros: ['18% Cost reduction', 'Native Vertex AI access'], cons: ['High migration effort (3mo)', 'Vendor lock-in risk'], score: 85, isWinner: true },
        { name: 'Hybrid Cloud (AWS+GCP)', pros: ['Maximum flexibility', 'Risk mitigation'], cons: ['Complex networking', 'Higher operational overhead'], score: 62, isWinner: false },
        { name: 'Stay on AWS', pros: ['Zero migration effort', 'Known ecosystem'], cons: ['Higher long-term costs', 'Missing specific ML features'], score: 45, isWinner: false }
      ]
    },
    {
      id: 'DEC-002',
      title: 'Acquisition of DataFlow Inc.',
      category: 'Corporate Strategy',
      status: 'Made',
      optionsCount: 2,
      confidence: 92,
      outcome: 'Positive',
      date: 'Sep 12, 2023',
      context: 'Strategic acquisition to absorb their proprietary data pipeline technology and engineering team to accelerate our Q1 roadmap.',
      options: [
        { name: 'Acquire for $12M', pros: ['Immediate tech acquisition', 'Acqui-hire 15 engineers'], cons: ['Significant capital expenditure', 'Culture integration risk'], score: 92, isWinner: true },
        { name: 'Build In-House', pros: ['Lower upfront cash cost', 'Custom fit to architecture'], cons: ['Time to market (18mo+)', 'High opportunity cost'], score: 30, isWinner: false }
      ]
    },
    {
      id: 'DEC-003',
      title: 'Q4 Enterprise Marketing Budget Allocation',
      category: 'Marketing',
      status: 'Pending',
      optionsCount: 4,
      confidence: 78,
      outcome: 'TBD',
      date: 'Oct 26, 2023',
      context: 'Determining the optimal spend distribution for the remaining $2.5M Q4 budget to maximize enterprise lead generation.',
      options: [
        { name: 'Event-Heavy Strategy', pros: ['High-touch engagement', 'Brand visibility'], cons: ['Low measurable ROI', 'High logistical overhead'], score: 55, isWinner: false },
        { name: 'Digital & ABM Focus', pros: ['Highly targeted', 'Measurable pipeline impact'], cons: ['Longer sales cycles', 'High CAC'], score: 78, isWinner: true },
        { name: 'Partner Co-Marketing', pros: ['Shared costs', 'Access to new audiences'], cons: ['Loss of brand control', 'Complex execution'], score: 65, isWinner: false }
      ]
    },
    {
      id: 'DEC-004',
      title: 'Remote Work Policy Revision',
      category: 'HR & Ops',
      status: 'Made',
      optionsCount: 3,
      confidence: 88,
      outcome: 'Positive',
      date: 'Aug 05, 2023',
      context: 'Updating post-pandemic work policies to balance employee satisfaction with collaborative requirements for product teams.',
      options: [
        { name: 'Fully Remote', pros: ['Highest employee satisfaction', 'Wider talent pool'], cons: ['Siloed communication', 'Culture dilution'], score: 60, isWinner: false },
        { name: 'Structured Hybrid (3/2)', pros: ['Balances focus & collaboration', 'Predictable office presence'], cons: ['Commute friction', 'Real estate costs remain'], score: 88, isWinner: true },
        { name: 'Full Return to Office', pros: ['Maximum synchronous collaboration', 'Easier onboarding'], cons: ['High attrition risk', 'Reduced talent pool'], score: 20, isWinner: false }
      ]
    },
    {
      id: 'DEC-005',
      title: 'Vendor Selection: Global CRM',
      category: 'Sales Ops',
      status: 'Deferred',
      optionsCount: 3,
      confidence: 45,
      outcome: 'TBD',
      date: 'Jul 18, 2023',
      context: 'Selecting a unified CRM platform to consolidate regional sales data. Deferred due to budget constraints in Q3.',
      options: [
        { name: 'Salesforce Enterprise', pros: ['Industry standard', 'Massive ecosystem'], cons: ['Very expensive', 'Complex implementation'], score: 75, isWinner: true },
        { name: 'HubSpot CRM', pros: ['User-friendly', 'Inbound marketing synergy'], cons: ['Lacks complex enterprise features', 'Reporting limitations'], score: 68, isWinner: false },
        { name: 'Custom Build', pros: ['Exact fit to process', 'No license fees'], cons: ['Massive dev effort', 'Ongoing maintenance burden'], score: 15, isWinner: false }
      ]
    },
    {
      id: 'DEC-006',
      title: 'Pricing Tier Restructure',
      category: 'Product',
      status: 'Made',
      optionsCount: 2,
      confidence: 65,
      outcome: 'Negative',
      date: 'May 02, 2023',
      context: 'Attempted to simplify pricing from 5 tiers to 3 to reduce friction in the self-serve funnel.',
      options: [
        { name: 'Consolidate to 3 Tiers', pros: ['Simpler cognitive load', 'Easier marketing'], cons: ['Alienates mid-market segment', 'Revenue dip expected'], score: 65, isWinner: true },
        { name: 'Keep 5 Tiers, Rename', pros: ['Maintains revenue streams', 'Low risk'], cons: ['Funnel friction remains', 'Complex billing logic'], score: 50, isWinner: false }
      ]
    }
  ], []);

  const toggleRow = (id) => {
    setSelectedDecisionId(selectedDecisionId === id ? null : id);
  };

  const renderConfidenceBars = (score) => {
    const bars = 4;
    const filled = Math.ceil((score / 100) * bars);
    return (
      <div style={{ display: 'flex', gap: '3px', height: '14px', alignItems: 'flex-end' }}>
        {[...Array(bars)].map((_, i) => (
          <div key={i} style={{
            width: '4px',
            height: `${(i + 1) * 3.5}px`,
            backgroundColor: i < filled ? 'var(--accent-gold)' : 'var(--border-default)',
            borderRadius: '1px',
            transition: 'background-color 0.3s ease'
          }} />
        ))}
        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{score}%</span>
      </div>
    );
  };

  const CircularScore = ({ score }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
      <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx="20" cy="20" r={radius} stroke="var(--border-subtle)" strokeWidth="3" fill="none" />
          <circle cx="20" cy="20" r={radius} stroke="var(--accent-gold)" strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{score}</span>
      </div>
    );
  };

  return (
    <div className="decisions-dashboard" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-canvas)',
      fontFamily: 'var(--font-primary)',
      color: 'var(--text-primary)',
      WebkitFontSmoothing: 'antialiased'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .decisions-dashboard {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-sidebar-active: #EBE4D8;
          --bg-hover-row: #FDFDFD;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.15);
          --accent-gold-hover: #F0C800;
          
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #15803D;
          --semantic-error: #EF4444;
          --semantic-error-bg: #FEF2F2;
          --semantic-error-text: #B91C1C;
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --font-primary: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        @keyframes heartbeat {
          0% { transform: scale(1); opacity: 0.8; }
          15% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(255,215,0,0.6); }
          30% { transform: scale(1); opacity: 0.8; box-shadow: none; }
          45% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(255,215,0,0.6); }
          60% { transform: scale(1); opacity: 0.8; box-shadow: none; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          margin: 4px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-item:hover {
          background-color: rgba(0,0,0,0.04);
          color: var(--text-primary);
        }
        .sidebar-item.active {
          background-color: var(--bg-sidebar-active);
          color: var(--text-primary);
          font-weight: 600;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .btn-gold {
          background-color: var(--accent-gold);
          color: #000;
        }
        .btn-gold:hover {
          background-color: var(--accent-gold-hover);
        }
        .btn-outline {
          background-color: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }
        .btn-outline:hover {
          background-color: rgba(0,0,0,0.02);
          border-color: #D0D0CB;
        }

        .table-row {
          transition: background-color 0.2s ease;
          cursor: pointer;
        }
        .table-row:hover {
          background-color: var(--bg-hover-row);
        }
        .table-row.selected {
          background-color: #FAFAF8;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pill-pending { background-color: var(--accent-gold-muted); color: #9D7A39; }
        .pill-made { background-color: var(--semantic-success-bg); color: var(--semantic-success-text); }
        .pill-deferred { background-color: #F3F4F6; color: var(--text-secondary); }
        .pill-positive { background-color: var(--semantic-success-bg); color: var(--semantic-success-text); }
        .pill-negative { background-color: var(--semantic-error-bg); color: var(--semantic-error-text); }
        .pill-tbd { background-color: #F3F4F6; color: var(--text-secondary); }

        .detail-panel-enter {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: scaleY(0.95); }
          to { opacity: 1; transform: scaleY(1); }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>OS.Core</span>
        </div>
        
        <div style={{ padding: '0 8px', marginTop: '12px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.1em', padding: '0 12px', marginBottom: '8px', fontWeight: 600 }}>Intelligence</div>
          <div className="sidebar-item">Overview</div>
          <div className="sidebar-item">Knowledge Graph</div>
          <div className="sidebar-item active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
            Decisions
          </div>
          <div className="sidebar-item">Agents</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* HEADER */}
        <header style={{
          height: '56px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M3 10h18"/><path d="M3 14h18"/></svg>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Decisions</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input type="text" placeholder="Search decisions..." style={{
                backgroundColor: '#F0F0EE',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px 6px 32px',
                fontSize: '13px',
                width: '200px',
                outline: 'none',
                fontFamily: 'var(--font-primary)'
              }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--semantic-error)', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* CONTENT WRAPPER */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* HERO CARD */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Decision Intelligence</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Track decisions, analyze options, measure outcomes.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'heartbeat 2s infinite' }} title="AI Engine Active" />
              <button className="btn btn-outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Log
              </button>
              <button className="btn btn-gold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Log Decision
              </button>
            </div>
          </div>

          {/* KPI ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-gold)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Pending Decisions</div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>8</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Decisions Made</div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>24</div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Positive Outcomes</div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--semantic-success-text)' }}>78%</div>
            </div>
          </div>

          {/* DECISION LOG TABLE */}
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-default)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Decision</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Options</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome</th>
                  <th style={{ padding: '16px 20px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {mockDecisions.map((decision) => (
                  <React.Fragment key={decision.id}>
                    <tr 
                      className={`table-row ${selectedDecisionId === decision.id ? 'selected' : ''}`}
                      onClick={() => toggleRow(decision.id)}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 500 }}>{decision.title}</td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{decision.category}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`pill pill-${decision.status.toLowerCase()}`}>{decision.status}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{decision.optionsCount}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {renderConfidenceBars(decision.confidence)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`pill pill-${decision.outcome.toLowerCase()}`}>{decision.outcome}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{decision.date}</td>
                    </tr>
                    
                    {/* EXPANDED DETAIL PANEL */}
                    {selectedDecisionId === decision.id && (
                      <tr style={{ backgroundColor: '#FAFAF8', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <td colSpan="7" style={{ padding: 0 }}>
                          <div className="detail-panel-enter" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-default)' }}>
                            
                            <div style={{ marginBottom: '24px', maxWidth: '800px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' }}>Context & Objective</h3>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{decision.context}</p>
                            </div>

                            <div>
                              <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Options Analysis</h3>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                                
                                {decision.options.map((option, idx) => (
                                  <div key={idx} style={{ 
                                    backgroundColor: 'var(--bg-card)', 
                                    borderRadius: '8px', 
                                    border: `1px solid ${option.isWinner ? 'var(--accent-gold)' : 'var(--border-subtle)'}`, 
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    boxShadow: option.isWinner ? '0 4px 12px rgba(255,215,0,0.08)' : 'none'
                                  }}>
                                    {option.isWinner && decision.status === 'Pending' && (
                                      <div style={{ position: 'absolute', top: '-8px', right: '16px', backgroundColor: 'var(--accent-gold)', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>AI Recommended</div>
                                    )}
                                    
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0' }}>{option.name}</h4>
                                    
                                    <div style={{ flex: 1 }}>
                                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
                                        {option.pros.map((pro, i) => (
                                          <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                                            {pro}
                                          </li>
                                        ))}
                                      </ul>
                                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {option.cons.map((con, i) => (
                                          <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            {con}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <CircularScore score={option.score} />
                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</span>
                                      </div>
                                      {option.isWinner && decision.status === 'Pending' && (
                                        <button className="btn btn-gold" style={{ padding: '6px 12px', fontSize: '12px' }}>Select Option</button>
                                      )}
                                    </div>
                                  </div>
                                ))}

                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DecisionsGenerated;