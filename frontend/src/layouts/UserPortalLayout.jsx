// src/layouts/UserPortalLayout.jsx
// SaaS dashboard layout with sidebar navigation, user profile status, and quick tools.

import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../utils/translations';

const UserPortalLayout = ({ language, setLanguage, seniorMode, setSeniorMode }) => {
  const { user, isAdmin, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="portal-layout">
      {/* Sidebar */}
      <aside className="portal-sidebar" aria-label={t.app.userNavigation}>
        <div className="sidebar-brand-wrap">
          <Link to="/app/dashboard" className="brand-anchor">
            <div className="brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">TrustLens</span>
              <span className="brand-tag">{t.app.userWorkspace}</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink to="/app/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>{t.app.dashboard}</span>
          </NavLink>

          <NavLink to="/app/analyze" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{t.app.scanner}</span>
          </NavLink>

          <NavLink to="/app/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>{t.app.savedReports}</span>
          </NavLink>

          <NavLink to="/app/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{t.app.scanHistory}</span>
          </NavLink>

          <NavLink to="/app/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{t.app.profile}</span>
          </NavLink>

          <NavLink to="/app/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{t.app.preferences}</span>
          </NavLink>

          <NavLink to="/app/help" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{t.app.help}</span>
          </NavLink>

          {/* Admin Switcher if role is admin */}
          {isAdmin && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/admin" className="sidebar-link admin-pill-link">
                <span>👑</span>
                <span>{t.app.adminPortal}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Emergency Helpline Sidebar Card */}
        <div className="sidebar-emergency-card">
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.2rem' }}>
            {t.app.cyberHelpline}
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>
            📞 1930
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t.app.emergencyReporting}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-main-wrap">
        {/* Topbar */}
        <header className="portal-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="engine-status-pill">
              <span className="status-dot"></span>
              <span>{t.engineReady}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Senior Mode Toggle */}
            <button
              type="button"
              onClick={toggleSeniorMode}
              className={`btn-toggle-senior ${seniorMode ? 'active' : ''}`}
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
              <option value="en">{t.app.englishInterface}</option>
              <option value="te">{t.app.teluguInterface}</option>
              <option value="hi">{t.app.hindiInterface}</option>
            </select>

            {/* User Profile Pill */}
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-meta-text">
                <span className="user-name-label">{user?.name}</span>
                <span className="user-role-label">{user?.role?.toUpperCase()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              title={t.app.signOut}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="portal-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserPortalLayout;
