import React, { useState, useEffect } from 'react';

const CommandCenterGenerated = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'Command Center', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', active: true },
    { name: 'Agent Fleet', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { name: 'Knowledge Graph', icon: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3' },
    { name: 'Event Bus', icon: 'M4 6h16 M4 12h16 M4 18h16' },
    { name: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' },
  ];

  const systemStatus = [
    { name: 'Supabase DB', status: 'Healthy', color: '#10B981' },
    { name: 'Edge Functions', status: '31 Active', color: '#10B981' },
    { name: 'n8n Cloud', status: 'Connected', color: '#10B981' },
    { name: 'Vercel', status: 'Deployed', color: '#10B981' },
    { name: 'Agent Fleet', status: '7/7 Online', color: '#10B981' },
    { name: 'Event Bus', status: 'Streaming', color: '#10B981' },
  ];

  const events = [
    { id: 1, time: '14:32:01.442', type: 'agent.completed', label: 'AGENT', desc: 'Market analysis agent finished execution', color: '#B29600', bg: 'rgba(255,215,0,0.15)' },
    { id: 2, time: '14:31:55.019', type: 'deal.stage_changed', label: 'DEAL', desc: 'Project Apollo moved to Negotiation', color: '#15803D', bg: '#E6F5EC' },
    { id: 3, time: '14:30:12.881', type: 'signal.detected', label: 'SIGNAL', desc: 'High intent signal detected from Acme Corp', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { id: 4, time: '14:28:45.102', type: 'system.info', label: 'SYSTEM', desc: 'Database backup completed successfully', color: '#6B6B6B', bg: '#F0F0EE' },
    { id: 5, time: '14:25:00.000', type: 'agent.error', label: 'ERROR', desc: 'Scraper agent timed out on target URL', color: '#B91C1C', bg: '#FEF2F2' },
    { id: 6, time: '14:20:11.334', type: 'agent.started', label: 'AGENT', desc: 'Lead enrichment agent initialized', color: '#B29600', bg: 'rgba(255,215,0,0.15)' },
    { id: 7, time: '14:15:05.991', type: 'system.info', label: 'SYSTEM', desc: 'Edge function cache invalidated', color: '#6B6B6B', bg: '#F0F0EE' },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#FAFAF8',
      fontFamily: "'Inter', sans-serif",
      color: '#1A1A1A',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        @keyframes pulse-gold {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes breathe {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E5E0;
          border-radius: 10px;
        }
        
        .card-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: '240px',
        backgroundColor: '#F5F0E8',
        borderRight: '1px solid #E5E5E0',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          letterSpacing: '0.1em', 
          color: '#1A1A1A',
          marginBottom: '40px',
          paddingLeft: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '16px', height: '16px', backgroundColor: '#1A1A1A', borderRadius: '2px' }}></div>
          OCULOPS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: item.active ? '#EBE4D8' : 'transparent',
              color: item.active ? '#1A1A1A' : '#6B6B6B',
              fontWeight: item.active ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{
          height: '56px',
          borderBottom: '1px solid #E5E5E0',
          backgroundColor: '#FAFAF8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A' }}>Command Center</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#9CA3AF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text" 
                placeholder="Search systems..." 
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E0',
                  borderRadius: '6px',
                  padding: '6px 12px 6px 32px',
                  fontSize: '13px',
                  width: '200px',
                  outline: 'none',
                  color: '#1A1A1A',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#EF4444',
                borderRadius: '50%',
                animation: 'pulse-red 2s infinite'
              }}></div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B6B6B', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Hero Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(255,215,0,0.30)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                OCULOPS Command Center
              </h1>
              <div style={{ fontSize: '12px', color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>99.97% UPTIME</span>
                <span>|</span>
                <span>45d 12h since last incident</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', letterSpacing: '0.05em' }}>ALL SYSTEMS OPERATIONAL</span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: "'JetBrains Mono', monospace" }}>
                  {currentTime.toISOString().replace('T', ' ').substring(0, 23)} UTC
                </span>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                boxShadow: '0 0 20px rgba(255,215,0,0.3)',
                animation: 'pulse-gold 3s infinite, breathe 4s ease-in-out infinite',
                border: '2px solid rgba(255,255,255,0.8)'
              }}></div>
            </div>
          </div>

          {/* System Status Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px'
          }}>
            {systemStatus.map((sys, idx) => (
              <div key={idx} className="card-hover" style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #F0F0EE',
                borderRadius: '8px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sys.color }}></div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#1A1A1A', textAlign: 'center' }}>{sys.name}</div>
                <div style={{ fontSize: '11px', color: '#6B6B6B' }}>{sys.status}</div>
              </div>
            ))}
          </div>

          {/* Event Stream */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E5E5E0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            height: '300px'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F0F0EE',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.8)' }}></div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>Live Event Stream</h2>
            </div>
            
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', position: 'relative' }}>
              {/* Vertical Line */}
              <div style={{
                position: 'absolute',
                left: '23px',
                top: '24px',
                bottom: '24px',
                width: '1px',
                backgroundColor: 'rgba(255,215,0,0.15)',
                zIndex: 0
              }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                {events.map((evt, idx) => (
                  <div key={evt.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    backgroundColor: idx === 0 ? '#FDFDFD' : 'transparent',
                    padding: idx === 0 ? '8px' : '0 8px',
                    borderRadius: '6px',
                    marginLeft: '-8px',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <div style={{ 
                      width: '7px', 
                      height: '7px', 
                      borderRadius: '50%', 
                      backgroundColor: evt.color, 
                      marginTop: '6px',
                      boxShadow: idx === 0 ? `0 0 8px ${evt.color}` : 'none',
                      border: '1px solid #FFF'
                    }}></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{ 
                        fontFamily: "'JetBrains Mono', monospace", 
                        fontSize: '11px', 
                        color: '#9CA3AF',
                        width: '90px',
                        flexShrink: 0
                      }}>
                        {evt.time}
                      </span>
                      
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        letterSpacing: '0.08em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: evt.bg,
                        color: evt.color,
                        width: '56px',
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        {evt.label}
                      </span>
                      
                      <span style={{ fontSize: '13px', color: idx === 0 ? '#1A1A1A' : '#6B6B6B', fontWeight: idx === 0 ? '500' : '400' }}>
                        {evt.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Monitor & Actions */}
          <div style={{ display: 'flex', gap: '24px' }}>
            
            {/* Resource Monitor */}
            <div style={{
              flex: 2,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              {/* DB Load */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E5E0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Load</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A' }}>12<span style={{ fontSize: '16px', color: '#9CA3AF' }}>%</span></div>
                  <svg width="80" height="40" viewBox="0 0 80 40">
                    <path d="M 5 35 A 35 35 0 0 1 75 35" fill="none" stroke="#F0F0EE" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 5 35 A 35 35 0 0 1 25 10" fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* API Calls */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E5E0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Calls Today</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A' }}>2,847</div>
                  <svg width="80" height="30" viewBox="0 0 80 30">
                    <polyline points="0,25 15,20 30,28 45,10 60,15 80,5" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx="80" cy="5" r="3" fill="#FFD700" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E5E0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>System Actions</div>
              
              <button style={{
                backgroundColor: '#FFD700',
                color: '#1A1A1A',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Run Diagnostics
              </button>
              
              <button style={{
                backgroundColor: 'transparent',
                color: '#1A1A1A',
                border: '1px solid #E5E5E0',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                View Full Logs
              </button>
              
              <button style={{
                backgroundColor: 'transparent',
                color: '#EF4444',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: 'auto',
                transition: 'background-color 0.2s'
              }}>
                Emergency Shutdown
              </button>
            </div>

          </div>
          
          {/* Bottom padding spacer */}
          <div style={{ height: '24px', flexShrink: 0 }}></div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterGenerated;