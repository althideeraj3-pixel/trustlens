// src/pages/admin/AdminFeedback.jsx
// User feedback inspection: ratings, false positive reports, and user-submitted commentary.

import React, { useState, useEffect } from 'react';
import { apiGetAdminFeedback } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminFeedback = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await apiGetAdminFeedback();
        setFeedbackList(res || []);
      } catch (err) {
        setError(err.message || 'Failed to load user feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.feedbackPageTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.feedbackPageDesc}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Feedback Table */}
      <div className="data-table-card">
        <div className="data-table-header">
          <div className="data-table-title">{t.feedbackSubmissions} ({feedbackList.length})</div>
        </div>

        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.loadingFeedback}
            </div>
          ) : feedbackList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noFeedback}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.timestamp}</th>
                  <th>{t.submittedBy}</th>
                  <th>{t.rating}</th>
                  <th>{t.comments}</th>
                  <th>{t.associatedReport}</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.userId?.name || t.anonymousUser}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.userId?.email || t.guestSession}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <span key={i}>⭐</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: item.comment ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.comment || t.noComment}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {item.analysisId ? (
                        <div>
                          <span className={item.analysisId.riskLevel === 'HIGH' ? 'badge-risk-high' : item.analysisId.riskLevel === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low'}>
                            {item.analysisId.riskLevel}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {t.score}: {item.analysisId.score || item.analysisId.riskScore}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{t.archivedScan}</span>
                      )}
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

export default AdminFeedback;
