import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, CheckSquare, Users, Moon, Sun } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Teams from './components/Teams';
import { authApi } from './api';

function App() {
  const [user, setUser]           = useState(null);
  const [token, setToken]         = useState(localStorage.getItem('token') || '');
  const [theme, setTheme]         = useState(localStorage.getItem('theme') || 'light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading]     = useState(true);

  // Verify the stored token on first load; clear it if it has expired
  useEffect(() => {
    const verifySession = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const userData = await authApi.getMe(token);
        setUser(userData);
      } catch {
        // Token expired or invalid — log the user out silently
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
        fontSize: '1.25rem', fontWeight: 600,
      }}>
        Loading Task Manager...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="app-navbar">
        <div className="nav-logo" onClick={() => setActiveTab('dashboard')}>
          <CheckSquare size={24} style={{ color: 'var(--accent-color)' }} />
          <span>TaskFlow</span>
        </div>

        <div className="nav-links">
          {[
            { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { key: 'tasks',     icon: <CheckSquare size={18} />,     label: 'Tasks'     },
            { key: 'teams',     icon: <Users size={18} />,           label: 'Teams'     },
          ].map(({ key, icon, label }) => (
            <div
              key={key}
              className={`nav-link ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="user-profile-menu">
            <div className="avatar">{user.username.substring(0, 2).toUpperCase()}</div>
            <span style={{ color: 'var(--text-secondary)' }}>{user.username}</span>
            <button
              className="btn-secondary"
              onClick={handleLogout}
              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard token={token} setActiveTab={setActiveTab} />}
        {activeTab === 'tasks'     && <Tasks     token={token} />}
        {activeTab === 'teams'     && <Teams     token={token} currentUser={user} />}
      </main>
    </div>
  );
}

export default App;
