// src/pages/user/SettingsPage.jsx
// Accessibility controls and user preferences.

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTranslation } from '../../utils/translations';

const SettingsPage = ({ language, setLanguage, seniorMode, setSeniorMode }) => {
  const { updatePreferences } = useAuth();
  const t = getTranslation(language).app;
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await updatePreferences({
        language,
        seniorMode
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Preferences update warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSenior = () => {
    const nextVal = !seniorMode;
    setSeniorMode(nextVal);
    if (nextVal) {
      document.body.classList.add('senior-mode');
    } else {
      document.body.classList.remove('senior-mode');
    }
  };

  return (
    <div style={{ maxWidth: '750px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {t.settingsTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t.settingsDesc}
        </p>
      </div>

      {saved && (
        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ✅ {t.savedSuccess}
        </div>
      )}

      <form onSubmit={handleSavePreferences}>
        {/* Language Selection */}
        <div className="data-table-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            🌐 {t.interfaceLanguage}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t.languageDesc}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              { code: 'en', label: t.english, note: 'English' },
              { code: 'te', label: t.telugu, note: 'తెలుగు' },
              { code: 'hi', label: t.hindi, note: 'हिन्दी' }
            ].map(lang => (
              <div
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: language === lang.code ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                  background: language === lang.code ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-surface-elevated)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {lang.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {lang.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Senior Citizen Accessibility Mode */}
        <div className="data-table-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              👴 {t.seniorMode}
            </h3>
            <button
              type="button"
              onClick={toggleSenior}
              className={`btn-toggle-senior ${seniorMode ? 'active' : ''}`}
            >
              <span>{seniorMode ? t.seniorOn : t.seniorOff}</span>
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {t.seniorDesc}
          </p>
        </div>

        <button
          type="submit"
          className="btn-analyze"
          style={{ padding: '0.6rem 1.5rem' }}
          disabled={loading}
        >
          {loading ? t.saving : t.savePreferences}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
