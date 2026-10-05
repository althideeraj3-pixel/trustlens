// src/components/history/AuditHistory.jsx
// Local threat inspection audit log (persisted in browser localStorage)

import React from 'react';
import { getTranslation } from '../../utils/translations';

const AuditHistory = ({ history, onSelectReport, onClearHistory, onClose, language = 'en' }) => {
  const t = getTranslation(language);

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '420px',
        background: '#0c121e',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}
      aria-label="Scan History Drawer"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{t.historyTitle}</h3>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          style={{ minHeight: '34px', padding: '0.25rem 0.65rem' }}
        >
          {t.close}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '3rem', whiteSpace: 'pre-line' }}>
            {t.historyEmpty}
          </p>
        ) : (
          history.map((item, index) => {
            const levelKey = item.riskLevel?.toLowerCase() || 'low';
            return (
              <div
                key={index}
                onClick={() => {
                  onSelectReport(item);
                  onClose();
                }}
                style={{
                  background: '#131b2e',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className={`threat-pill ${levelKey}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    {t.riskLevels[levelKey] || item.riskLevel} ({item.score}/100)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(item.analyzedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{item.inputText || item.summary}"
                </p>
              </div>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={onClearHistory}
            className="btn-secondary"
            style={{ width: '100%', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            {t.historyClear}
          </button>
        </div>
      )}
    </aside>
  );
};

export default AuditHistory;
