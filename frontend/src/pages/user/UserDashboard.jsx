// src/pages/user/UserDashboard.jsx
// Overview of user activity, risk exposure statistics, and quick analyze actions.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGetUserReports } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const UserDashboard = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await apiGetUserReports({ limit: 5 });
        setReports(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalScans = reports.length;
  const highRiskCount = reports.filter(r => r.riskLevel === 'HIGH').length;
  const modRiskCount = reports.filter(r => r.riskLevel === 'MODERATE').length;
  const lowRiskCount = reports.filter(r => r.riskLevel === 'LOW').length;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.dashboardWelcome}, {user?.name || 'Investigator'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.dashboardDesc}
          </p>
        </div>

        <Link to="/app/analyze" className="btn-analyze" style={{ padding: '0.65rem 1.35rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>{t.newScan}</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-title">{t.totalAnalyses}</div>
            <div className="kpi-val">{loading ? '...' : totalScans}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {t.savedHistory}
            </div>
          </div>
          <div className="kpi-icon" style={{ color: '#38bdf8' }}>🔍</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div>
            <div className="kpi-title" style={{ color: '#f87171' }}>{t.highRiskFlags}</div>
            <div className="kpi-val" style={{ color: '#ef4444' }}>{loading ? '...' : highRiskCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.35rem' }}>
              {t.potentialFraud}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⚠️</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>{t.moderateRisk}</div>
            <div className="kpi-val" style={{ color: '#f59e0b' }}>{loading ? '...' : modRiskCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#fcd34d', marginTop: '0.35rem' }}>
              {t.suspiciousIndicators}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⚡</div>
        </div>

        <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div>
            <div className="kpi-title" style={{ color: '#34d399' }}>{t.lowRisk}</div>
            <div className="kpi-val" style={{ color: '#10b981' }}>{loading ? '...' : lowRiskCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '0.35rem' }}>
              {t.cleanMessages}
            </div>
          </div>
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>🛡️</div>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div style={{ padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>
              {t.activeAlert}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {t.alertDesc}
            </div>
          </div>
        </div>
        <Link to="/app/help" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {t.safetyGuide} →
        </Link>
      </div>

      {/* Recent Analyses Table */}
      <div className="data-table-card">
        <div className="data-table-header">
          <div className="data-table-title">{t.recentInvestigations}</div>
          <Link to="/app/history" style={{ fontSize: '0.82rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
            {t.viewAllHistory} →
          </Link>
        </div>

        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loading}
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{t.noAnalyses}</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {t.firstAnalysis}
              </p>
              <Link to="/app/analyze" className="btn-analyze" style={{ padding: '0.5rem 1.15rem', textDecoration: 'none' }}>
                {t.scanNow}
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.inputType}</th>
                  <th>{t.preview}</th>
                  <th>{t.riskScore}</th>
                  <th>{t.classification}</th>
                  <th>{t.dateTime}</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#94a3b8' }}>
                        {item.inputType === 'url' ? '🔗 URL' : item.inputType === 'screenshot' ? `🖼️ ${t.screenshotOcr}` : item.inputType === 'video' ? `🎬 ${t.youtubeVideo}` : item.inputType === 'news' ? `📰 ${t.newsArticles}` : `💬 ${t.textMessages}`}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.inputText || item.summary || t.contentRecord}
                    </td>
                    <td>
                      <strong style={{ color: item.riskScore > 65 ? '#ef4444' : item.riskScore > 35 ? '#f59e0b' : '#10b981' }}>
                        {item.riskScore} / 100
                      </strong>
                    </td>
                    <td>
                      <span className={item.riskLevel === 'HIGH' ? 'badge-risk-high' : item.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                        {getTranslation(language).riskLevels[item.riskLevel?.toLowerCase()] || item.riskLevel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </td>
                    <td>
                      <Link to={`/app/reports?id=${item._id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                        {t.viewReport} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
