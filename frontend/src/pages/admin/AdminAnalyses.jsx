// src/pages/admin/AdminAnalyses.jsx
// Platform-wide threat analyses ledger: inspection, risk scoring forensics, and pattern discovery.

import React, { useState, useEffect } from 'react';
import { apiGetAdminAnalyses } from '../../services/api';
import TrustReport from '../../components/report/TrustReport';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminAnalyses = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('all');
  const [inputType, setInputType] = useState('all');

  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (riskLevel !== 'all') params.riskLevel = riskLevel;
      if (inputType !== 'all') params.inputType = inputType;
      const res = await apiGetAdminAnalyses(params);
      setAnalyses(res || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch threat analyses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [riskLevel, inputType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAnalyses();
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.threatLedgerTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.threatLedgerDesc}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="data-table-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder={t.searchContent}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '260px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />

            <button type="submit" className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}>
              {t.search} 🔍
            </button>

            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="all">{t.allRiskLevels}</option>
              <option value="High">{getTranslation(language).riskLevels.high}</option>
              <option value="Moderate">{getTranslation(language).riskLevels.moderate}</option>
              <option value="Low">{getTranslation(language).riskLevels.low}</option>
            </select>

            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: '#090d16' }}
            >
              <option value="all">{t.allVectors}</option>
              <option value="text">{t.textMessages}</option>
              <option value="screenshot">{t.screenshotOcr}</option>
              <option value="url">{t.websiteUrl}</option>
              <option value="video">{t.youtubeVideo}</option>
              <option value="news">{t.newsArticles}</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {t.totalRecorded}: <strong>{analyses.length}</strong>
          </div>
        </form>
      </div>

      {/* Analyses Table */}
      <div className="data-table-card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loadingThreatAnalyses}
            </div>
          ) : analyses.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noThreatAnalyses}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.timestamp}</th>
                  <th>{t.originUser}</th>
                  <th>{t.vector}</th>
                  <th>{t.score}</th>
                  <th>{t.classification}</th>
                  <th>{t.findings}</th>
                  <th>{t.forensicInspection}</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a._id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.userId?.name || 'Guest / Unauthenticated'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {a.userId?.email || 'Public Scan'}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#38bdf8' }}>
                        {a.inputType}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1rem', color: a.riskScore > 65 ? '#ef4444' : a.riskScore > 35 ? '#f59e0b' : '#10b981' }}>
                        {a.riskScore}
                      </strong>
                    </td>
                    <td>
                      <span className={a.riskLevel === 'HIGH' ? 'badge-risk-high' : a.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                        {a.riskLevel}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.findings && a.findings.length > 0 ? (
                        <span>{a.findings.map(f => f.code || f.title).join(', ')}</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>{t.noFlags}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', color: '#38bdf8' }}
                        onClick={() => setSelectedAnalysis(a)}
                      >
                        {t.inspectDossier} 🔍
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forensic Modal */}
      {selectedAnalysis && (
        <div className="modal-backdrop" onClick={() => setSelectedAnalysis(null)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t.forensicInspection}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t.analysisRecord} #{selectedAnalysis._id}
                </h2>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                onClick={() => setSelectedAnalysis(null)}
              >
                ✕ {t.close}
              </button>
            </div>

            <TrustReport report={selectedAnalysis} language={language} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyses;
