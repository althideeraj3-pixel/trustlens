// src/layouts/PublicLayout.jsx
// Header & footer layout for public visitor pages (Landing, Login, Register, Help).

import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../utils/translations';

const PublicLayout = ({ language, setLanguage, seniorMode, setSeniorMode }) => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const t = getTranslation(language);

  const toggleSeniorMode = () => {
    const nextMode = !seniorMode;
    setSeniorMode(nextMode);
    if (nextMode) {
      document.body.classList.add('senior-mode');
    } else {
      document.body.classList.remove('senior-mode');
    }
  };

  return (
    <div className="app-wrapper">
      {/* Top Navbar */}
      <header className="site-header" role="banner">
        <div className="site-container header-inner">
          <Link to="/" className="brand-anchor" aria-label="TrustLens Home">
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">TrustLens</span>
              <span className="brand-tag">{t.brandTag}</span>
            </div>
          </Link>

          <div className="header-actions">
            {/* Senior Mode Toggle */}
            <button
              type="button"
              onClick={toggleSeniorMode}
              className={`btn-toggle-senior ${seniorMode ? 'active' : ''}`}
              title={t.seniorView}
            >
              <span>👴</span>
              <span>{seniorMode ? t.seniorViewActive : t.seniorView}</span>
            </button>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
              aria-label={t.app.languageLabel}
            >
              <option value="en">EN (English)</option>
              <option value="te">TE (తెలుగు)</option>
              <option value="hi">HI (हिन्दी)</option>
            </select>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to={isAdmin ? "/admin" : "/app/dashboard"} className="btn-analyze" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                  {isAdmin ? `${t.app.adminConsole} →` : `${t.app.goDashboard} →`}
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/'); }}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                >
                  {t.app.logout}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/login" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
                  {t.app.signIn}
                </Link>
                <Link to="/register" className="btn-analyze" style={{ padding: '0.4rem 0.95rem', fontSize: '0.85rem' }}>
                  {t.app.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <Outlet />

      {/* Footer */}
      <footer className="site-footer" role="contentinfo">
        <div className="site-container footer-inner">
          <div>
            <span className="footer-brand">🛡️ TrustLens</span> — {t.heroTagline}
            <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              {t.footerTagline}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem' }}>
            <span>{t.nationalHelpline} <strong style={{ color: '#f59e0b' }}>1930</strong></span>
            <span>{t.portal} <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>cybercrime.gov.in</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
