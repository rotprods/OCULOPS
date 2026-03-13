import React, { useState, useMemo } from 'react';

const TeamSettingsGenerated = () => {
  // --- MOCK DATA ---
  const kpis = [
    { label: 'TEAM MEMBERS', value: '1', highlight: true },
    { label: 'ROLES CONFIGURED', value: '4', highlight: false },
    { label: 'ADMIN ACCESS', value: 'Active', highlight: false },
  ];

  const teamMembers = [
    {
      id: 1,
      name: 'Roberto Ortega',
      initials: 'RO',
      email: 'roberto@company.com',
      role: 'Owner',
      status: 'Active',
      lastActive: 'Just now',
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      initials: 'SJ',
      email: 'sarah.j@company.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2 hours ago',
    },
    {
      id: 3,
      name: 'David Chen',
      initials: 'DC',
      email: 'd.chen@company.com',
      role: 'Member',
      status: 'Offline',
      lastActive: 'Yesterday',
    },
  ];

  const roles = ['Owner', 'Admin', 'Member', 'Viewer'];
  const permissions = [
    'Manage Agents',
    'Edit CRM',
    'View Reports',
    'Billing Access',
    'Settings',
  ];

  const matrixData = {
    'Owner': [true, true, true, true, true],
    'Admin': [true, true, true, false, true],
    'Member': [false, true, true, false, false],
    'Viewer': [false, false, true, false, false],
  };

  // --- STYLES ---
  const cssVariables = `
    :root {
      --bg-canvas: #FAFAF8;
      --bg-sidebar: #F5F0E8;
      --bg-card: #FFFFFF;
      --bg-input: #F0F0EB;
      --bg-hover: #FDFDFD;
      
      --text-primary: #1A1A1A;
      --text-secondary: #6B6B6B;
      --text-tertiary: #9CA3AF;
      --text-inverse: #FFFFFF;
      
      --accent-gold: #FFD700;
      --accent-gold-hover: #F0C800;
      --accent-gold-muted: rgba(255,215,0,0.15);
      --accent-gold-border: rgba(255,215,0,0.30);
      
      --border-default: #E5E5E0;
      --border-subtle: #F0F0EE;
      
      --semantic-success: #10B981;
      --semantic-success-bg: #E6F5EC;
      --semantic-success-text: #008F39;
      
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      
      --shadow-card: 0 2px 8px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04);
      --radius-card: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
    }

    @keyframes breathe {
      0%, 100% { opacity: 0.4; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    @keyframes pulse-gold {
      0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }

    .breathing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--accent-gold);
      animation: breathe 3s ease-in-out infinite, pulse-gold 3s infinite;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--semantic-success);
      margin-right: 6px;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-card);
      padding: 24px;
      box-shadow: var(--shadow-card);
    }

    .input-field {
      background: var(--bg-input);
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 0 16px;
      height: 40px;
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--text-primary);
      outline: none;
      transition: all 0.2s ease;
    }
    
    .input-field:focus {
      border-color: var(--accent-gold);
      background: var(--bg-card);
    }

    .btn-gold {
      background: var(--accent-gold);
      color: var(--text-primary);
      border: none;
      border-radius: 8px;
      padding: 0 20px;
      height: 40px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s ease;
      font-family: var(--font-sans);
    }

    .btn-gold:hover {
      background: var(--accent-gold-hover);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-ghost:hover {
      background: var(--bg-input);
      color: var(--text-primary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 12px 16px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      border-bottom: 1px solid var(--border-default);
      font-weight: 600;
    }

    td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background-color: var(--bg-hover);
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-owner { background: var(--accent-gold-muted); color: #9D7A39; }
    .role-admin { background: #EBF5FF; color: #1E40AF; }
    .role-member { background: #F3F4F6; color: #4B5563; }
    .role-viewer { background: #F9FAFB; color: #9CA3AF; }

    .status-active { color: var(--semantic-success-text); }
    .status-offline { color: var(--text-tertiary); }
    
    .status-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .status-dot.active { background-color: var(--semantic-success); }
    .status-dot.offline { background-color: var(--text-tertiary); }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D1D1D1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #A8A8A8; }
  `;

  // --- ICONS ---
  const IconUsers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  const IconSearch = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--border-default)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <>
      <style>{cssVariables}</style>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <aside style={{ 
          width: '240px', 
          backgroundColor: 'var(--bg-sidebar)', 
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 8px' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--text-primary)', borderRadius: '4px' }}></div>
            <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>OS.CORE</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {['Dashboard', 'Agents', 'Knowledge Base', 'Workflows'].map(item => (
              <div key={item} style={{ 
                padding: '8px 12px', 
                fontSize: '14px', 
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                {item}
              </div>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ padding: '8px 12px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', fontWeight: 600 }}>Settings</div>
            <div style={{ 
              padding: '8px 12px', 
              fontSize: '14px', 
              color: 'var(--text-primary)',
              backgroundColor: '#EBE4D8', // Active hover state from DNA
              borderRadius: '6px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconUsers />
              Team
            </div>
            <div style={{ padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '6px' }}>Billing</div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
          
          {/* HEADER */}
          <header style={{ 
            height: '56px', 
            borderBottom: '1px solid var(--border-default)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 32px',
            backgroundColor: 'var(--bg-canvas)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--text-secondary)' }}><IconUsers /></div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Team Settings</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '20px' }}>
                <IconSearch />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '120px', fontFamily: 'var(--font-sans)' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                <span className="live-dot"></span>
                LIVE
              </div>
            </div>
          </header>

          {/* SCROLLABLE AREA */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HERO CARD */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.02em' }}>Team Management</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage team members, roles, and permissions</p>
              </div>
              <div className="breathing-dot"></div>
            </div>

            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {kpis.map((kpi, i) => (
                <div key={i} className="card" style={{ 
                  padding: '20px', 
                  borderColor: kpi.highlight ? 'var(--accent-gold-border)' : 'var(--border-default)',
                  boxShadow: kpi.highlight ? '0 0 15px rgba(255,215,0,0.05)' : 'var(--shadow-card)'
                }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 600 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: kpi.highlight ? 'var(--font-sans)' : 'var(--font-mono)' }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* TEAM MEMBERS TABLE */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            backgroundColor: member.role === 'Owner' ? 'var(--accent-gold-muted)' : '#F0F0EE',
                            color: member.role === 'Owner' ? '#9D7A39' : 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 600
                          }}>
                            {member.initials}
                          </div>
                          <span style={{ fontWeight: 600 }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{member.email}</td>
                      <td>
                        <span className={`role-pill role-${member.role.toLowerCase()}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                          <span className={`status-dot ${member.status.toLowerCase()}`}></span>
                          <span className={`status-${member.status.toLowerCase()}`}>{member.status}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{member.lastActive}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-ghost" style={{ marginRight: '8px' }}>Edit</button>
                        <button className="btn-ghost" style={{ color: '#EF4444' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* INVITE SECTION */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Invite Team Member</h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="team@company.com" 
                  style={{ flex: 1 }}
                />
                <select className="input-field" style={{ width: '160px', appearance: 'none', cursor: 'pointer' }}>
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <button className="btn-gold">Send Invite</button>
              </div>
            </div>

            {/* PERMISSIONS MATRIX */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Permissions Matrix</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Permission</th>
                    {roles.map(role => (
                      <th key={role} style={{ textAlign: 'center' }}>{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission, index) => (
                    <tr key={permission}>
                      <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{permission}</td>
                      {roles.map(role => (
                        <td key={`${role}-${permission}`} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {matrixData[role][index] ? <IconCheck /> : <IconX />}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default TeamSettingsGenerated;