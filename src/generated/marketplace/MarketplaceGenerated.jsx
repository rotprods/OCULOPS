import React, { useState, useMemo } from 'react';

const CSS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg-canvas: #FAFAF8;
    --bg-sidebar: #F5F0E8;
    --bg-card: #FFFFFF;
    --bg-hover-nav: rgba(0,0,0,0.04);
    --bg-sidebar-active: #EBE4D8;
    
    --text-primary: #1A1A1A;
    --text-secondary: #6B6B6B;
    --text-tertiary: #9CA3AF;
    --text-inverse: #FFFFFF;
    
    --accent-gold: #FFD700;
    --accent-gold-hover: #F0C800;
    --accent-gold-muted: rgba(255,215,0,0.10);
    --accent-gold-border: rgba(255,215,0,0.30);
    --accent-gold-deep: #9D7A39;
    
    --semantic-success: #10B981;
    --semantic-success-bg: #E6F5EC;
    --semantic-success-text: #15803D;
    --semantic-info: #3B82F6;
    --semantic-info-bg: rgba(59,130,246,0.1);
    --semantic-notification: #EF4444;
    
    --border-default: #E5E5E0;
    --border-subtle: #F0F0EE;
    
    --font-sans: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    --shadow-card: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    --shadow-hover: 0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--bg-canvas);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  @keyframes pulse-dot {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
  }

  @keyframes float-delayed {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
  }

  .live-dot {
    width: 6px;
    height: 6px;
    background-color: var(--semantic-notification);
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    background-color: var(--accent-gold);
  }

  .card-hover {
    transition: all 0.2s ease;
  }
  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
    border-color: var(--accent-gold-border);
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// --- Icons ---
const IconStore = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const IconSearch = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconStar = ({ size = 12, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "var(--accent-gold)" : "none"} stroke={filled ? "var(--accent-gold)" : "var(--border-default)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const IconCheck = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const IconGrid = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const IconActivity = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const IconSettings = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const IconBot = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const IconWorkflow = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="6" height="6" rx="1"></rect>
    <rect x="15" y="15" width="6" height="6" rx="1"></rect>
    <path d="M6 9v3a3 3 0 0 0 3 3h6"></path>
  </svg>
);

const IconPlug = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-5"></path>
    <path d="M9 8V2"></path>
    <path d="M15 8V2"></path>
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>
  </svg>
);

const IconCrown = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

// --- Mock Data ---
const MARKETPLACE_ITEMS = [
  {
    id: 1,
    name: "SEO Scanner Agent",
    creator: "by OCULOPS",
    type: "Agent",
    description: "Autonomous agent that crawls your site, identifies SEO gaps, and generates optimized meta tags.",
    rating: 4.8,
    installs: "1.2k",
    installed: false,
    icon: IconBot,
    color: "gold"
  },
  {
    id: 2,
    name: "Lead Enrichment Workflow",
    creator: "by Community",
    type: "Workflow",
    description: "Automatically enriches incoming leads with Clearbit data and scores them based on ICP fit.",
    rating: 4.5,
    installs: "850",
    installed: true,
    icon: IconWorkflow,
    color: "blue"
  },
  {
    id: 3,
    name: "Slack Integration",
    creator: "by OCULOPS",
    type: "Integration",
    description: "Connect your intelligence system to Slack for real-time alerts and command execution.",
    rating: 4.9,
    installs: "5.4k",
    installed: false,
    icon: IconPlug,
    color: "green"
  },
  {
    id: 4,
    name: "Cold Email Sequence",
    creator: "by Community",
    type: "Workflow",
    description: "Multi-step AI generated email sequence tailored to prospect industry and recent news.",
    rating: 4.2,
    installs: "320",
    installed: false,
    icon: IconWorkflow,
    color: "blue"
  },
  {
    id: 5,
    name: "Social Listener Agent",
    creator: "by OCULOPS",
    type: "Agent",
    description: "Monitors Twitter and LinkedIn for brand mentions and sentiment, alerting on anomalies.",
    rating: 4.7,
    installs: "2.1k",
    installed: false,
    icon: IconBot,
    color: "gold"
  },
  {
    id: 6,
    name: "Google Ads Connector",
    creator: "by Community",
    type: "Integration",
    description: "Sync audiences and pull performance metrics directly into your analytics dashboard.",
    rating: 4.6,
    installs: "1.8k",
    installed: false,
    icon: IconPlug,
    color: "green"
  }
];

const CATEGORIES = ["All", "Agents", "Workflows", "Integrations", "Templates"];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    margin: '4px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: active ? 'var(--bg-sidebar-active)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: active ? 500 : 400,
    fontSize: '14px',
    transition: 'all 0.2s ease'
  }}
  onMouseEnter={(e) => { if(!active) e.currentTarget.style.backgroundColor = 'var(--bg-hover-nav)' }}
  onMouseLeave={(e) => { if(!active) e.currentTarget.style.backgroundColor = 'transparent' }}
  >
    <Icon size={18} color={active ? "var(--text-primary)" : "var(--text-secondary)"} />
    {label}
  </div>
);

