import React, { useState, useMemo } from 'react';

const MOCK_PROSPECTS = [
  { id: 'p1', name: 'Eleanor Vance', role: 'VP of Engineering', company: 'Stark Industries', location: 'New York, NY', email: 'e.vance@stark.com', status: 'verified', score: 94, tags: ['Decision Maker', 'High Intent'] },
  { id: 'p2', name: 'Marcus Sterling', role: 'Director of IT', company: 'Wayne Enterprises', location: 'Gotham, NJ', email: 'msterling@wayne.com', status: 'catch-all', score: 88, tags: ['Technical Buyer'] },
  { id: 'p3', name: 'Sophia Chen', role: 'Chief Technology Officer', company: 'Cyberdyne Systems', location: 'San Francisco, CA', email: 'schen@cyberdyne.io', status: 'verified', score: 98, tags: ['C-Level', 'Urgent'] },
  { id: 'p4', name: 'Julian Bashir', role: 'Head of Data Science', company: 'Tyrell Corp', location: 'Los Angeles, CA', email: 'j.bashir@tyrell.co', status: 'unknown', score: 72, tags: ['Influencer'] },
  { id: 'p5', name: 'Amina El-Sayed', role: 'Lead Architect', company: 'Massive Dynamic', location: 'Boston, MA', email: 'amina@massive.com', status: 'verified', score: 85, tags: ['Technical Buyer'] },
  { id: 'p6', name: 'David Bowman', role: 'VP Operations', company: 'HAL Labs', location: 'Urbana, IL', email: 'dbowman@hallabs.net', status: 'verified', score: 91, tags: ['Decision Maker'] },
  { id: 'p7', name: 'Eldon Tyrell', role: 'Founder & CEO', company: 'Tyrell Corp', location: 'Los Angeles, CA', email: 'eldon@tyrell.co', status: 'catch-all', score: 99, tags: ['C-Level', 'VIP'] },
  { id: 'p8', name: 'Ellen Ripley', role: 'Logistics Director', company: 'Weyland-Yutani', location: 'Houston, TX', email: 'eripley@weyland.com', status: 'verified', score: 78, tags: ['Operations'] },
];

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);

const ProspectorGenerated = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeProspect, setActiveProspect] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    minScore: 0
  });

  const filteredProspects = useMemo(() => {
    return MOCK_PROSPECTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || p.status === filters.status;
      const matchesScore = p.score >= filters.minScore;
      return matchesSearch && matchesStatus && matchesScore;
    });
  }, [searchTerm, filters]);

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(newSet());
    } else {
      setSelectedIds(new Set(filteredProspects.map(p => p.id)));
    }
  };

  return (
    <div className="prospector-layout">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');

        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-hover: #FDFDFD;
          --bg-table-header: #FAFAF8;
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --text-muted: #99948D;
          
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.30);
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --semantic-success: #10B981;
          --semantic-success-bg: #E6F5EC;
          --semantic-success-text: #008F39;
          --semantic-warning-bg: #FFFCE6;
          --semantic-warning-text: #A68900;
          --semantic-error-bg: #FEF2F2;
          --semantic-error-text: #B91C1C;
          
          --font-sans: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --font-serif: 'Playfair Display', serif;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02);
          --shadow-float: 0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .prospector-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: var(--bg-canvas);
          font-family: var(--font-sans);
          color: var(--text-primary);
          overflow: hidden;
        }

        /* Animations */
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(255,215,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
        }
        
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Sidebar */
        .sidebar {
          width: 280px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          z-index: 10;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-default);
        }

        .brand-title {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-gold);
          animation: breathe 3s infinite ease-in-out;
        }

        .sidebar-content {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filter-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .filter-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .filter-input:focus {
          border-color: var(--accent-gold);
        }

        .filter-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .range-slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .range-value {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--bg-card);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-default);
        }

        /* Main Content */
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
        }

        .topbar {
          height: 72px;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-canvas);
        }

        .search-container {
          position: relative;
          width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 40px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .search-input:focus {
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 3px var(--accent-gold-muted);
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-primary {
          background: var(--accent-gold);
          color: #000;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background: var(--accent-gold-hover);
        }
        .btn-primary.pulse {
          animation: pulse-gold 2s infinite;
        }

        .btn-secondary {
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          padding: 10px 16px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: var(--bg-hover);
          border-color: #D1D1CD;
        }

        /* Table Area */
        .table-container {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .table-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        .table-header-row {
          display: grid;
          grid-template-columns: 48px 2.5fr 2fr 1.5fr 1fr 1fr;
          background: var(--bg-table-header);
          border-bottom: 1px solid var(--border-default);
          padding: 12px 16px;
        }

        .th-cell {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .prospect-row {
          display: grid;
          grid-template-columns: 48px 2.5fr 2fr 1.5fr 1fr 1fr;
          padding: 16px;
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.2s;
          cursor: pointer;
        }
        .prospect-row:last-child {
          border-bottom: none;
        }
        .prospect-row:hover {
          background: var(--bg-hover);
        }
        .prospect-row.active {
          background: #FCFAF5;
        }

        .td-cell {
          display: flex;
          align-items: center;
          font-size: 13px;
        }

        /* Custom Checkbox */
        .checkbox-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .custom-checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: var(--bg-card);
          transition: all 0.2s;
        }
        .custom-checkbox.checked {
          background: var(--accent-gold);
          border-color: var(--accent-gold);
          color: #000;
        }

        /* Prospect Info Cell */
        .prospect-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-sidebar);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-gold-deep, #9D7A39);
          border: 1px solid var(--accent-gold-muted);
        }
        .prospect-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .prospect-name {
          font-weight: 500;
          color: var(--text-primary);
        }
        .prospect-role {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Company Cell */
        .company-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        /* Status Badge */
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .status-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-verified {
          background: var(--semantic-success-bg);
          color: var(--semantic-success-text);
        }
        .status-verified::before { background: var(--semantic-success); }
        
        .status-catch-all {
          background: var(--semantic-warning-bg);
          color: var(--semantic-warning-text);
        }
        .status-catch-all::before { background: #F59E0B; }
        
        .status-unknown {
          background: var(--bg-sidebar);
          color: var(--text-secondary);
        }
        .status-unknown::before { background: var(--text-tertiary); }

        /* Score Bar */
        .score-container {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding-right: 16px;
        }
        .score-number {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          width: 24px;
        }
        .score-track {
          flex: 1;
          height: 4px;
          background: var(--border-default);
          border-radius: 2px;
          overflow: hidden;
        }
        .score-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        /* Detail Pane */
        .detail-pane {
          width: 360px;
          background: var(--bg-card);
          border-left: 1px solid var(--border-default);
          box-shadow: -4px 0 24px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 20;
        }

        .detail-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .close-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .detail-avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent-gold-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-size: 24px;
          color: var(--accent-gold-deep, #9D7A39);
          margin-bottom: 16px;
        }

        .detail-content {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .detail-section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .data-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .data-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .data-label {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .data-value {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag {
          padding: 4px 10px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .detail-footer {
          padding: 24px;
          border-top: 1px solid var(--border-default);
          background: #FAFAFA;
        }
        .btn-full {
          width: 100%;
          justify-content: center;
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">
            <div className="live-indicator"></div>
            Prospector
          </div>
        </div>
        <div className="sidebar-content">
          <div className="filter-section">
            <label className="filter-label">Target Industry</label>
            <select className="filter-input filter-select">
              <option>All Industries</option>
              <option>Software & Technology</option>
              <option>Financial Services</option>
              <option>Healthcare</option>
              <option>Manufacturing</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Job Titles</label>
            <input type="text" className="filter-input" placeholder="e.g. CTO, VP Engineering" />
          </div>

          <div className="filter-section">
            <label className="filter-label">Location</label>
            <input type="text" className="filter-input" placeholder="City, State, or Country" />
          </div>

          <div className="filter-section">
            <label className="filter-label">Email Status</label>
            <select 
              className="filter-input filter-select"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">Any Status</option>
              <option value="verified">Verified Only</option>
              <option value="catch-all">Catch-all</option>
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Min Fit Score</label>
            <div className="range-slider-container">
              <input 
                type="range" 
                min="0" max="100" 
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
                style={{flex: 1, accentColor: 'var(--accent-gold)'}}
              />
              <span className="range-value">{filters.minScore}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="main-area">
        <header className="topbar">
          <div className="search-container">
            <div className="search-icon"><SearchIcon /></div>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search prospects by name, role, or company..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="topbar-actions">
            <span style={{fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)'}}>
              {selectedIds.size} selected
            </span>
            <button className="btn-secondary">Export CSV</button>
            <button className={`btn-primary ${selectedIds.size > 0 ? 'pulse' : ''}`}>
              Save Leads
            </button>
          </div>
        </header>

        <div className="table-container">
          <div className="table-card">
            <div className="table-header-row">
              <div className="th-cell checkbox-wrapper">
                <div 
                  className={`custom-checkbox ${selectedIds.size === filteredProspects.length && filteredProspects.length > 0 ? 'checked' : ''}`}
                  onClick={toggleAll}
                >
                  {selectedIds.size > 0 && <CheckIcon />}
                </div>
              </div>
              <div className="th-cell">Prospect</div>
              <div className="th-cell">Company</div>
              <div className="th-cell">Location</div>
              <div className="th-cell">Email Status</div>
              <div className="th-cell">Fit Score</div>
            </div>

            {filteredProspects.map(prospect => {
              const isSelected = selectedIds.has(prospect.id);
              const isActive = activeProspect?.id === prospect.id;
              
              return (
                <div 
                  key={prospect.id} 
                  className={`prospect-row ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveProspect(prospect)}
                >
                  <div className="td-cell checkbox-wrapper" onClick={(e) => { e.stopPropagation(); toggleSelection(prospect.id); }}>
                    <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <CheckIcon />}
                    </div>
                  </div>
                  
                  <div className="td-cell prospect-info">
                    <div className="avatar">
                      {prospect.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="prospect-details">
                      <span className="prospect-name">{prospect.name}</span>
                      <span className="prospect-role">{prospect.role}</span>
                    </div>
                  </div>

                  <div className="td-cell company-info">
                    <BuildingIcon />
                    {prospect.company}
                  </div>

                  <div className="td-cell" style={{color: 'var(--text-secondary)'}}>
                    {prospect.location}
                  </div>

                  <div className="td-cell">
                    <span className={`status-badge status-${prospect.status}`}>
                      {prospect.status}
                    </span>
                  </div>

                  <div className="td-cell score-container">
                    <span className="score-number">{prospect.score}</span>
                    <div className="score-track">
                      <div 
                        className="score-fill" 
                        style={{
                          width: `${prospect.score}%`,
                          background: prospect.score >= 90 ? 'var(--accent-gold)' : 
                                      prospect.score >= 75 ? '#9CA3AF' : '#E5E5E0'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredProspects.length === 0 && (
              <div style={{padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px'}}>
                No prospects match your criteria.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DETAIL PANE */}
      {activeProspect && (
        <aside className="detail-pane">
          <div className="detail-header">
            <div>
              <div className="detail-avatar-large">
                {activeProspect.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2 style={{fontSize: '20px', fontWeight: 600, marginBottom: '4px'}}>{activeProspect.name}</h2>
              <p style={{fontSize: '14px', color: 'var(--text-secondary)'}}>{activeProspect.role} at {activeProspect.company}</p>
            </div>
            <button className="close-btn" onClick={() => setActiveProspect(null)}>
              <CloseIcon />
            </button>
          </div>

          <div className="detail-content">
            <div>
              <div className="detail-section-title">Contact Information</div>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Email Address</span>
                  <span className="data-value" style={{fontFamily: 'var(--font-mono)'}}>{activeProspect.email}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Location</span>
                  <span className="data-value">{activeProspect.location}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="detail-section-title">Intelligence Tags</div>
              <div className="tag-container">
                {activeProspect.tags?.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                <span className="tag" style={{background: 'var(--accent-gold-muted)', color: '#9D7A39', borderColor: 'var(--accent-gold-border)'}}>
                  Score: {activeProspect.score}
                </span>
              </div>
            </div>

            <div>
              <div className="detail-section-title">Recent Signals</div>
              <div style={{fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6}}>
                <p style={{marginBottom: '8px'}}>• Company recently raised Series C funding ($45M).</p>
                <p>• {activeProspect.name} posted about scaling engineering teams on LinkedIn 2 days ago.</p>
              </div>
            </div>
          </div>

          <div className="detail-footer">
            <button className="btn-primary btn-full">
              Reveal Contact Info
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default ProspectorGenerated;