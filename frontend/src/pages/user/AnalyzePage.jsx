// src/pages/user/AnalyzePage.jsx
// Multi-vector Threat Workspace supporting:
// 1. Text/Message (WhatsApp, SMS, Email)
// 2. Screenshot (Native file picker + Tesseract OCR)
// 3. Website URL (SSRF protected lexical scanner)
// 4. Instagram Reel URL (Caption & metadata verification)
// 5. YouTube Video URL (Transcript & claim verification)
// 6. News/Article URL (Sensationalism & source verifiability)

import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import {
  analyzeText,
  analyzeUrl,
  analyzeScreenshot,
  analyzeVideo,
  analyzeNews
} from '../../services/api';
import TrustReport from '../../components/report/TrustReport';
import { getTranslation } from '../../utils/translations';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg',
  'video/3gpp', 'video/x-msvideo', 'video/x-flv', 'video/x-ms-wmv'
]);
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

const AnalyzePage = ({ language = 'en', seniorMode = false }) => {
  const t = getTranslation(language);
  const appText = t.app;
  const [activeVector, setActiveVector] = useState('text'); // 'text' | 'screenshot' | 'url' | 'instagram' | 'youtube' | 'news'

  // Input states
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [newsUrl, setNewsUrl] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');

  // Screenshot OCR states
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtractedText, setOcrExtractedText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(null);

  // Execution states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Quick preset attack scenarios
  const presets = [
    {
      title: '⚡ Electricity Bill Threat',
      type: 'text',
      text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM from the power station because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210 or install http://bit.ly/power-bill-update'
    },
    {
      title: '🏦 SBI KYC Expiry Alert',
      type: 'text',
      text: 'SBI Alert: Your netbanking account will be blocked within 24 hours due to pending KYC verification. Urgent action required immediately: http://bit.ly/sbi-kyc-verify'
    },
    {
      title: '📦 India Post Delivery Delay',
      type: 'text',
      text: 'India Post: Your package #IN98412 cannot be delivered due to incorrect address. Confirm your address now to avoid return: http://bit.ly/ind-post-delivery'
    },
    {
      title: '💸 Lottery / Cashback Trap',
      type: 'text',
      text: 'Congratulations! You have won ₹25,000 cashback prize from Google Pay. Claim your reward immediately: http://bit.ly/gpay-reward-claim. Enter your UPI PIN to claim.'
    },
    {
      title: '🚨 Digital Arrest Scare',
      type: 'text',
      text: 'TRAI & Cyber Crime Department: A parcel in your name containing illegal passports and drugs has been intercepted at Mumbai Customs. Your mobile number will be blocked. Join Skype interrogation immediately to avoid digital arrest warrant.'
    }
  ];

  // OCR Processing
  const processSelectedImage = async (file) => {
    setError(null);
    setReport(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(appText.unsupportedImage);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(appText.imageTooLarge);
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
        setError(appText.noOcrText);
      }
    } catch (err) {
      console.warn('OCR error:', err);
      setError(appText.ocrFailed);
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

  // Execution Handler
  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      let result;
      if (activeVector === 'text') {
        if (!textInput.trim()) {
          setError(appText.needText);
          setLoading(false);
          return;
        }
        result = await analyzeText(textInput.trim(), language, seniorMode);
      } else if (activeVector === 'screenshot') {
        const textToScan = ocrExtractedText.trim() || textInput.trim();
        if (!textToScan && !selectedImage?.file) {
          setError(appText.needScreenshot);
          setLoading(false);
          return;
        }
        result = await analyzeScreenshot(textToScan, language, seniorMode, selectedImage?.file);
      } else if (activeVector === 'url') {
        if (!urlInput.trim()) {
          setError(appText.needWebsite);
          setLoading(false);
          return;
        }
        result = await analyzeUrl(urlInput.trim(), language, seniorMode);
      } else if (activeVector === 'instagram') {
        if (!videoUrl.trim()) {
          setError(appText.needInstagram);
          setLoading(false);
          return;
        }
        result = await analyzeVideo(videoUrl.trim(), videoCaption.trim(), 'instagram', language, seniorMode);
      } else if (activeVector === 'youtube') {
        if (!videoUrl.trim() && !selectedVideoFile) {
          setError(appText.needYoutube);
          setLoading(false);
          return;
        }
        result = await analyzeVideo(
          videoUrl.trim(),
          videoCaption.trim(),
          'youtube',
          language,
          seniorMode,
          selectedVideoFile
        );
      } else if (activeVector === 'news') {
        if (!newsUrl.trim() && !newsTitle.trim() && !newsBody.trim()) {
          setError(appText.needArticle);
          setLoading(false);
          return;
        }
        result = await analyzeNews(newsUrl.trim(), newsTitle.trim(), newsBody.trim(), language, seniorMode);
      }

      setReport(result);
      setTimeout(() => {
        const el = document.getElementById('trust-report-result');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Threat scan failed. Ensure backend service is reachable on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async (setter) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setter(text);
    } catch {}
  };

  return (
    <div>
      {/* Workspace Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {appText.scannerTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {appText.scannerDesc}
        </p>
      </div>

      {/* Attack Vector Tabs */}
      <div className="vector-nav">
        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'text' ? 'active' : ''}`}
          onClick={() => { setActiveVector('text'); setError(null); }}
        >
          <span>💬</span>
          <span>{appText.textMessages}</span>
        </button>

        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'screenshot' ? 'active' : ''}`}
          onClick={() => { setActiveVector('screenshot'); setError(null); }}
        >
          <span>📸</span>
          <span>{appText.screenshotOcr}</span>
        </button>

        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'url' ? 'active' : ''}`}
          onClick={() => { setActiveVector('url'); setError(null); }}
        >
          <span>🌐</span>
          <span>{appText.websiteUrl}</span>
        </button>

        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'instagram' ? 'active' : ''}`}
          onClick={() => { setActiveVector('instagram'); setError(null); }}
        >
          <span>📷</span>
          <span>{appText.instagramReel}</span>
        </button>

        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'youtube' ? 'active' : ''}`}
          onClick={() => { setActiveVector('youtube'); setError(null); }}
        >
          <span>▶️</span>
          <span>{appText.youtubeVideo}</span>
        </button>

        <button
          type="button"
          className={`vector-tab-btn ${activeVector === 'news' ? 'active' : ''}`}
          onClick={() => { setActiveVector('news'); setError(null); }}
        >
          <span>📰</span>
          <span>{appText.newsArticles}</span>
        </button>
      </div>

      {/* Preset Scenarios (Visible on Text/Screenshot vectors) */}
      {(activeVector === 'text' || activeVector === 'screenshot') && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            {appText.sampleScenarios}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="demo-account-btn"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => {
                  setTextInput(preset.text);
                  setError(null);
                  setReport(null);
                }}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="scanner-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleRunAnalysis}>
          {/* VECTOR 1: TEXT / MESSAGE */}
          {activeVector === 'text' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  {appText.suspiciousMessageLabel}
                </label>
                <button
                  type="button"
                  className="btn-paste"
                  onClick={() => handlePasteClipboard(setTextInput)}
                >
                  {appText.pasteClipboard}
                </button>
              </div>
              <textarea
                className="scanner-textarea"
                rows="5"
                placeholder={appText.messagePlaceholder}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
          )}

          {/* VECTOR 2: SCREENSHOT OCR */}
          {activeVector === 'screenshot' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!selectedImage ? (
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '2px dashed var(--border-strong)', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.01)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {appText.browseDropScreenshot}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {appText.supportedImage}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: '1rem', padding: '0.45rem 1.25rem' }}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    {appText.selectScreenshot}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start', background: '#090d16', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <img
                    src={selectedImage.previewUrl}
                    alt={appText.uploadedEvidence}
                    style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-strong)' }}
                  />
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedImage.name}</strong>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', color: '#f87171' }}
                      >
                        {appText.remove}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {appText.fileSize}: {selectedImage.size}
                    </div>

                    {ocrLoading ? (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginBottom: '0.35rem' }}>
                          ⚡ {appText.ocrProgress} {ocrProgress}%
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${ocrProgress}%`, height: '100%', background: '#38bdf8', transition: 'width 0.2s' }}></div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {appText.extractedText} {ocrConfidence !== null && `(Confidence: ${ocrConfidence}%)`}:
                          </span>
                        </div>
                        <textarea
                          className="scanner-textarea"
                          rows="3"
                          value={ocrExtractedText}
                          onChange={(e) => setOcrExtractedText(e.target.value)}
                          placeholder={appText.extractedScreenshotPlaceholder}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VECTOR 3: WEBSITE URL */}
          {activeVector === 'url' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  {appText.suspiciousUrlLabel}
                </label>
                <button
                  type="button"
                  className="btn-paste"
                  onClick={() => handlePasteClipboard(setUrlInput)}
                >
                  {appText.pasteUrl}
                </button>
              </div>
              <input
                type="url"
                className="form-input"
                placeholder="https://bit.ly/update-kyc or https://secure-bank-login.xyz"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ width: '100%', height: '46px', fontSize: '0.95rem' }}
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                🔒 {appText.safeUrlNote}
              </div>
            </div>
          )}

          {/* VECTOR 4: INSTAGRAM REEL */}
          {activeVector === 'instagram' && (
            <div>
              <div className="form-group">
                <label className="form-label">{appText.instagramUrlLabel}</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.instagram.com/reel/C7xyz123..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{ height: '44px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{appText.captionClaimsLabel}</label>
                <textarea
                  className="scanner-textarea"
                  rows="3"
                  placeholder={appText.captionPlaceholder}
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ {appText.instagramLimit}
              </div>
            </div>
          )}

          {/* VECTOR 5: YOUTUBE VIDEO */}
          {activeVector === 'youtube' && (
            <div>
              <div className="form-group">
                <label className="form-label">{appText.youtubeUrlLabel}</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{ height: '44px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{appText.videoTextLabel}</label>
                <textarea
                  className="scanner-textarea"
                  rows="3"
                  placeholder={appText.videoTextPlaceholder}
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="video-file-input">{appText.videoUploadLabel}</label>
                <input
                  id="video-file-input"
                  className="form-input"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/mpeg,video/3gpp,video/x-msvideo,video/x-flv,video/x-ms-wmv"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (!file) return;
                    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
                      setError(appText.unsupportedVideo);
                      event.target.value = '';
                      setSelectedVideoFile(null);
                      return;
                    }
                    if (file.size > MAX_VIDEO_SIZE_BYTES) {
                      setError(appText.videoTooLarge);
                      event.target.value = '';
                      setSelectedVideoFile(null);
                      return;
                    }
                    setError(null);
                    setSelectedVideoFile(file);
                  }}
                />
                {selectedVideoFile && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {appText.selected}: {selectedVideoFile.name} ({(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => {
                        setSelectedVideoFile(null);
                        const input = document.getElementById('video-file-input');
                        if (input) input.value = '';
                      }}
                    >
                      {appText.remove}
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ {appText.videoAnalysisNote}
              </div>
            </div>
          )}

          {/* VECTOR 6: NEWS / ARTICLE */}
          {activeVector === 'news' && (
            <div>
              <div className="form-group">
                <label className="form-label">{appText.articleUrlLabel}</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://news-portal.com/story-headline"
                  value={newsUrl}
                  onChange={(e) => setNewsUrl(e.target.value)}
                  style={{ height: '44px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{appText.headlineLabel}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Headline of the story..."
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{appText.articleContentLabel}</label>
                <textarea
                  className="scanner-textarea"
                  rows="3"
                  placeholder={appText.articlePlaceholder}
                  value={newsBody}
                  onChange={(e) => setNewsBody(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setTextInput('');
                setUrlInput('');
                setVideoUrl('');
                setVideoCaption('');
                setNewsUrl('');
                setNewsTitle('');
                setNewsBody('');
                handleRemoveImage();
              }}
            >
              {t.clear}
            </button>

            <button
              type="submit"
              className="btn-analyze"
              disabled={loading || ocrLoading}
              style={{ minWidth: '160px', height: '44px' }}
            >
              {loading ? appText.evaluating : `${appText.executeScan} 🛡️`}
            </button>
          </div>
        </form>
      </div>

      {/* Rendered Trust Report Result */}
      {report && (
        <div id="trust-report-result">
          <TrustReport report={report} language={language} />
        </div>
      )}
    </div>
  );
};

export default AnalyzePage;
