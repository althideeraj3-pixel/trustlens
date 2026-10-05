// controllers/analyzeController.js
// Handles forensic analysis for Text, URLs, Screenshots, Instagram/YouTube Videos, and News Articles.

const analysisService = require('../services/analysisService');
const Analysis = require('../models/Analysis');
const fs = require('fs');
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const parseOptionalImage = (imageData, imageMimeType) => {
  if (!imageData && !imageMimeType) return null;
  if (
    typeof imageData !== 'string' ||
    !ALLOWED_IMAGE_TYPES.has(imageMimeType) ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageData)
  ) {
    const error = new Error('Please provide a valid PNG, JPEG, or WebP image.');
    error.status = 400;
    throw error;
  }
  const buffer = Buffer.from(imageData, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    const error = new Error('Image file is too large or invalid. Maximum supported size is 10 MB.');
    error.status = 400;
    throw error;
  }
  return { kind: 'image', dataBase64: imageData, mimeType: imageMimeType };
};

// Helper to save report to database if possible
const saveAnalysisDocument = async (req, reportData, inputType, rawInput, url = null) => {
  try {
    const doc = await Analysis.create({
      userId: req.user ? req.user._id : null,
      inputType,
      inputSummary: rawInput ? rawInput.slice(0, 120) : '',
      rawInput: rawInput ? rawInput.slice(0, 1000) : '',
      extractedText: reportData.extractedText || '',
      url: url || reportData.url || '',
      riskLevel: reportData.riskLevel,
      score: reportData.score,
      summary: reportData.summary,
      findings: reportData.findings || [],
      dataRequests: reportData.dataRequests || [],
      actions: reportData.actions || {},
      sourceMetadata: reportData.sourceMetadata || {},
      verificationStatus: reportData.verificationStatus || 'Needs Verification',
      language: req.body.language || 'en',
      uncertainty: reportData.uncertainty || '',
      aiAnalysis: reportData.aiAnalysis
    });
    return doc._id;
  } catch (err) {
    console.warn('Notice: Could not persist analysis record to MongoDB (REPORT_PERSISTENCE_FAILED).');
    return null;
  }
};

// @desc    Analyze pasted message or SMS text
// @route   POST /api/analyze/text
// @access  Public (Optional User)
const analyzeText = async (req, res, next) => {
  try {
    const { text, language = 'en', seniorMode = false } = req.body;

    if (!text || text.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid text to analyze (at least 5 characters).'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Text exceeds maximum allowed length of 5000 characters.'
      });
    }

    const report = await analysisService.analyzeText(text, { language, seniorMode });
    const analysisId = await saveAnalysisDocument(req, report, 'text', text);

    res.status(200).json({
      success: true,
      data: {
        ...report,
        analysisId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze website URL safety & SSRF
// @route   POST /api/analyze/url
// @access  Public (Optional User)
const analyzeUrl = async (req, res, next) => {
  try {
    const { url, language = 'en', seniorMode = false } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid web address to inspect.' });
    }

    const urlReport = await analysisService.analyzeUrl(url, { language, seniorMode });

    const analysisId = await saveAnalysisDocument(req, urlReport, 'url', url, url);

    res.status(200).json({
      success: true,
      data: {
        ...urlReport,
        analysisId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze screenshot text / OCR
// @route   POST /api/analyze/screenshot
// @access  Public (Optional User)
const analyzeScreenshot = async (req, res, next) => {
  try {
    const {
      extractedText = '',
      imageData,
      imageMimeType,
      language = 'en',
      seniorMode = false
    } = req.body;

    const image = parseOptionalImage(imageData, imageMimeType);
    if ((!extractedText || extractedText.trim().length < 5) && !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide extracted screenshot text or a supported image to inspect.'
      });
    }

    const report = await analysisService.analyzeScreenshot(extractedText, { language, seniorMode, image });
    const analysisId = await saveAnalysisDocument(req, report, 'screenshot', extractedText);

    res.status(200).json({
      success: true,
      data: {
        ...report,
        analysisId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze Instagram Reel or YouTube Video link
// @route   POST /api/analyze/video
// @access  Public (Optional User)
const analyzeVideo = async (req, res, next) => {
  try {
    const {
      url = '',
      caption = '',
      platformHint = 'auto',
      language = 'en'
    } = req.body;
    const seniorMode = req.body.seniorMode === true || req.body.seniorMode === 'true';

    if (!url && !req.file) {
      return res.status(400).json({ success: false, message: 'Please provide a YouTube or Instagram video link, or upload a video file.' });
    }
    if (typeof url !== 'string' || typeof caption !== 'string' || typeof platformHint !== 'string') {
      return res.status(400).json({ success: false, message: 'Video URL, caption, and platform hint must be strings.' });
    }

    try {
      const report = await analysisService.analyzeVideo(url || '', caption, platformHint, {
        language,
        seniorMode,
        uploadedFile: req.file
      });
      const analysisId = await saveAnalysisDocument(
        req,
        report,
        'video',
        `${url || ''} ${caption}`.slice(0, 1000),
        url || ''
      );

      res.status(200).json({
        success: true,
        data: {
          ...report,
          analysisId
        }
      });
    } finally {
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => {
          console.warn('Temporary video cleanup failed (VIDEO_TEMP_CLEANUP_ERROR).');
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze News or Article URL / Claims
// @route   POST /api/analyze/news
// @access  Public (Optional User)
const analyzeNews = async (req, res, next) => {
  try {
    const { url = '', title = '', articleBody = '', language = 'en', seniorMode = false } = req.body;

    if (![url, title, articleBody].some((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide an article URL, headline, or article text.' });
    }
    if ([url, title, articleBody].some((value) => typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Article URL, headline, and article text must be strings.' });
    }

    const report = await analysisService.analyzeNews(url, title, articleBody, { language, seniorMode });
    const analysisId = await saveAnalysisDocument(req, report, 'news', `${title} ${url}`.slice(0, 1000), url);

    res.status(200).json({
      success: true,
      data: {
        ...report,
        analysisId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeText,
  analyzeUrl,
  analyzeScreenshot,
  analyzeVideo,
  analyzeNews
};
