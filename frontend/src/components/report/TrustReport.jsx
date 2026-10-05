// src/components/report/TrustReport.jsx
// Executive Security Audit Report for TrustLens (Fully Multilingual)

import React, { useState } from 'react';
import { getTranslation } from '../../utils/translations';

const TrustReport = ({ report, language = 'en', onNewScan }) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const t = getTranslation(language);
  const aiLabels = {
    en: {
      title: 'AI explanation (secondary to rule findings)', fallback: 'Rule-based fallback',
      claims: 'Claims identified', evidence: 'Evidence', verify: 'Needs independent verification',
      indicators: 'Suspicious indicators', requestedData: 'Information requested',
      limitations: 'What could not be checked', confidence: 'AI confidence (not a risk score)',
      suggestions: 'AI suggestions (also follow the safety steps below)'
    },
    te: {
      title: 'AI వివరణ (నియమాల ఫలితాలకు అదనంగా)', fallback: 'నియమాల ఆధారిత ప్రత్యామ్నాయం',
      claims: 'గుర్తించిన వాదనలు', evidence: 'ఆధారం', verify: 'స్వతంత్రంగా ధృవీకరించండి',
      indicators: 'అనుమానాస్పద సూచనలు', requestedData: 'అడిగిన సమాచారం',
      limitations: 'తనిఖీ చేయలేనివి', confidence: 'AI నమ్మకం (ప్రమాద స్కోరు కాదు)',
      suggestions: 'AI సూచనలు (క్రింది భద్రతా చర్యలను కూడా అనుసరించండి)'
    },
    hi: {
      title: 'AI व्याख्या (नियमों के निष्कर्षों के अतिरिक्त)', fallback: 'नियम-आधारित विकल्प',
      claims: 'पहचाने गए दावे', evidence: 'साक्ष्य', verify: 'स्वतंत्र रूप से सत्यापित करें',
      indicators: 'संदिग्ध संकेत', requestedData: 'माँगी गई जानकारी',
      limitations: 'जिनकी जाँच नहीं हो सकी', confidence: 'AI विश्वास (जोखिम स्कोर नहीं)',
      suggestions: 'AI सुझाव (नीचे दिए सुरक्षा कदम भी अपनाएँ)'
    }
  }[language] || {
    title: 'AI explanation (secondary to rule findings)', fallback: 'Rule-based fallback',
    claims: 'Claims identified', evidence: 'Evidence', verify: 'Needs independent verification',
    indicators: 'Suspicious indicators', requestedData: 'Information requested',
    limitations: 'What could not be checked', confidence: 'AI confidence (not a risk score)',
    suggestions: 'AI suggestions (also follow the safety steps below)'
  };

  const {
    riskLevel = 'Low',
    score = (report.score !== undefined ? report.score : (report.riskScore !== undefined ? report.riskScore : 0)),
    summary = '',
    findings = [],
    dataRequests = [],
    actions = {},
    uncertainty = t.legalNotice
  } = report;

  const levelKey = riskLevel.toLowerCase();
  const localizedRiskLevel = t.riskLevels[levelKey] || riskLevel;

  // Localized Action Defaults if backend returns standard English
  const getActionAdvice = (type) => {
    if (language === 'te') {
      if (type === 'notActed') return t.step1Default;
      if (type === 'enteredDetails') return t.step2Default;
      if (type === 'paid') return t.step3Default;
    } else if (language === 'hi') {
      if (type === 'notActed') return t.step1Default;
      if (type === 'enteredDetails') return t.step2Default;
      if (type === 'paid') return t.step3Default;
    }
    return actions[type] || t[`step${type === 'notActed' ? '1' : type === 'enteredDetails' ? '2' : '3'}Default`];
  };

  // Text-To-Speech Audio Briefing (SRS Section 3.8 / SM-02)
  const handleVoiceBriefing = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    let narration = '';
    if (language === 'te') {
      narration = `ట్రస్ట్ లెన్స్ భద్రతా నివేదిక. ప్రమాద స్థాయి ${localizedRiskLevel}. ప్రమాద స్కోరు 100 కి ${score}. సిఫార్సు చేయబడిన ప్రాథమిక చర్య: ${getActionAdvice('notActed')}`;
    } else if (language === 'hi') {
      narration = `ट्रस्ट लेंस सुरक्षा रिपोर्ट। जोखिम स्तर ${localizedRiskLevel} है। जोखिम स्कोर 100 में से ${score} है। मुख्य सुरक्षा सलाह: ${getActionAdvice('notActed')}`;
    } else {
      narration = `TrustLens Security Report. Risk assessment is ${riskLevel}. Threat score is ${score} out of 100. ${summary}. Primary recommendation: ${getActionAdvice('notActed')}`;
    }

    const utterance = new SpeechSynthesisUtterance(narration);

    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy shareable threat advisory
  const handleCopySummary = async () => {
    const findingsSummary = findings.map(f => `• [${f.ruleId}] ${f.category} ("${f.matchedSnippet || ''}")`).join('\n');
    const shareText = `⚠️ TRUSTLENS SECURITY ADVISORY ⚠️\nRisk Level: ${localizedRiskLevel} (Score: ${score}/100)\n\nEvidence Found:\n${findingsSummary}\n\nRecommended Action:\n${getActionAdvice('notActed')}\n\nReport Cyber Fraud at 1930 / cybercrime.gov.in`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  return (
    <section className="report-container" aria-live="polite" id="trust-report-result">
      {/* 1. Executive Threat Header */}
      <div className={`threat-header-card ${levelKey}`}>
        <div className="threat-top-row">
          <div className={`threat-pill ${levelKey}`}>
            {levelKey === 'high' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
            {levelKey === 'moderate' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {levelKey === 'low' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            )}
            <span>{localizedRiskLevel}</span>
          </div>

          <div className="score-display">
            <span className="score-number">{score}</span>
            <span className="score-total">{t.threatIndex}</span>
          </div>
        </div>

        {/* Visual Score Gauge Bar */}
        <div className="threat-meter" role="progressbar" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100">
          <div className={`threat-meter-fill ${levelKey}`} style={{ width: `${Math.max(score, 5)}%` }}></div>
        </div>

        {/* Executive Verdict */}
        <p className="threat-summary-text">{summary}</p>

        {/* Action Toolbar */}
        <div className="report-toolbar">
          <button
            type="button"
            onClick={handleVoiceBriefing}
            className={`btn-tts ${isPlayingVoice ? 'speaking' : ''}`}
            aria-label={t.listenAudio}
          >
            {isPlayingVoice ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <span>{t.listenAudio}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn-secondary"
            title={t.shareAdvisory}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>{copied ? t.copiedClipboard : t.shareAdvisory}</span>
          </button>

          {onNewScan && (
            <button
              type="button"
              onClick={onNewScan}
              className="btn-secondary"
              style={{ marginLeft: 'auto' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span>{t.scanAnother}</span>
            </button>
          )}
        </div>
      </div>

      {report.aiAnalysis && (
        <div className="section-panel ai-explanation-panel">
          <div className="panel-title-wrap">
            <h3 className="panel-title">{aiLabels.title}</h3>
            <span className="badge-counter">
              {report.aiAnalysis.mode === 'ai' ? 'AI-assisted' : aiLabels.fallback}
            </span>
          </div>
          <p className="threat-summary-text">
            {report.aiAnalysis.translations?.[language]?.summary || report.aiAnalysis.summary}
          </p>
          <p>
            {report.aiAnalysis.translations?.[language]?.riskExplanation ||
              report.aiAnalysis.translations?.[language]?.explanation ||
              report.aiAnalysis.riskExplanation ||
              report.aiAnalysis.explanation}
          </p>
          {report.aiAnalysis.mode === 'ai' && typeof report.aiAnalysis.confidence === 'number' && (
            <p>{aiLabels.confidence}: {Math.round(report.aiAnalysis.confidence * 100)}%</p>
          )}
          {report.aiAnalysis.verificationNeeded && (
            <p className="uncertainty-box">{aiLabels.verify}</p>
          )}
          {report.aiAnalysis.suspiciousIndicators?.length > 0 && (
            <div className="findings-container">
              <h4>{aiLabels.indicators}</h4>
              {report.aiAnalysis.suspiciousIndicators.map((item, idx) => (
                <div className="finding-card" key={`${item.indicator}-${idx}`}>
                  <p className="finding-explanation">{item.indicator}</p>
                  <p>{item.explanation}</p>
                </div>
              ))}
            </div>
          )}
          {report.aiAnalysis.claims?.length > 0 && (
            <div className="findings-container">
              <h4>{aiLabels.claims}</h4>
              {report.aiAnalysis.claims.map((claim, idx) => (
                <div className="finding-card" key={`${claim.evidenceQuote}-${idx}`}>
                  <p className="finding-explanation">{claim.text}</p>
                  <p>{claim.reason}</p>
                  {claim.evidenceQuote && (
                    <div className="snippet-block">
                      {aiLabels.evidence}: <span className="highlighted-snippet">"{claim.evidenceQuote}"</span>
                    </div>
                  )}
                  {claim.interpretation && <p>{claim.interpretation}</p>}
                  {typeof claim.timestampSeconds === 'number' && (
                    <p>Video timestamp: {Math.floor(claim.timestampSeconds / 60)}:{String(Math.floor(claim.timestampSeconds % 60)).padStart(2, '0')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {report.aiAnalysis.evidence?.filter((item) => item.sourceType === 'ai_visual_interpretation').map((item, idx) => (
            <div className="finding-card" key={`visual-evidence-${idx}`}>
              <strong>AI visual/audio interpretation{typeof item.timestampSeconds === 'number'
                ? ` at ${Math.floor(item.timestampSeconds / 60)}:${String(Math.floor(item.timestampSeconds % 60)).padStart(2, '0')}`
                : ''}</strong>
              <p>{item.interpretation}</p>
            </div>
          ))}
          {report.aiAnalysis.requestedData?.length > 0 && (
            <div className="findings-container">
              <h4>{aiLabels.requestedData}</h4>
              <ul>
                {report.aiAnalysis.requestedData.map((item, idx) => (
                  <li key={`${item.type}-${idx}`}>{item.type} ({item.sensitivity})</li>
                ))}
              </ul>
            </div>
          )}
          {report.aiAnalysis.recommendedActions?.length > 0 && (
            <div>
              <h4>{aiLabels.suggestions}</h4>
              <ul>
                {report.aiAnalysis.recommendedActions.map((action, idx) => (
                  <li key={`${action}-${idx}`}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          {report.aiAnalysis.uncertainty && (
            <p className="uncertainty-box">{report.aiAnalysis.uncertainty}</p>
          )}
          {report.aiAnalysis.limitations?.length > 0 && (
            <div>
              <h4>{aiLabels.limitations}</h4>
              <ul>
                {report.aiAnalysis.limitations.map((limitation, idx) => (
                  <li key={`${limitation}-${idx}`}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. Data Extraction Exposure ("What is this asking from me?") */}
      {dataRequests && dataRequests.length > 0 && (
        <div className="section-panel">
          <div className="panel-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M7 7h10M7 12h10M7 17h6"/>
            </svg>
            <h3 className="panel-title">{t.dataVectorsTitle}</h3>
            <span className="badge-counter">{dataRequests.length} {t.requestedCount}</span>
          </div>

          <div className="data-req-grid">
            {dataRequests.map((item, idx) => {
              const sensKey = item.sensitivity.toLowerCase();
              return (
                <div key={idx} className={`data-req-card ${sensKey}`}>
                  <div>
                    <div className="data-req-name">{item.type}</div>
                    <div className="data-req-sensitivity">
                      {item.sensitivity === 'Critical' ? t.criticalCredential : `${t.highSensitivity}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Evidence Matrix (Forensic Findings) */}
      <div className="section-panel">
        <div className="panel-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h3 className="panel-title">{t.evidenceTitle}</h3>
          <span className="badge-counter">{findings.length} {t.detectedCount}</span>
        </div>

        {findings.length > 0 ? (
          <div className="findings-container">
            {findings.map((f, idx) => (
              <div key={idx} className="finding-card">
                <div className="finding-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="rule-pill">{f.ruleId}</span>
                    <span className="finding-cat-name">{f.category}</span>
                  </div>
                  <span className="weight-badge">+{f.weight} pts</span>
                </div>

                {f.matchedSnippet && (
                  <div className="snippet-block">
                    {t.triggerSnippet} <span className="highlighted-snippet">"{f.matchedSnippet}"</span>
                  </div>
                )}

                <p className="finding-explanation">{f.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>
            {t.noEvidence}
          </p>
        )}
      </div>

      {/* 4. Actionable Incident Response Playbook */}
      <div className="section-panel">
        <div className="panel-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <h3 className="panel-title">{t.playbookTitle}</h3>
        </div>

        <div className="playbook-grid">
          {/* Step 1: Preventative */}
          <div className="playbook-card">
            <div className="playbook-step-title">
              <span>{t.step1Title}</span>
            </div>
            <p className="playbook-text">{getActionAdvice('notActed')}</p>
          </div>

          {/* Step 2: Compromised Details */}
          <div className="playbook-card">
            <div className="playbook-step-title">
              <span>{t.step2Title}</span>
            </div>
            <p className="playbook-text">{getActionAdvice('enteredDetails')}</p>
          </div>

          {/* Step 3: Financial Loss / OTP Compromise */}
          <div className="playbook-card urgent">
            <div className="playbook-step-title">
              <span>{t.step3Title}</span>
            </div>
            <p className="playbook-text">{getActionAdvice('paid')}</p>
          </div>
        </div>
      </div>

      {/* 5. National Emergency Cyber Fraud Hotline */}
      <div className="helpline-box">
        <div className="helpline-info">
          <h3>{t.helplineTitle}</h3>
          <p>{t.helplineDesc}</p>
        </div>

        <div className="helpline-cta-group">
          <a href="tel:1930" className="btn-dial" title="Dial 1930">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>{t.dial1930}</span>
          </a>

          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="link-portal"
          >
            <span>cybercrime.gov.in</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>

      {/* 6. Legal & Uncertainty Notice */}
      <div className="uncertainty-box">
        ⚖️ {t.legalNotice}
      </div>
    </section>
  );
};

export default TrustReport;
