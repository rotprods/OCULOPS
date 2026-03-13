import React, { useState, useMemo, useEffect, useRef } from 'react';

const MOCK_USERS = {
  1: { id: 1, name: 'Eleanor Vance', role: 'Chief Financial Officer', avatar: 'EV', status: 'online' },
  2: { id: 2, name: 'Marcus Sterling', role: 'Head of Operations', avatar: 'MS', status: 'offline', lastSeen: '2h ago' },
  3: { id: 3, name: 'Sophia Chen', role: 'Lead Analyst', avatar: 'SC', status: 'online' },
  4: { id: 4, name: 'Julian Thorne', role: 'Legal Counsel', avatar: 'JT', status: 'busy' },
  5: { id: 5, name: 'Aria Montgomery', role: 'Product Director', avatar: 'AM', status: 'offline', lastSeen: '1d ago' },
};

const MOCK_CONVERSATIONS = [
  { id: 101, userId: 1, unread: 2, lastMessage: 'The Q3 projections look solid. Let\'s review tomorrow.', timestamp: '10:42 AM' },
  { id: 102, userId: 2, unread: 0, lastMessage: 'I have uploaded the revised contracts to the vault.', timestamp: 'Yesterday' },
  { id: 103, userId: 3, unread: 0, lastMessage: 'Can you check the anomaly in the European dataset?', timestamp: 'Yesterday' },
  { id: 104, userId: 4, unread: 5, lastMessage: 'Pending your approval on the merger compliance doc.', timestamp: 'Tuesday' },
  { id: 105, userId: 5, unread: 0, lastMessage: 'Design system updates are live.', timestamp: 'Monday' },
];

const MOCK_MESSAGES = {
  101: [
    { id: 1, senderId: 1, text: 'Good morning. Have you had a chance to look at the preliminary Q3 numbers?', timestamp: '10:15 AM' },
    { id: 2, senderId: 'me', text: 'Morning Eleanor. Yes, I was just reviewing them. The margins in APAC are higher than anticipated.', timestamp: '10:22 AM' },
    { id: 3, senderId: 1, text: 'Exactly. I think the new routing algorithm is paying off.', timestamp: '10:25 AM' },
    { id: 4, senderId: 1, text: 'The Q3 projections look solid. Let\'s review tomorrow.', timestamp: '10:42 AM' },
  ],
  102: [
    { id: 1, senderId: 2, text: 'Are we still on for the vendor sync at 2?', timestamp: 'Yesterday, 1:00 PM' },
    { id: 2, senderId: 'me', text: 'Yes, I have the brief ready.', timestamp: 'Yesterday, 1:15 PM' },
    { id: 3, senderId: 2, text: 'I have uploaded the revised contracts to the vault.', timestamp: 'Yesterday, 4:30 PM' },
  ]
};