const CategoryPill = ({ type, color }) => {
  let bg, text;
  if (color === 'gold') { bg = 'var(--accent-gold-muted)'; text = 'var(--accent-gold-deep)'; }
  else if (color === 'blue') { bg = 'var(--semantic-info-bg)'; text = 'var(--semantic-info)'; }
  else if (color === 'green') { bg = 'var(--semantic-success-bg)'; text = 'var(--semantic-success-text)'; }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '999px',
      backgroundColor: bg,
      color: text,
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase'
    }}>
      {type}
    </div>
  );
};

const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(<IconStar key={i} filled={i < fullStars} />);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {stars}
      <span style={{ marginLeft: '4px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{rating}</span>
    </div>
  );
};

const MarketplaceGenerated = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter(item => {
      const matchesFilter = activeFilter === "All" || item.type + "s" === activeFilter;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--text-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--bg-sidebar)', borderRadius: '50%' }}></div>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.05em' }}>OCULOPS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
          <SidebarItem icon={IconGrid} label="Dashboard" active={false} />
          <SidebarItem icon={IconActivity} label="Workflows" active={false} />
          <SidebarItem icon={IconStore} label="Marketplace" active={true} />
          <SidebarItem icon={IconSettings} label="Settings" active={false} />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{
          height: '56px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconStore size={20} color="var(--text-primary)" />
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Marketplace</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="live-dot"></div>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>LIVE</span>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
              JD
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Hero Card */}
          <section style={{
            position: 'relative',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden'
          }}>
            <div className="particle" style={{ width: '6px', height: '6px', top: '20%', right: '15%', opacity: 0.3, animation: 'float 4s ease-in-out infinite' }}></div>
            <div className="particle" style={{ width: '4px', height: '4px', top: '60%', right: '10%', opacity: 0.2, animation: 'float-delayed 3s ease-in-out infinite' }}></div>
            <div className="particle" style={{ width: '8px', height: '8px', top: '40%', right: '25%', opacity: 0.15, animation: 'float 5s ease-in-out infinite' }}></div>
            <div className="particle" style={{ width: '3px', height: '3px', top: '75%', right: '20%', opacity: 0.25, animation: 'float-delayed 4.5s ease-in-out infinite' }}></div>

            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>OCULOPS Marketplace</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.5 }}>
              Extend your intelligence system with agents, workflows, and integrations. Discover tools built by OCULOPS and the community to automate your operations.
            </p>
          </section>

          {/* Filter Bar */}
          <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: activeFilter === cat ? 600 : 500,
                    cursor: 'pointer',
                    border: activeFilter === cat ? 'none' : '1px solid var(--border-default)',
                    backgroundColor: activeFilter === cat ? 'var(--accent-gold)' : 'transparent',
                    color: activeFilter === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F0F0EB',
              borderRadius: '8px',
              padding: '8px 12px',
              width: '240px'
            }}>
              <IconSearch size={14} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search marketplace..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100%',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>
          </section>

          {/* Featured Banner */}
          {(activeFilter === "All" && searchQuery === "") && (
            <section className="card-hover" style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--accent-gold-border)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: 'var(--accent-gold)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: 'var(--accent-gold-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCrown size={32} color="var(--accent-gold-deep)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Featured: Advanced Prospector Pack</h3>
                    <CategoryPill type="Bundle" color="gold" />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '500px' }}>
                    A premium collection of 3 agents and 2 workflows designed to completely automate outbound lead generation and initial qualification.
                  </p>
                </div>
              </div>
              <button style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-gold-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-gold)'}
              >
                Install Bundle
              </button>
            </section>
          )}

          {/* Grid */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            paddingBottom: '32px'
          }}>
            {filteredItems.map(item => (
              <div key={item.id} className="card-hover" style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-default)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-card)'
              }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: item.color === 'gold' ? 'var(--accent-gold-muted)' : item.color === 'blue' ? 'var(--semantic-info-bg)' : 'var(--semantic-success-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <item.icon size={24} color={item.color === 'gold' ? 'var(--accent-gold-deep)' : item.color === 'blue' ? 'var(--semantic-info)' : 'var(--semantic-success)'} />
                  </div>
                  <CategoryPill type={item.type} color={item.color} />
                </div>

                {/* Card Body */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '12px' }}>{item.creator}</span>
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <RatingStars rating={item.rating} />
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.installs} installs</span>
                  </div>
                  
                  {item.installed ? (
                    <button style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: 'var(--semantic-success-text)',
                      border: '1px solid var(--semantic-success)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'default'
                    }}>
                      <IconCheck size={12} /> Installed
                    </button>
                  ) : (
                    <button style={{
                      padding: '6px 16px',
                      backgroundColor: 'var(--accent-gold)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-gold-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-gold)'}
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No items found matching your criteria.
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default MarketplaceGenerated;