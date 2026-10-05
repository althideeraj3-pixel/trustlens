const { generateStructuredAnalysis } = require('./aiService');
const {
  extractGroundedClaims,
  validateEvidence,
  validateIndicators,
  validateRequestedData
} = require('./claimExtractor');
const { createFallbackExplanation } = require('./aiFallback');
const { buildPrompt } = require('./promptBuilder');

const LANGUAGES = ['en', 'te', 'hi'];
const MAX_TEXT_LENGTH = 1200;
const MAX_LIST_LENGTH = 20;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const requiredText = (value, fieldName) => {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT_LENGTH) {
    throw new TypeError(`AI response has invalid ${fieldName}.`);
  }
  return value.trim();
};

const boundedStringList = (value, fieldName, limit = MAX_LIST_LENGTH) => {
  if (!Array.isArray(value) || value.length > limit) {
    throw new TypeError(`AI response has invalid ${fieldName}.`);
  }
  return value.map((item) => requiredText(item, fieldName));
};

const isSafeAction = (action) => !(
  /\b(?:share|send|reveal|tell|provide|enter|type|read out)\b.{0,60}\b(?:password|passcode|otp|one[- ]time code|pin|cvv|cvc|upi)\b/i.test(action) ||
  /\b(?:pay|transfer|deposit)\b.{0,60}\b(?:fee|prize|reward|verification)\b/i.test(action)
);

const parseStructuredResponse = (response) => {
  if (typeof response === 'string') return JSON.parse(response);
  if (isObject(response)) return response;
  throw new TypeError('AI response must be a JSON object.');
};

const validateResponse = (response, context = {}) => {
  const parsed = parseStructuredResponse(response);
  const {
    report = {},
    evidenceSources = [],
    findings = [],
    media = null,
    language = 'en',
    limitations = []
  } = context;

  if (
    !Array.isArray(parsed.recommendedActions) ||
    parsed.recommendedActions.length > 5 ||
    !isObject(parsed.translations) ||
    typeof parsed.confidence !== 'number' ||
    !Number.isFinite(parsed.confidence) ||
    parsed.confidence < 0 ||
    parsed.confidence > 1 ||
    !LANGUAGES.includes(parsed.language) ||
    !LANGUAGES.includes(language)
  ) {
    throw new TypeError('AI response does not match the required structure.');
  }

  const translations = {};
  for (const code of LANGUAGES) {
    const translation = parsed.translations[code];
    if (!isObject(translation)) {
      throw new TypeError('AI response is missing a required language translation.');
    }
    translations[code] = {
      summary: requiredText(translation.summary, `translations.${code}.summary`),
      riskExplanation: requiredText(translation.riskExplanation, `translations.${code}.riskExplanation`)
    };
  }

  const evidenceResult = validateEvidence({
    evidence: parsed.evidence,
    evidenceSources,
    findings,
    media,
    allowedUrls: evidenceSources.map((source) => source.sourceUrl).filter(Boolean)
  });
  const aiActions = boundedStringList(parsed.recommendedActions, 'recommendedActions', 5).filter(isSafeAction);
  const recommendedActions = [
    report.actions?.notActed,
    ...aiActions
  ].filter(Boolean).filter((action, index, actions) => actions.indexOf(action) === index).slice(0, 5);

  return {
    mode: 'ai',
    summary: requiredText(parsed.summary, 'summary'),
    explanation: requiredText(parsed.riskExplanation, 'riskExplanation'),
    riskExplanation: requiredText(parsed.riskExplanation, 'riskExplanation'),
    claims: extractGroundedClaims(parsed.claims, evidenceResult.evidenceById),
    evidence: evidenceResult.evidence,
    suspiciousIndicators: validateIndicators(parsed.suspiciousIndicators, evidenceResult.evidenceById),
    requestedData: validateRequestedData(parsed.requestedData, evidenceResult.evidenceById),
    recommendedActions,
    verificationNeeded: report.riskLevel !== 'Low' || report.verificationStatus !== 'Clean',
    uncertainty: requiredText(parsed.uncertainty, 'uncertainty'),
    confidence: parsed.confidence,
    language,
    translations,
    limitations: [...new Set([
      ...limitations,
      ...boundedStringList(parsed.limitations, 'limitations')
    ])]
  };
};

const safeFailureCode = (error) => {
  if (typeof error?.code === 'string' && /^GEMINI_[A-Z0-9_]+$/.test(error.code)) return error.code;
  if (error?.code === 'AI_NOT_CONFIGURED' || error?.code === 'AI_PROVIDER_UNAVAILABLE') return error.code;
  if (error instanceof SyntaxError) return 'AI_INVALID_JSON';
  if (error instanceof TypeError) return 'AI_INVALID_RESPONSE';
  return 'AI_PROVIDER_ERROR';
};

const addAiExplanation = async (report, options = {}) => {
  try {
    const prompt = buildPrompt({ report, ...options });
    const response = await generateStructuredAnalysis({
      ...prompt,
      media: options.media || null
    });
    const aiAnalysis = validateResponse(response, {
      report,
      evidenceSources: prompt.evidenceSources,
      findings: prompt.findings,
      media: options.media || null,
      language: options.language || 'en',
      limitations: options.limitations || []
    });
    return { ...report, aiAnalysis };
  } catch (error) {
    const failureCode = safeFailureCode(error);
    console.warn(`AI analysis unavailable (${failureCode}); deterministic fallback used.`);
    return {
      ...report,
      aiAnalysis: createFallbackExplanation(report, options.seniorMode, {
        language: options.language,
        limitations: options.limitations,
        inputType: options.inputType
      })
    };
  }
};

module.exports = {
  addAiExplanation,
  validateResponse
};
