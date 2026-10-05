// src/pages/Home.jsx
// Main Cyber Threat Analysis Workspace for TrustLens (Fully Multilingual)

import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { analyzeText, analyzeUrl, analyzeScreenshot } from '../services/api';
import TrustReport from '../components/report/TrustReport';
import EngineExplainer from '../components/info/EngineExplainer';
import { getTranslation } from '../utils/translations';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit (SRS IN-01)

const Home = ({ language = 'en', seniorMode, onSaveReportToHistory }) => {
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState('text'); // 'text', 'url', 'screenshot'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Screenshot Upload & OCR States
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl, name, size }
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [ocrExtractedText, setOcrExtractedText] = useState('');

  // Multilingual Attack Vector Presets
  const getPresets = () => [
    {
      title: t.presetBank,
      text: language === 'te'
        ? 'ఎస్బీఐ అలర్ట్: మీ నెట్‌బ్యాంకింగ్ ఖాతా కేవైసీ లేకపోవడం వల్ల 24 గంటల్లో రద్దు చేయబడుతుంది. వెంటనే తనిఖీ చేయండి.'
        : language === 'hi'
        ? 'एसबीआई अलर्ट: केवाईसी न होने के कारण आपका नेटबैंकिंग खाता 24 घंटे में ब्लॉक हो जाएगा। तुरंत सत्यापित करें।'
        : 'SBI Alert: Your netbanking account will be blocked within 24 hours due to pending KYC verification. Urgent action required immediately.'
    },
    {
      title: t.presetLottery,
      text: language === 'te'
        ? 'అభినందనలు! మీరు ₹25,000 నగదు బహుమతిని గెలుచుకున్నారు. వెంటనే క్లెయిమ్ చేయండి: bit.ly/win-cash. మీ ఆధార్ మరియు పాన్ కార్డ్ నమోదు చేయండి.'
        : language === 'hi'
        ? 'बधाई! आपने ₹25,000 का कैशबैक जीता है। तुरंत क्लेम करें: bit.ly/win-cash. अपना आधार और पैन कार्ड दर्ज करें।'
        : 'Congratulations! You have won ₹25,000 cashback prize. Claim your reward immediately: bit.ly/win-cash. Enter your Aadhaar and PAN card to receive funds.'
    },
    {
      title: t.presetOtp,
      text: language === 'te'
        ? 'ప్రియమైన కస్టమర్, మీ ఖాతాకు ₹3,450 రీఫండ్ జమ చేయడానికి దయచేసి మీ 6-అంకెల ఓటీపీ మరియు యూపీఐ పిన్ తెలపండి.'
        : language === 'hi'
        ? 'प्रिय ग्राहक, आपके ₹3,450 के रिफंड को खाते में भेजने के लिए कृपया अपना 6-अंकों का ओटीपी और यूपीआई पिन साझा करें।'
        : 'Dear customer, your refund of ₹3,450 is pending. Please share your 6-digit OTP and UPI PIN with our representative to credit the amount.'
    },
    {
      title: t.presetCourier,
      text: language === 'te'
        ? 'ఇండియా పోస్ట్: తప్పు చిరునామా కారణంగా మీ పార్సెల్ డెలివరీ చేయబడలేదు. వెంటనే చిరునామా సరిచేయండి: http://bit.ly/ind-post-delivery'
        : language === 'hi'
        ? 'इंडिया पोस्ट: गलत पते के कारण आपका पार्सल डिलीवर नहीं हो सका। अपना पता अभी सत्यापित करें: http://bit.ly/ind-post-delivery'
        : 'India Post: Your package #IN98412 cannot be delivered due to incorrect address. Confirm your address now: http://bit.ly/ind-post-delivery'
    },
    {
      title: t.presetSafe,
      text: language === 'te'
        ? 'శుభోదయం! కుటుంబ సభ్యులతో వారాంతాన్ని ఆనందంగా గడిపారని ఆశిస్తున్నాను. సాయంత్రం కలుద్దాం.'
        : language === 'hi'
        ? 'शुभ प्रभात! आशा है आपका सप्ताहांत परिवार के साथ अच्छा बीता होगा। शाम को मिलते हैं।'
        : 'Good morning! Hope you and the family had a restful weekend. Looking forward to our project catch-up later this afternoon.'
    }
  ];

  // Quick clipboard paste
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setError(null);
      }
    } catch {
      // In case clipboard permission is denied
    }
  };

  const handleClear = () => {
    setInputText('');
    setReport(null);
    setError(null);
  };

  // General text/URL analysis
  const handleAnalyze = async (e) => {
    e.preventDefault();
    const textToAnalyze = activeTab === 'screenshot' ? ocrExtractedText.trim() : inputText.trim();

    if (!textToAnalyze && !(activeTab === 'screenshot' && selectedImage?.file)) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      if (activeTab === 'url') {
        data = await analyzeUrl(textToAnalyze, language, seniorMode);
      } else if (activeTab === 'screenshot') {
        data = await analyzeScreenshot(textToAnalyze, language, seniorMode, selectedImage?.file);
      } else {
        data = await analyzeText(textToAnalyze, language, seniorMode);
      }

      setReport(data);

      // Save to local history
      if (onSaveReportToHistory) {
        onSaveReportToHistory({
          ...data,
          inputText: textToAnalyze.slice(0, 100),
          analyzedAt: new Date().toISOString()
        });
      }

      // Smooth scroll to report
      setTimeout(() => {
        const el = document.getElementById('trust-report-result');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError(err.message || 'Unable to connect to analysis engine. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setInputText(preset.text);
    setError(null);
    setReport(null);
  };

  // Screenshot Upload & Processing Logic
  const processSelectedImage = async (file) => {
    setError(null);
    setReport(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a PNG, JPEG, or WebP screenshot.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image file is too large. Maximum supported size is 10 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeFormatted = (file.size / 1024 < 1024)
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setSelectedImage({
      file,
      previewUrl,
      name: file.name,
      size: sizeFormatted
    });

    setOcrLoading(true);
    setOcrProgress(0);
    setOcrConfidence(null);
    setOcrExtractedText('');

    try {
      let langCode = 'eng';
      if (language === 'hi') langCode = 'hin';
      else if (language === 'te') langCode = 'tel';

      const result = await Tesseract.recognize(file, langCode, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const extracted = result.data.text.trim();
      setOcrExtractedText(extracted);
      setOcrConfidence(Math.round(result.data.confidence || 0));

      if (!extracted) {
        setError('No text could be clearly recognized in this image. You can type or paste the message manually below.');
      }
    } catch (err) {
      console.warn('OCR processing error, offering manual input:', err);
      setError('OCR extraction encountered a network or engine timeout. You can still review the image and type/paste the text below.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    setOcrExtractedText('');
    setOcrConfidence(null);
    setReport(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="site-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{t.heroPill}</span>
        </div>

        <h1 className="hero-title">{t.heroTitle}</h1>
        <p className="hero-tagline">{t.heroTagline}</p>
        <p className="hero-desc">{t.heroDesc}</p>

        {/* Trust Badges Strip */}
        <div className="trust-strip">
          <div className="trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>{t.trustAccuracy}</span>
          </div>
          <div className="trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>{t.trustPrivacy}</span>
          </div>
          <div className="trust-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>{t.trustHelpline}</span>
          </div>
        </div>
      </section>

      {/* 2. Main Analysis Card */}
      <section className="scanner-card">
        {/* Three Input Tabs */}
        <div className="scanner-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'text'}
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => { setActiveTab('text'); setError(null); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{t.tabText}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'url'}
            className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => { setActiveTab('url'); setError(null); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>{t.tabUrl}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'screenshot'}
            className={`tab-btn ${activeTab === 'screenshot' ? 'active' : ''}`}
            onClick={() => { setActiveTab('screenshot'); setError(null); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>{t.tabScreenshot}</span>
          </button>
        </div>

        {/* Tab Workspace Body */}
        <div className="scanner-body">
          {/* Preset Attack Scenarios Bar */}
          {activeTab !== 'screenshot' && (
            <div className="presets-section">
              <span className="presets-label">{t.presetsLabel}</span>
              <div className="presets-list">
                {getPresets().map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip"
                    onClick={() => handleSelectPreset(p)}
                    title="Load sample test case"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 1: Paste Text */}
          {activeTab === 'text' && (
            <form onSubmit={handleAnalyze}>
              <div className="input-label-row">
                <label htmlFor="threat-text" className="input-label">
                  {t.textLabel}
                </label>
                <span className="char-counter">
                  {inputText.length} / 5000 {t.charCounter}
                </span>
              </div>

              <textarea
                id="threat-text"
                className="scanner-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.textPlaceholder}
                rows={5}
                required
              />

              <div className="scanner-actions">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="btn-secondary"
                    title="Paste from clipboard"
                  >
                    {t.pasteClipboard}
                  </button>
                  {inputText && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="btn-secondary"
                      title="Clear input"
                    >
                      {t.clear}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-analyze"
                  disabled={loading || !inputText.trim()}
                >
                  {loading ? (
                    <>
                      <span className="status-dot" style={{ background: '#fff' }}></span>
                      <span>{t.inspectingButton}</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <span>{t.inspectButton}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Check Link */}
          {activeTab === 'url' && (
            <form onSubmit={handleAnalyze}>
              <div className="input-label-row">
                <label htmlFor="threat-url" className="input-label">
                  {t.urlLabel}
                </label>
              </div>

              <input
                id="threat-url"
                type="text"
                className="scanner-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.urlPlaceholder}
                required
              />

              <div className="scanner-actions" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="btn-secondary"
                >
                  {t.pasteClipboard}
                </button>

                <button
                  type="submit"
                  className="btn-analyze"
                  disabled={loading || !inputText.trim()}
                >
                  {loading ? t.inspectingUrlButton : t.inspectUrlButton}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Screenshot Upload (OCR) */}
          {activeTab === 'screenshot' && (
            <div>
              {/* Native Windows File Input */}
              <input
                ref={fileInputRef}
                type="file"
                id="screenshot-file-input"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0
                }}
                aria-label={t.dropzoneTitle}
              />

              {!selectedImage ? (
                /* Empty State Dropzone */
                <div
                  className={`ocr-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    cursor: 'pointer',
                    borderColor: isDragging ? '#38bdf8' : undefined,
                    background: isDragging ? 'rgba(56, 189, 248, 0.08)' : undefined
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                >
                  <div className="ocr-icon-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
                    {t.dropzoneTitle}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                    {t.dropzoneDesc}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="btn-analyze"
                    style={{ margin: '0 auto' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>{t.browseButton}</span>
                  </button>
                </div>
              ) : (
                /* Image Loaded & OCR Preview Area */
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img
                        src={selectedImage.previewUrl}
                        alt="Screenshot preview"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border-strong)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                          {selectedImage.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Size: {selectedImage.size}
                          {ocrConfidence !== null && ` • OCR Confidence: ${ocrConfidence}%`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        {t.changeImage}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-secondary"
                        style={{ color: '#f87171', fontSize: '0.85rem' }}
                      >
                        {t.removeImage}
                      </button>
                    </div>
                  </div>

                  {/* OCR Progress Indicator */}
                  {ocrLoading && (
                    <div style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem' }}>
                        {t.ocrProgressText} {ocrProgress}%
                      </div>
                      <div className="threat-meter" style={{ height: '6px', maxWidth: '300px', margin: '0 auto' }}>
                        <div className="threat-meter-fill low" style={{ width: `${ocrProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {/* Editable Extracted Text */}
                  <form onSubmit={handleAnalyze}>
                    <div className="input-label-row">
                      <label htmlFor="ocr-text-edit" className="input-label">
                        {t.extractedTextLabel}
                      </label>
                      <span className="char-counter">
                        {ocrExtractedText.length} {t.charCounter}
                      </span>
                    </div>

                    <textarea
                      id="ocr-text-edit"
                      className="scanner-textarea"
                      value={ocrExtractedText}
                      onChange={(e) => setOcrExtractedText(e.target.value)}
                      placeholder={ocrLoading ? t.ocrProgressText : t.extractedTextPlaceholder}
                      rows={5}
                      required
                    />

                    {ocrConfidence !== null && ocrConfidence < 60 && (
                      <p style={{ fontSize: '0.82rem', color: '#fcd34d', marginBottom: '1rem' }}>
                        {t.ocrLowConfidence}
                      </p>
                    )}

                    <div className="scanner-actions">
                      <button
                        type="button"
                        onClick={() => processSelectedImage(selectedImage.file)}
                        className="btn-secondary"
                        disabled={ocrLoading}
                        title="Re-run text extraction"
                      >
                        {t.rerunOcr}
                      </button>

                      <button
                        type="submit"
                        className="btn-analyze"
                        disabled={loading || ocrLoading || !ocrExtractedText.trim()}
                      >
                        {loading ? t.inspectingScreenshotButton : t.inspectScreenshotButton}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. The Evidence-Based Trust Report (Centerpiece) */}
      {report && (
        <TrustReport
          report={report}
          language={language}
          onNewScan={() => {
            setReport(null);
            setInputText('');
            handleRemoveImage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 4. Architectural Transparency Section */}
      <EngineExplainer language={language} />
    </main>
  );
};

export default Home;
