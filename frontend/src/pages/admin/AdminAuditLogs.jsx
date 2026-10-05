// src/pages/admin/AdminAuditLogs.jsx
// Tamper-evident administrative audit ledger: captures user elevation, rule changes, and security events.

import React, { useState, useEffect } from 'react';
import { apiGetAdminAuditLogs } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const AdminAuditLogs = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiGetAdminAuditLogs();
        setLogs(res || []);
      } catch (err) {
        setError(err.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {t.auditPageTitle}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t.auditPageDesc}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="data-table-card">
        <div className="data-table-header">
          <div className="data-table-title">{t.auditEntries} ({logs.length})</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🔒 {t.linkedActions}
          </div>
        </div>

        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.verifyingLogs}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t.noAuditLogs}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.timestamp}</th>
                  <th>{t.action}</th>
                  <th>{t.performedBy}</th>
                  <th>{t.targetType}</th>
                  <th>{t.eventDetails}</th>
                  <th>{t.ipAddress}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <code style={{ background: '#090d16', padding: '0.2rem 0.5rem', borderRadius: '4px', color: log.action.includes('USER') ? '#f87171' : '#38bdf8', fontWeight: 700, fontSize: '0.75rem' }}>
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.performedBy?.name || t.systemRoot}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.performedBy?.email || 'automated'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {log.targetType} ({log.targetId ? log.targetId.slice(-8) : t.global})
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '350px' }}>
                      <pre style={{ background: '#090d16', padding: '0.35rem 0.6rem', borderRadius: '4px', overflowX: 'auto', margin: 0, fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                        {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                      </pre>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
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

export default AdminAuditLogs;
