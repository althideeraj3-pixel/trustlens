// src/pages/user/HistoryPage.jsx
// Complete audit trail and searchable scan history with granular threat filters.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetUserReports, apiDeleteReport } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const HistoryPage = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'ALL') params.inputType = typeFilter.toLowerCase();
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      const data = await apiGetUserReports(params);
      setReports(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch history logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter, riskFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this historical analysis record?')) return;
    try {
      await apiDeleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const filteredReports = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.summary && r.summary.toLowerCase().includes(q)) ||
      (r.inputText && r.inputText.toLowerCase().includes(q)) ||
      (r.sourceMetadata?.domain && r.sourceMetadata.domain.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {t.historyTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t.historyDesc}
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="data-table-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <input
              type="text"
              className="form-input"
              placeholder={t.searchHistory}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '240px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="ALL">{t.allInputTypes}</option>
              <option value="TEXT">💬 {t.textMessages}</option>
              <option value="SCREENSHOT">📸 {t.screenshotOcr}</option>
              <option value="URL">🌐 {t.websiteUrl}</option>
              <option value="VIDEO">🎬 {t.youtubeVideo}</option>
              <option value="NEWS">📰 {t.newsArticles}</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="ALL">{t.allRiskLevels}</option>
              <option value="HIGH">🔴 {getTranslation(language).riskLevels.high}</option>
              <option value="MODERATE">🟡 {getTranslation(language).riskLevels.moderate}</option>
              <option value="LOW">🟢 {getTranslation(language).riskLevels.low}</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {t.showingRecords}: {filteredReports.length}
          </div>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="data-table-card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loadingRecords}
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noMatchingRecords}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.timestamp}</th>
                  <th>{t.vector}</th>
                  <th>{t.analyzedContent}</th>
                  <th>{t.riskScore}</th>
                  <th>{t.verdict}</th>
                  <th>{t.keyIndicators}</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((item) => (
                  <tr key={item._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {item.inputType}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.inputText || item.summary || t.analyzedContent}
                    </td>
                    <td>
                      <strong style={{ color: item.riskScore > 65 ? '#ef4444' : item.riskScore > 35 ? '#f59e0b' : '#10b981' }}>
                        {item.riskScore}
                      </strong>
                    </td>
                    <td>
                      <span className={item.riskLevel === 'HIGH' ? 'badge-risk-high' : item.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                        {getTranslation(language).riskLevels[item.riskLevel?.toLowerCase()] || item.riskLevel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.findings && item.findings.length > 0 ? (
                        <span>{item.findings.length} {t.findings}: {item.findings.map(f => f.code || f.title).slice(0, 2).join(', ')}</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>{t.cleanNoThreat}</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Link to={`/app/reports?id=${item._id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                          {t.viewReport}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                          title={t.deleteReport}
                        >
                          🗑️
                        </button>
                      </div>
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

export default HistoryPage;
