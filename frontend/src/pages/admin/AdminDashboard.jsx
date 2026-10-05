// src/pages/admin/AdminDashboard.jsx
// Enterprise metrics overview, threat volume statistics, and system activity logs.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetAdminMetrics } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminDashboard = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await apiGetAdminMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch admin metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5' }}>
        ⚠️ {error}
      </div>
    );
  }

  const {
    totalUsers = 0,
    totalAnalyses = 0,
    riskDistribution = {},
    totalFeedback = 0,
    recentAnalyses = [],
    recentUsers = []
  } = metrics || {};

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t.adminOverviewTitle}
            </h1>
            <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
              {t.liveMonitoring}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {t.adminOverviewDesc}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Link to="/admin/rules" className="btn-secondary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
            {t.configureRules} ⚙️
          </Link>
          <Link to="/admin/users" className="btn-analyze" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
            {t.manageUsers} →
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-title">{t.registeredUsers}</div>
            <div className="kpi-val">{totalUsers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {t.userTiers}
            </div>
          </div>
          <div className="kpi-icon" style={{ color: '#38bdf8' }}>👥</div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-title">{t.totalAnalyses}</div>
            <div className="kpi-val">{totalAnalyses}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {t.executedScans}
            </div>
          </div>
          <div className="kpi-icon" style={{ color: '#818cf8' }}>⚡</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div>
            <div className="kpi-title" style={{ color: '#f87171' }}>{t.highRiskFlags}</div>
            <div className="kpi-val" style={{ color: '#ef4444' }}>{riskDistribution.high || 0}</div>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.35rem' }}>
              {t.criticalScams}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🚨</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>{t.moderateRisk}</div>
            <div className="kpi-val" style={{ color: '#f59e0b' }}>{riskDistribution.moderate || 0}</div>
            <div style={{ fontSize: '0.75rem', color: '#fcd34d', marginTop: '0.35rem' }}>
              {t.suspiciousIndicators}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⚠️</div>
        </div>
      </div>

      {/* Two Column Grid: Recent Analyses & Newest Users */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Analyses Card */}
        <div className="data-table-card">
          <div className="data-table-header">
            <div className="data-table-title">{t.latestTelemetry}</div>
            <Link to="/admin/analyses" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              {t.allAnalyses} →
            </Link>
          </div>
          <div className="data-table-container">
            {recentAnalyses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t.noRecentAnalyses}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminDashboardTableType}</th>
                    <th>{t.adminDashboardTableUser}</th>
                    <th>{t.riskScore}</th>
                    <th>{t.verdict}</th>
                    <th>{t.adminDashboardTableDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.map(a => (
                    <tr key={a._id}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{a.inputType}</td>
                      <td style={{ fontSize: '0.8rem' }}>{a.userId?.email || 'Guest Scan'}</td>
                      <td>
                        <strong style={{ color: a.riskScore > 65 ? '#ef4444' : a.riskScore > 35 ? '#f59e0b' : '#10b981' }}>
                          {a.riskScore}
                        </strong>
                      </td>
                      <td>
                        <span className={a.riskLevel === 'HIGH' ? 'badge-risk-high' : a.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                          {a.riskLevel}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Users Card */}
        <div className="data-table-card">
          <div className="data-table-header">
            <div className="data-table-title">{t.recentUsers}</div>
            <Link to="/admin/users" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
              {t.userDirectory} →
            </Link>
          </div>
          <div className="data-table-container">
            {recentUsers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t.noRegisteredUsers}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.adminDashboardTableName}</th>
                    <th>{t.adminDashboardTableEmail}</th>
                    <th>{t.adminDashboardTableRole}</th>
                    <th>{t.adminDashboardTableStatus}</th>
                    <th>{t.adminDashboardTableJoined}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                      <td style={{ fontSize: '0.8rem' }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: u.role === 'admin' ? '#f87171' : '#38bdf8' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={u.status === 'active' ? 'badge-status-active' : 'badge-status-disabled'}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
