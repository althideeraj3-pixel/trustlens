// src/pages/user/ProfilePage.jsx
// User security profile, account credentials, and authentication preferences.

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUpdateProfile } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const ProfilePage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language).app;

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiUpdateProfile({ name: name.trim() });
      setSuccess(t.profileSaved);
    } catch (err) {
      setError(err.message || t.profileUpdateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError(t.passwordFieldsRequired);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.profilePasswordTooShort);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.currentNewMismatch);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiUpdateProfile({ currentPassword, newPassword });
      setSuccess(t.passwordSaved);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.message || t.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {t.profileTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t.profileDesc}
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ✅ {success}
        </div>
      )}

      {/* Account Identity Card */}
      <div className="data-table-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="user-avatar-circle" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</div>
            <div style={{ marginTop: '0.35rem' }}>
              <span className={user?.role === 'admin' ? 'badge-risk-high' : 'badge-risk-low'} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                {t.role}: {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateName}>
          <div className="form-group">
            <label className="form-label">{t.fullName}</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-secondary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            disabled={saving}
          >
            {saving ? t.updating : t.saveName}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="data-table-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {t.changePassword}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {t.passwordAdvice}
        </p>

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">{t.currentPassword}</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{t.newPassword}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t.minCharacters}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.confirmPassword}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t.reenterPassword}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-analyze"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            disabled={saving}
          >
            {saving ? t.updating : t.updatePassword}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
