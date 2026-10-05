// src/pages/public/Login.jsx
// Production-grade login view with pre-configured demo account buttons for fast evaluation.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const Login = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.loginRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.message || t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="brand-icon" style={{ margin: '0 auto 0.75rem auto', width: '42px', height: '42px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="auth-title">{t.loginTitle}</h1>
          <p className="auth-subtitle">{t.loginDesc}</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder={t.loginEmailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">{t.password}</label>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none' }}>
                {t.forgotPassword}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-analyze"
            style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
            disabled={loading}
          >
            {loading ? t.authenticating : t.signIn}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.noAccount}{' '}
          <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            {t.registerNow}
          </Link>
        </div>

        {/* 1-Click Demo Accounts for seamless evaluator access */}
        <div className="demo-accounts-box">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.demoCredentials}
          </span>
          <button
            type="button"
            className="demo-account-btn"
            onClick={() => handleFillDemo('admin@trustlens.ai', 'Admin@12345')}
          >
            <div>
              <strong style={{ color: '#f87171' }}>{t.adminConsole}:</strong> admin@trustlens.ai
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.fillDemoAdmin} →</span>
          </button>

          <button
            type="button"
            className="demo-account-btn"
            onClick={() => handleFillDemo('user@trustlens.ai', 'User@12345')}
          >
            <div>
              <strong style={{ color: '#38bdf8' }}>{t.userWorkspace}:</strong> user@trustlens.ai
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.fillDemoUser} →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
