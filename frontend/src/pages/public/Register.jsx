// src/pages/public/Register.jsx
// User account creation with security preference selection.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { language, setLanguage } = useLanguage();
  const t = getTranslation(language).app;
  const [seniorMode, setSeniorMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError(t.fieldsRequired);
      return;
    }

    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(name, email, password, language, seniorMode);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || t.registrationFailed);
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="auth-title">{t.createAccount}</h1>
          <p className="auth-subtitle">{t.registerDesc}</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">{t.fullName}</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">{t.email}</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder={t.loginEmailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">{t.password}</label>
              <input
                id="reg-pass"
                type="password"
                className="form-input"
                placeholder={t.minCharacters}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">{t.confirm}</label>
              <input
                id="reg-confirm"
                type="password"
                className="form-input"
                placeholder={t.confirmPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t.preferredLanguage}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="form-input"
              style={{ background: '#090d16' }}
            >
              <option value="en">{t.englishInterface}</option>
              <option value="te">{t.teluguInterface}</option>
              <option value="hi">{t.hindiInterface}</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              id="senior-pref"
              checked={seniorMode}
              onChange={(e) => setSeniorMode(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
            />
            <label htmlFor="senior-pref" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {t.enableSeniorMode}
            </label>
          </div>

          <button
            type="submit"
            className="btn-analyze"
            style={{ width: '100%', height: '44px' }}
            disabled={loading}
          >
            {loading ? t.creatingAccount : t.completeRegistration}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t.alreadyAccount}{' '}
          <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            {t.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
