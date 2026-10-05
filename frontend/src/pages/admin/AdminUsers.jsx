// src/pages/admin/AdminUsers.jsx
// Enterprise user administration: search, role elevation, account suspension, and scan volume tracking.

import React, { useState, useEffect } from 'react';
import { apiGetAdminUsers, apiUpdateUserStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminUsers = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiGetAdminUsers(params);
      setUsers(res || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Are you sure you want to change ${user.name}'s status to ${nextStatus.toUpperCase()}?`)) return;

    try {
      setError(null);
      setSuccess(null);
      await apiUpdateUserStatus(user._id, nextStatus, user.role);
      setSuccess(`User ${user.email} status updated to ${nextStatus}.`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${user.name}'s role to ${nextRole.toUpperCase()}?`)) return;

    try {
      setError(null);
      setSuccess(null);
      await apiUpdateUserStatus(user._id, user.status, nextRole);
      setSuccess(`User ${user.email} role updated to ${nextRole}.`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: nextRole } : u));
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.userDirectoryTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.userDirectoryDesc}
          </p>
        </div>
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

      {/* Filter and Search Bar */}
      <div className="data-table-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder={t.searchUsers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '260px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />

            <button type="submit" className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}>
              {t.search} 🔍
            </button>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="all">{t.allRoles}</option>
              <option value="admin">{t.administrators}</option>
              <option value="user">{t.standardUsers}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="active">{t.activeAccounts}</option>
              <option value="disabled">{t.disabledAccounts}</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {t.totalUsers}: <strong>{users.length}</strong>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="data-table-card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loadingAccounts}
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noUsersMatch}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.userDetails}</th>
                  <th>{t.role}</th>
                  <th>{t.accountStatus}</th>
                  <th>{t.totalAnalyses}</th>
                  <th>{t.joinedDate}</th>
                  <th>{t.lastLogin}</th>
                  <th>{t.adminActions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentAdmin?._id === u._id;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ID: {u._id}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: u.role === 'admin' ? '#f87171' : '#38bdf8',
                          border: u.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={u.status === 'active' ? 'badge-status-active' : 'badge-status-disabled'}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{u.analysesCount || 0}</strong> scans
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf}
                            title={isSelf ? t.cannotChangeSelf : t.toggleRole}
                          >
                            {u.role === 'admin' ? t.demoteUser : t.promoteAdmin}
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            style={{
                              padding: '0.25rem 0.65rem',
                              fontSize: '0.75rem',
                              color: u.status === 'active' ? '#f87171' : '#34d399',
                              borderColor: u.status === 'active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                            }}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            title={isSelf ? t.cannotChangeSelf : t.toggleStatus}
                          >
                            {u.status === 'active' ? t.disable : t.enable}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
