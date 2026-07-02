import React, { useState } from 'react';
import { CheckSquare, Lock, Mail, User } from 'lucide-react';
import { authApi } from '../api';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin]                   = useState(true);
  const [username, setUsername]                 = useState('');
  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [emailOrUsername, setEmailOrUsername]   = useState('');
  const [error, setError]                       = useState('');
  const [loading, setLoading]                   = useState(false);

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isLogin
        ? await authApi.login({ emailOrUsername, password })
        : await authApi.register({ username, email, password });

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = {
    position: 'absolute', left: '14px', top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)',
  };

  return (
    <div style={{
      display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 10% 20%, rgba(99,102,241,0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139,92,246,0.05) 0%, transparent 40%)',
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '440px', padding: '40px',
        boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border-color)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
          }}>
            <CheckSquare size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            {isLogin
              ? 'Manage your team tasks and personal deadlines with ease.'
              : 'Start organising your tasks in Kanban boards and shared spaces.'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--priority-high-bg)', color: 'var(--priority-high)',
            padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px',
            fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239,68,68,0.15)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconStyle} />
                <input
                  type="text" className="form-control" placeholder="johndoe"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '40px' }} required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>{isLogin ? 'Username or Email' : 'Email Address'}</label>
            <div style={{ position: 'relative' }}>
              {isLogin ? <User size={16} style={iconStyle} /> : <Mail size={16} style={iconStyle} />}
              <input
                type={isLogin ? 'text' : 'email'} className="form-control"
                placeholder={isLogin ? 'username or email' : 'john@example.com'}
                value={isLogin ? emailOrUsername : email}
                onChange={(e) => isLogin ? setEmailOrUsername(e.target.value) : setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }} required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type="password" className="form-control" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }} required
              />
            </div>
          </div>

          <button
            type="submit" className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <span style={{ color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => switchMode(false)}>Sign Up</span>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <span style={{ color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => switchMode(true)}>Sign In</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
