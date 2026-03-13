import React, { useState } from 'react';

const SettingsGenerated = () => {
  const [autoRun, setAutoRun] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [agentAlerts, setAgentAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // SVG Icons
  const IconGear = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const IconDashboard = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  );

  const IconAgents = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 18a2 2 0 0 1-2-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2zm0-9a2 2 0 0 1-2-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2zm-9 0a2 2 0 0 1-2-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2zm18 0a2 2 0 0 1-2-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2z"></path>
    </svg>
  );

  const Toggle = ({ checked, onChange }) => (
    <div
      onClick={onChange}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        background: checked ? 'var(--accent-gold)' : 'var(--border-default)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#FFFFFF',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );

  const InputGroup = ({ label, value, type = "text", options = [] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ 
        fontSize: '12px', 
        color: 'var(--text-secondary)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        fontWeight: 500
      }}>
        {label}
      </label>
      {type === 'select' ? (
        <div style={{ position: 'relative' }}>
          <select style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-input)',
            border: '1px solid transparent',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
            appearance: 'none',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      ) : (
        <input 
          type={type} 
          defaultValue={value}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-input)',
            border: '1px solid transparent',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: 'var(--bg-canvas)', 
      fontFamily: 'var(--font-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        
        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-input: #F0F0EB;
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --accent-gold: #FFD700;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-deep: #9D7A39;
          --border-default: #E5E5E0;
          --semantic-success: #10B981;
          --font-primary: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        input:focus, select:focus {
          border-color: var(--accent-gold) !important;
        }

        @keyframes breathe {
          0% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
          100% { opacity: 0.4; transform: scale(0.95); }
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
        }

        .nav-item:hover {
          background: rgba(0,0,0,0.04);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(0,0,0,0.04);
          color: var(--text-primary);
        }

        .settings-nav-item {
          padding: 10px 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 40px;
          display: flex;
          align-items: center;
        }

        .settings-nav-item:hover {
          background: rgba(0,0,0,0.02);
        }

        .settings-nav-item.active {
          background: var(--accent-gold-muted);
          color: var(--accent-gold-deep);
          font-weight: 600;
        }

        .btn-primary {
          background: var(--accent-gold);
          color: #1A1A1A;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          font-family: var(--font-primary);
        }

        .btn-primary:hover {
          background: #F0C800;
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
          font-family: var(--font-primary);
        }

        .btn-ghost:hover {
          color: var(--text-primary);
        }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ 
        width: '240px', 
        background: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px'
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 600, 
          letterSpacing: '0.1em', 
          marginBottom: '40px',
          paddingLeft: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--text-primary)', borderRadius: '4px' }} />
          OCULOPS
        </div>

        <div style={{ flex: 1 }}>
          <div className="nav-item">
            <IconDashboard /> Dashboard
          </div>
          <div className="nav-item">
            <IconAgents /> Agents
          </div>
        </div>

        <div>
          <div className="nav-item active">
            <IconGear /> Settings
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER */}
        <div style={{ 
          height: '56px', 
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'var(--bg-canvas)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}><IconGear /></span>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Settings</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--text-tertiary)',
              background: 'var(--bg-card)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-default)',
              fontSize: '13px'
            }}>
              <IconSearch />
              <span>Search settings...</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'var(--semantic-success)',
                animation: 'breathe 2s infinite ease-in-out'
              }} />
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                letterSpacing: '0.1em', 
                color: 'var(--text-secondary)' 
              }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ 
          flex: 1, 
          padding: '40px 32px', 
          display: 'flex', 
          gap: '40px',
          overflowY: 'auto'
        }}>
          
          {/* SETTINGS NAV */}
          <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {['General', 'Integrations', 'Notifications', 'Security', 'API Keys', 'Data & Privacy', 'Appearance'].map((item) => (
              <div key={item} className={`settings-nav-item ${item === 'General' ? 'active' : ''}`}>
                {item}
              </div>
            ))}
          </div>

          {/* SETTINGS PANEL */}
          <div style={{ 
            flex: 1, 
            maxWidth: '800px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-default)',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>General Settings</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <InputGroup label="Organization Name" value="OCULOPS" />
              <InputGroup label="Timezone" type="select" options={['Europe/Madrid', 'America/New_York', 'Asia/Tokyo']} />
              <InputGroup label="Language" type="select" options={['Español', 'English', 'Français']} />
              <InputGroup label="Currency" type="select" options={['EUR €', 'USD $', 'GBP £']} />
            </div>

            <div style={{ height: '1px', background: 'var(--border-default)', margin: '32px 0' }} />

            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Agent Configuration</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ width: '50%' }}>
                <InputGroup label="Default AI Model" type="select" options={['GPT-4o', 'Claude 3.5 Sonnet', 'Llama 3']} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Auto-run agents</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Allow agents to execute tasks automatically based on triggers.</div>
                </div>
                <Toggle checked={autoRun} onChange={() => setAutoRun(!autoRun)} />
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Agent execution interval</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ flex: 1, height: '4px', background: 'var(--border-default)', borderRadius: '2px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '25%', background: 'var(--accent-gold)', borderRadius: '2px' }} />
                    <div style={{ 
                      position: 'absolute', 
                      left: '25%', 
                      top: '50%', 
                      transform: 'translate(-50%, -50%)', 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      background: '#FFFFFF', 
                      border: '2px solid var(--accent-gold)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', textAlign: 'right' }}>Every 6 hours</span>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-default)', margin: '32px 0' }} />

            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Notifications</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Email notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Receive daily summaries and critical alerts via email.</div>
                </div>
                <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Agent alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Notify me when an agent encounters an error or requires input.</div>
                </div>
                <Toggle checked={agentAlerts} onChange={() => setAgentAlerts(!agentAlerts)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Weekly digest</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>A comprehensive report of all system activities sent every Monday.</div>
                </div>
                <Toggle checked={weeklyDigest} onChange={() => setWeeklyDigest(!weeklyDigest)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '48px' }}>
              <button className="btn-ghost">Discard</button>
              <button className="btn-primary">Save Changes</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsGenerated;