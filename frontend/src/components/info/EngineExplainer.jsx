// src/components/info/EngineExplainer.jsx
// Architectural transparency section explaining deterministic detection vs AI

import React from 'react';
import { getTranslation } from '../../utils/translations';

const EngineExplainer = ({ language = 'en' }) => {
  const t = getTranslation(language);

  return (
    <section style={{ margin: '3.5rem 0 2rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="hero-pill">{t.explainerPill}</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.5rem' }}>
          {t.explainerTitle}
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0 auto', fontSize: '0.92rem' }}>
          {t.explainerDesc}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div className="section-panel" style={{ background: '#0a0f1d' }}>
          <div style={{ color: '#38bdf8', fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
            {t.zeroHallucinationTitle}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            {t.zeroHallucinationDesc}
          </p>
        </div>

        <div className="section-panel" style={{ background: '#0a0f1d' }}>
          <div style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
            {t.safetyOverridesTitle}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            {t.safetyOverridesDesc}
          </p>
        </div>

        <div className="section-panel" style={{ background: '#0a0f1d' }}>
          <div style={{ color: '#818cf8', fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
            {t.aiReadyTitle}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
            {t.aiReadyDesc}
          </p>
        </div>
      </div>
    </section>
  );
};

export default EngineExplainer;
