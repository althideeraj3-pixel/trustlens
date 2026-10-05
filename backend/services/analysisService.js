const { analyzeInput } = require('../engine');
const { analyzeUrlSafety } = require('./urlService');
const { analyzeVideoUrl } = require('./videoService');
const { analyzeNewsArticle } = require('./newsService');
const { addAiExplanation } = require('./ai/explanationService');
const { redactSourceUrl } = require('./ai/promptBuilder');

const withAiExplanation = async (report, inputText, inputType, options = {}) => (
  addAiExplanation(report, {
    inputText,
    inputType,
    language: options.language,
    seniorMode: options.seniorMode,
    evidenceSources: options.evidenceSources,
    media: options.media,
    limitations: options.limitations
  })
);

const analyzeText = async (text, options = {}) => {
  const report = analyzeInput(text, options.language);
  return withAiExplanation(report, text, 'text', {
    ...options,
    evidenceSources: [{
      sourceType: 'user_provided',
      label: 'Text supplied by the user',
      text
    }]
  });
};

const analyzeScreenshot = async (extractedText, options = {}) => {
  const report = analyzeInput(extractedText || 'No OCR text could be extracted from the supplied screenshot.', options.language);
  if (!extractedText) {
    report.uncertainty = 'No screenshot text was extracted. Any multimodal analysis is limited to the image details Gemini can interpret.';
  }
  return withAiExplanation(report, extractedText, 'screenshot', {
    ...options,
    evidenceSources: extractedText ? [{
      sourceType: 'user_provided',
      label: 'OCR or text supplied by the user',
      text: extractedText
    }] : [],
    media: options.image || null
  });
};

const analyzeUrl = async (url, options = {}) => {
  const report = analyzeUrlSafety(url);
  report.actions = {
    notActed: 'Do not click links or enter passwords on unverified domains. Check the domain spelling carefully.',
    enteredDetails: 'If you submitted credentials on this site, change your passwords on the authentic service immediately.',
    paid: 'If you authorized payments on this site, alert your bank at once and call National Cyber Helpline 1930.'
  };
  report.uncertainty = 'URL inspection evaluates lexical, structural, and security anomalies. It does not replace live browser sandboxing.';
  return withAiExplanation(report, report.url, 'url', {
    ...options,
    evidenceSources: [{
      sourceType: 'user_provided',
      label: 'URL supplied by the user',
      text: redactSourceUrl(report.url)
    }]
  });
};

const analyzeVideo = async (url, caption = '', platformHint = 'auto', options = {}) => {
  const report = analyzeVideoUrl(url, caption, platformHint, options.uploadedFile || null);
  const media = options.uploadedFile
    ? {
      kind: 'videoFile',
      filePath: options.uploadedFile.path,
      mimeType: options.uploadedFile.mimetype,
      fileName: options.uploadedFile.originalname
    }
    : report.platform === 'YouTube'
      ? { kind: 'youtube', url: report.url }
      : null;
  const limitations = report.platform === 'Instagram'
    ? ['Content could not be directly inspected. Analysis is limited to the user-supplied caption or text.']
    : [];
  const evidenceSources = caption ? [{
    sourceType: 'user_provided',
    label: 'Caption or text supplied by the user',
    text: caption
  }] : [];
  if (report.url) {
    evidenceSources.push({
      sourceType: 'user_provided',
      label: 'Public video URL supplied by the user',
      text: redactSourceUrl(report.url),
      sourceUrl: report.url
    });
  }
  return withAiExplanation(report, caption, 'video', {
    ...options,
    media,
    limitations,
    evidenceSources
  });
};

const analyzeNews = async (url, title = '', articleBody = '', options = {}) => {
  const result = await analyzeNewsArticle(url, title, articleBody);
  const urlSource = result.report.url ? [{
    sourceType: 'user_provided',
    label: 'Article URL supplied by the user',
    text: redactSourceUrl(result.report.url),
    sourceUrl: result.report.url
  }] : [];
  return withAiExplanation(result.report, result.aiInputText, 'news', {
    ...options,
    evidenceSources: [...result.evidenceSources, ...urlSource],
    limitations: result.limitations
  });
};

module.exports = {
  analyzeText,
  analyzeScreenshot,
  analyzeUrl,
  analyzeVideo,
  analyzeNews
};