const MessagingGenerated = () => {
  const [activeChatId, setActiveChatId] = useState(101);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const messagesEndRef = useRef(null);

  const activeConversation = useMemo(() => MOCK_CONVERSATIONS.find(c => c.id === activeChatId), [activeChatId]);
  const activeUser = useMemo(() => activeConversation ? MOCK_USERS[activeConversation.userId] : null, [activeConversation]);
  const currentMessages = useMemo(() => messages[activeChatId] || [], [messages, activeChatId]);

  const filteredConversations = useMemo(() => {
    return MOCK_CONVERSATIONS.filter(conv => {
      const user = MOCK_USERS[conv.userId];
      return user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, activeChatId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      senderId: 'me',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));
    setInputValue('');
  };

  return (
    <div className="messaging-container">
      <style>{`
        :root {
          --bg-canvas: #FAFAF8;
          --bg-sidebar: #F5F0E8;
          --bg-card: #FFFFFF;
          --bg-input: #FAFAF8;
          --bg-hover-row: #FDFDFD;
          --bg-hover-nav: rgba(0,0,0,0.04);
          
          --text-primary: #1A1A1A;
          --text-secondary: #6B6B6B;
          --text-tertiary: #9CA3AF;
          --text-inverse: #FFFFFF;
          --text-muted-label: #99948D;
          
          --accent-gold: #FFD700;
          --accent-gold-hover: #F0C800;
          --accent-gold-muted: rgba(255,215,0,0.10);
          --accent-gold-border: rgba(255,215,0,0.30);
          
          --semantic-success: #10B981;
          --semantic-error: #EF4444;
          --semantic-notification: #EF4444;
          
          --border-default: #E5E5E0;
          --border-subtle: #F0F0EE;
          
          --font-primary: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          
          --shadow-card: 0 2px 8px rgba(0,0,0,0.05);
          --shadow-input: 0 1px 3px rgba(0,0,0,0.02);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .messaging-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: var(--bg-canvas);
          font-family: var(--font-primary);
          color: var(--text-primary);
          overflow: hidden;
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
          background: var(--border-default);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }

        /* Animations */
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          border: 2px solid var(--bg-card);
        }
        .status-dot.online {
          background-color: var(--semantic-success);
          animation: breathe 3s infinite ease-in-out;
        }
        .status-dot.offline { background-color: var(--text-tertiary); }
        .status-dot.busy { background-color: var(--semantic-error); }

        /* Sidebar Styles */
        .sidebar {
          width: 340px;
          background-color: var(--bg-card);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          z-index: 10;
          box-shadow: 1px 0 15px rgba(0,0,0,0.02);
        }

        .sidebar-header {
          padding: 24px 20px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .sidebar-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background-color: var(--bg-hover-nav);
          color: var(--text-primary);
        }

        .search-container {
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          font-family: var(--font-primary);
          font-size: 13px;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: var(--accent-gold-border);
          background-color: var(--bg-card);
          box-shadow: 0 0 0 3px var(--accent-gold-muted);
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          width: 14px;
          height: 14px;
        }

        .conversation-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .conversation-item {
          display: flex;
          padding: 12px 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }
        .conversation-item:hover {
          background-color: var(--bg-hover-row);
        }
        .conversation-item.active {
          background-color: var(--bg-sidebar);
        }
        .conversation-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: var(--accent-gold);
        }

        .avatar-container {
          position: relative;
          margin-right: 12px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-canvas);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .avatar-status {
          position: absolute;
          bottom: 0;
          right: 0;
        }

        .conv-details {
          flex: 1;
          min-width: 0;
        }
        .conv-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }
        .conv-name {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conv-time {
          font-size: 11px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }
        .conv-snippet-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .conv-snippet {
          font-size: 13px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 8px;
        }
        .unread-badge {
          background-color: var(--semantic-notification);
          color: var(--text-inverse);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        /* Main Chat Area */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-canvas);
        }

        .chat-header {
          height: 72px;
          background-color: var(--bg-card);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          z-index: 5;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
        }
        .chat-header-text {
          margin-left: 12px;
        }
        .chat-header-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .chat-header-role {
          font-size: 12px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-header-actions {
          display: flex;
          gap: 12px;
        }
        .action-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }
        .btn-outline:hover {
          background: var(--bg-hover-row);
          border-color: var(--text-tertiary);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 70%;
          animation: slideUp 0.3s ease-out forwards;
        }
        .message-wrapper.me {
          align-self: flex-end;
          align-items: flex-end;
        }
        .message-wrapper.them {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
        }
        .message-wrapper.me .message-bubble {
          background-color: var(--text-primary);
          color: var(--text-inverse);
          border-bottom-right-radius: 4px;
        }
        .message-wrapper.them .message-bubble {
          background-color: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          border-bottom-left-radius: 4px;
          box-shadow: var(--shadow-input);
        }

        .message-time {
          font-size: 10px;
          color: var(--text-tertiary);
          margin-top: 4px;
          font-family: var(--font-mono);
        }

        .date-divider {
          text-align: center;
          margin: 24px 0;
          position: relative;
        }
        .date-divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background-color: var(--border-subtle);
          z-index: 1;
        }
        .date-divider span {
          background-color: var(--bg-canvas);
          padding: 0 12px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted-label);
          position: relative;
          z-index: 2;
          font-weight: 500;
        }

        /* Input Area */
        .input-area {
          padding: 20px 24px;
          background-color: var(--bg-canvas);
        }
        .input-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: flex-end;
          box-shadow: var(--shadow-card);
          transition: border-color 0.2s;
        }
        .input-card:focus-within {
          border-color: var(--accent-gold-border);
          box-shadow: 0 0 0 3px var(--accent-gold-muted);
        }

        .attach-btn {
          padding: 8px;
          color: var(--text-tertiary);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 6px;
        }
        .attach-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover-nav);
        }

        .message-input {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          padding: 8px 12px;
          font-family: var(--font-primary);
          font-size: 14px;
          color: var(--text-primary);
          max-height: 120px;
          min-height: 40px;
        }
        .message-input:focus {
          outline: none;
        }
        .message-input::placeholder {
          color: var(--text-tertiary);
        }

        .send-btn {
          background-color: var(--accent-gold);
          color: var(--text-primary);
          border: none;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-left: 8px;
        }
        .send-btn:hover {
          background-color: var(--accent-gold-hover);
        }
        .send-btn:disabled {
          background-color: var(--border-default);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }

        /* SVG Icons */
        svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            Messages
            <button className="icon-btn" aria-label="New Message">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="conversation-list">
          {filteredConversations.map(conv => {
            const user = MOCK_USERS[conv.userId];
            const isActive = activeChatId === conv.id;
            return (
              <div 
                key={conv.id} 
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveChatId(conv.id)}
              >
                <div className="avatar-container">
                  <div className="avatar">{user.avatar}</div>
                  <div className={`status-dot avatar-status ${user.status}`}></div>
                </div>
                <div className="conv-details">
                  <div className="conv-header">
                    <span className="conv-name" style={{ fontWeight: conv.unread > 0 ? 600 : 500 }}>{user.name}</span>
                    <span className="conv-time" style={{ color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{conv.timestamp}</span>
                  </div>
                  <div className="conv-snippet-row">
                    <span className="conv-snippet" style={{ color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unread > 0 ? 500 : 400 }}>
                      {conv.lastMessage}
                    </span>
                    {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        {activeUser ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="avatar-container">
                  <div className="avatar" style={{ backgroundColor: 'var(--bg-canvas)' }}>{activeUser.avatar}</div>
                </div>
                <div className="chat-header-text">
                  <div className="chat-header-name">{activeUser.name}</div>
                  <div className="chat-header-role">
                    <div className={`status-dot ${activeUser.status}`}></div>
                    {activeUser.status === 'online' ? 'Online' : activeUser.lastSeen || activeUser.status}
                    <span style={{ margin: '0 4px', color: 'var(--border-default)' }}>|</span>
                    {activeUser.role}
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="action-btn btn-outline">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </button>
                <button className="icon-btn" aria-label="More info">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </button>
              </div>
            </div>

            <div className="messages-container">
              <div className="date-divider"><span>Today</span></div>
              
              {currentMessages.map((msg) => {
                const isMe = msg.senderId === 'me';
                return (
                  <div key={msg.id} className={`message-wrapper ${isMe ? 'me' : 'them'}`}>
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                    <div className="message-time">{msg.timestamp}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <form className="input-card" onSubmit={handleSendMessage}>
                <button type="button" className="attach-btn" aria-label="Attach file">
                  <svg viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <textarea 
                  className="message-input" 
                  placeholder="Type a message..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                />
                <button type="submit" className="send-btn" disabled={!inputValue.trim()} aria-label="Send message">
                  <svg viewBox="0 0 24 24" style={{ strokeWidth: 2.5, width: 16, height: 16 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingGenerated;