// src/pages/public/ForgotPassword.jsx
// Password recovery workflow.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const ForgotPassword = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiForgotPassword(email);
      setSuccess(res.message || 'Password reset link sent to your registered email address.');
    } catch (err) {
      setError(err.message || t.resetFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="brand-icon" style={{ margin: '0 auto 0.75rem auto', width: '42px', height: '42px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="auth-title">{t.resetPassword}</h1>
          <p className="auth-subtitle">{t.resetDesc}</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.9rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📬</div>
            <div>{success}</div>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/login" className="btn-secondary" style={{ display: 'inline-block', padding: '0.5rem 1.25rem' }}>
                {t.returnToLogin}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">{t.registeredEmail}</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                placeholder="e.g. user@trustlens.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-analyze"
              style={{ width: '100%', height: '44px', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? t.sendingInstructions : t.sendResetLink}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.rememberPassword}{' '}
          <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            {t.returnToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
