// src/pages/user/ReportsPage.jsx
// Management of saved Trust Reports, forensic reviews, and user feedback submission.

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGetUserReports, apiDeleteReport, apiSubmitFeedback } from '../../services/api';
import TrustReport from '../../components/report/TrustReport';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const ReportsPage = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRisk !== 'ALL') params.riskLevel = filterRisk;
      const data = await apiGetUserReports(params);
      setReports(data || []);

      if (highlightedId && data) {
        const found = data.find(r => r._id === highlightedId);
        if (found) setSelectedReport(found);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch saved reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterRisk]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await apiDeleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
      if (selectedReport?._id === id) setSelectedReport(null);
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      setFeedbackLoading(true);
      await apiSubmitFeedback(selectedReport._id, feedbackRating, feedbackComment);
      setFeedbackSubmitted(true);
    } catch (err) {
      alert('Error submitting feedback: ' + err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.savedReportsTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.savedReportsDesc}
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#090d16', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterRisk(lvl)}
              style={{
                background: filterRisk === lvl ? 'var(--bg-surface-elevated)' : 'transparent',
                color: filterRisk === lvl ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {lvl === 'ALL' ? t.allRiskLevels : getTranslation(language).riskLevels[lvl.toLowerCase()]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t.loadingReports}
        </div>
      ) : reports.length === 0 ? (
        <div className="data-table-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📂</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{t.noReports}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {t.noReportsDesc}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {reports.map((item) => (
            <div
              key={item._id}
              className="kpi-card"
              style={{
                flexDirection: 'column',
                cursor: 'pointer',
                borderLeft: item.riskLevel === 'HIGH' ? '4px solid #ef4444' : item.riskLevel === 'MODERATE' ? '4px solid #f59e0b' : '4px solid #10b981',
                transition: 'transform 0.15s ease, border-color 0.15s ease'
              }}
              onClick={() => {
                setSelectedReport(item);
                setFeedbackSubmitted(false);
                setFeedbackComment('');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.65rem' }}>
                <span className={item.riskLevel === 'HIGH' ? 'badge-risk-high' : item.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                  {getTranslation(language).riskLevels[item.riskLevel?.toLowerCase()] || item.riskLevel} • {t.reportScore} {item.riskScore}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(item.createdAt).toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {item.summary || (item.inputText ? item.inputText.slice(0, 45) + '...' : t.classification)}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', flex: 1 }}>
                {t.vector}: <strong style={{ color: '#38bdf8', textTransform: 'capitalize' }}>
                  {item.inputType === 'text' ? t.textMessages : item.inputType === 'screenshot' ? t.screenshotOcr : item.inputType === 'url' ? t.websiteUrl : item.inputType === 'video' ? t.youtubeVideo : item.inputType === 'news' ? t.newsArticles : item.inputType}
                </strong>
                {item.findings && item.findings.length > 0 && ` • ${item.findings.length} ${t.findings}`}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                  {t.viewCompleteReport} →
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item._id, e)}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}
                  title={t.deleteReport}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Inspection Modal */}
      {selectedReport && (
        <div className="modal-backdrop" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FORENSIC REPORT #{selectedReport._id?.slice(-8)}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Detailed Threat Dossier
                </h2>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}
                onClick={() => setSelectedReport(null)}
              >
                ✕ {t.close}
              </button>
            </div>

            {/* Embedded TrustReport */}
            <TrustReport
              report={selectedReport}
              language={language}
            />

            {/* User Feedback Form */}
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#090d16', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {t.helpfulQuestion}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {t.feedbackDesc}
              </p>

              {feedbackSubmitted ? (
                <div style={{ padding: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderRadius: '6px', fontSize: '0.85rem' }}>
                  ✅ {t.thankFeedback}
                </div>
              ) : (
                <form onSubmit={handleSendFeedback}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '1.4rem',
                          cursor: 'pointer',
                          filter: star <= feedbackRating ? 'none' : 'grayscale(100%) opacity(30%)'
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.feedbackPlaceholder}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    style={{ marginBottom: '0.65rem' }}
                  />

                  <button
                    type="submit"
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
                    disabled={feedbackLoading}
                  >
                    {feedbackLoading ? t.submitting : t.submitFeedback}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
