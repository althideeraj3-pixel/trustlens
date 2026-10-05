// src/layouts/AdminPortalLayout.jsx
// Enterprise Administrator Console layout for system audits, user management, and rule configuration.

import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

const AdminPortalLayout = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = getTranslation(language).app;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="portal-layout admin-theme">
      {/* Admin Sidebar */}
      <aside className="portal-sidebar admin-sidebar" aria-label={t.adminConsole}>
        <div className="sidebar-brand-wrap">
          <Link to="/admin" className="brand-anchor">
            <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #7f1d1d)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">TrustLens</span>
              <span className="brand-tag" style={{ color: '#f87171' }}>{t.adminConsole}</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>{t.adminDashboard}</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>{t.adminUsers}</span>
          </NavLink>

          <NavLink to="/admin/analyses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{t.adminAnalyses}</span>
          </NavLink>

          <NavLink to="/admin/rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{t.adminRules}</span>
          </NavLink>

          <NavLink to="/admin/feedback" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{t.adminFeedback}</span>
          </NavLink>

          <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{t.adminAudit}</span>
          </NavLink>

          {/* User Workspace Switcher */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Link to="/app/dashboard" className="sidebar-link" style={{ color: '#38bdf8' }}>
              <span>←</span>
              <span>{t.backToUser}</span>
            </Link>
          </div>
        </nav>

        {/* Security Clearance Tag */}
        <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontSize: '0.75rem', color: '#fca5a5' }}>
          🔒 {t.adminClearance}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-main-wrap">
        <header className="portal-topbar" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', background: '#dc2626', color: '#fff', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              {t.rootAdmin}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t.systemOptimal}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="lang-select"
              aria-label={t.languageLabel}
            >
              <option value="en">{t.englishInterface}</option>
              <option value="te">{t.teluguInterface}</option>
              <option value="hi">{t.hindiInterface}</option>
            </select>
            <div className="user-profile-badge">
              <div className="user-avatar-circle" style={{ background: '#dc2626' }}>
                A
              </div>
              <div className="user-meta-text">
                <span className="user-name-label">{user?.name}</span>
                <span className="user-role-label" style={{ color: '#f87171' }}>{t.administrator}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            >
              {t.signOut}
            </button>
          </div>
        </header>

        <main className="portal-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPortalLayout;
