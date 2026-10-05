// src/components/common/Navbar.jsx
// Professional cybersecurity navigation bar with active engine status & accessibility controls

import React from 'react';
import { getTranslation } from '../../utils/translations';

const Navbar = ({ seniorMode, setSeniorMode, language, setLanguage, onToggleHistory, historyCount = 0 }) => {
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
    <header className="site-header" role="banner">
      <div className="site-container header-inner">
        {/* Brand / Logo */}
        <a href="/" className="brand-anchor" aria-label="TrustLens Cybersecurity Platform">
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
        </a>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Active Status Badge */}
          <div className="engine-status-pill"           title={t.engineReady}>
            <span className="status-dot"></span>
            <span>{t.engineReady}</span>
          </div>

          {/* Audit History Trigger */}
          <button
            type="button"
            onClick={onToggleHistory}
            className="btn-toggle-senior"
            title={t.historyTitle}
            style={{ position: 'relative' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{t.history} ({historyCount})</span>
          </button>

          {/* Senior Mode Accessibility Switch */}
          <button
            type="button"
            onClick={toggleSeniorMode}
            className={`btn-toggle-senior ${seniorMode ? 'active' : ''}`}
            aria-pressed={seniorMode}
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
            <option value="en">English</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
