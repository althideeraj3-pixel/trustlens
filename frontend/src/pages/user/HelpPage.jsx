// src/pages/user/HelpPage.jsx
// Cybercrime incident response guides and emergency helplines.

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';

const HelpPage = () => {
  const { language } = useLanguage();
  const t = getTranslation(language).app;
  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {t.helpTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t.helpDesc}
        </p>
      </div>

      {/* Emergency Helpline Box */}
      <div className="helpline-box" style={{ marginBottom: '2rem' }}>
        <div className="helpline-info">
          <h3>{t.helplineName}</h3>
          <p>{t.operatedBy}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            ⚡ <strong>{t.goldenHour}</strong>
          </div>
        </div>

        <div className="helpline-cta-group">
          <a href="tel:1930" className="btn-dial">
            📞 {t.dial1930}
          </a>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="link-portal"
          >
            cybercrime.gov.in ↗
          </a>
        </div>
      </div>

      {/* Incident Scenarios Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        {t.immediateActions}
      </h2>

      <div className="playbook-grid" style={{ marginBottom: '2.5rem' }}>
        {/* Scenario 1: Money Transferred */}
        <div className="playbook-card urgent">
          <div className="playbook-step-title">
            <span>🚨</span>
            <span>1. {t.transferredMoney}</span>
          </div>
          <div className="playbook-text">
            <strong>{t.actNow}</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
              <li>{t.moneyStep1}</li>
              <li>{t.moneyStep2}</li>
              <li>{t.moneyStep3} <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>cybercrime.gov.in</a></li>
            </ul>
          </div>
        </div>

        {/* Scenario 2: OTP / Password Shared */}
        <div className="playbook-card urgent">
          <div className="playbook-step-title">
            <span>🔑</span>
            <span>2. {t.sharedOtp}</span>
          </div>
          <div className="playbook-text">
            <strong>{t.credentialSafety}</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
              <li>{t.otpStep1}</li>
              <li>{t.otpStep2}</li>
              <li>{t.otpStep3}</li>
            </ul>
          </div>
        </div>

        {/* Scenario 3: APK / Remote App Installed */}
        <div className="playbook-card">
          <div className="playbook-step-title">
            <span>📱</span>
            <span>3. {t.downloadedApp}</span>
          </div>
          <div className="playbook-text">
            <strong>{t.deviceSafety}</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
              <li>{t.appStep1}</li>
              <li>{t.appStep2}</li>
              <li>{t.appStep3}</li>
            </ul>
          </div>
        </div>

        {/* Scenario 4: "Digital Arrest" Call */}
        <div className="playbook-card">
          <div className="playbook-step-title">
            <span>👮</span>
            <span>4. {t.digitalArrest}</span>
          </div>
          <div className="playbook-text">
            <strong>{t.knowTheLaw}</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
              <li>{t.arrestStep1}</li>
              <li>{t.arrestStep2}</li>
              <li>{t.arrestStep3} <a href="https://sancharsaathi.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>sancharsaathi.gov.in</a>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
