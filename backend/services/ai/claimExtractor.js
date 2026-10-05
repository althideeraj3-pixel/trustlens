const MAX_CLAIMS = 10;
const MAX_EVIDENCE = 30;
const EVIDENCE_SOURCES = new Set([
  'user_provided',
  'retrieved',
  'deterministic_rule',
  'ai_visual_interpretation'
]);
const DATA_SENSITIVITY = new Set(['Caution', 'High', 'Critical']);

const boundedText = (value, limit = 800) => (
  typeof value === 'string' ? value.trim().slice(0, limit) : ''
);

const validateEvidence = ({
  evidence,
  evidenceSources = [],
  findings = [],
  media = null,
  allowedUrls = []
}) => {
  if (!Array.isArray(evidence)) {
    throw new TypeError('AI evidence must be an array.');
  }

  const sourceMap = new Map(evidenceSources.map((source) => [source.evidenceId, source]));
  const findingMap = new Map(findings.map((finding) => [finding.evidenceId, finding]));
  const seen = new Map();
  const validatedEvidence = [];

  for (const item of evidence.slice(0, MAX_EVIDENCE)) {
    if (!item || typeof item.evidenceId !== 'string' || !EVIDENCE_SOURCES.has(item.sourceType)) continue;
    const quote = boundedText(item.quote, 500);
    const interpretation = boundedText(item.interpretation);
    const source = sourceMap.get(item.evidenceId);
    const finding = findingMap.get(item.evidenceId);
    let grounded = false;

    if (item.sourceType === 'user_provided' || item.sourceType === 'retrieved') {
      grounded = Boolean(
        source &&
        source.sourceType === item.sourceType &&
        quote &&
        source.text.includes(quote) &&
        (!item.sourceUrl || allowedUrls.includes(item.sourceUrl)) &&
        (!source.sourceUrl || !item.sourceUrl || source.sourceUrl === item.sourceUrl)
      );
    } else if (item.sourceType === 'deterministic_rule') {
      const findingText = finding
        ? [finding.matchedSnippet, finding.explanation].filter(Boolean).join('\n')
        : '';
      grounded = Boolean(finding && quote && findingText.includes(quote));
    } else if (item.sourceType === 'ai_visual_interpretation') {
      grounded = Boolean(
        media &&
        ['image', 'youtube', 'videoFile'].includes(media.kind) &&
        item.evidenceId === 'media-input' &&
        interpretation &&
        (!item.sourceUrl || allowedUrls.includes(item.sourceUrl)) &&
        (item.timestampSeconds === null ||
          (typeof item.timestampSeconds === 'number' &&
            Number.isFinite(item.timestampSeconds) &&
            item.timestampSeconds >= 0 &&
            item.timestampSeconds <= 86400))
      );
    }

    if (!grounded) continue;

    const validated = {
      evidenceId: item.evidenceId,
      sourceType: item.sourceType,
      quote,
      interpretation,
      sourceUrl: item.sourceUrl || '',
      timestampSeconds: item.timestampSeconds
    };
    seen.set(validated.evidenceId, validated);
    validatedEvidence.push(validated);
  }

  return { evidence: validatedEvidence, evidenceById: seen };
};

const extractGroundedClaims = (claims, evidenceById) => {
  if (!Array.isArray(claims)) {
    throw new TypeError('AI claims must be an array.');
  }

  return claims
    .slice(0, MAX_CLAIMS)
    .filter((claim) => (
      claim &&
      typeof claim.text === 'string' &&
      typeof claim.reason === 'string' &&
      typeof claim.needsVerification === 'boolean' &&
      Array.isArray(claim.evidenceIds) &&
      claim.evidenceIds.length > 0 &&
      claim.evidenceIds.some((id) => evidenceById.has(id))
    ))
    .map((claim) => {
      const evidenceIds = [...new Set(claim.evidenceIds.filter((id) => evidenceById.has(id)))];
      const primaryEvidence = evidenceById.get(evidenceIds[0]);
      return {
        text: boundedText(claim.text),
        reason: boundedText(claim.reason),
        needsVerification: claim.needsVerification,
        evidenceIds,
        evidenceQuote: primaryEvidence.quote,
        interpretation: primaryEvidence.interpretation,
        timestampSeconds: primaryEvidence.timestampSeconds
      };
    })
    .filter((claim) => claim.text && claim.reason && claim.evidenceIds.length);
};

const validateIndicators = (indicators, evidenceById) => {
  if (!Array.isArray(indicators)) {
    throw new TypeError('AI suspiciousIndicators must be an array.');
  }
  return indicators.slice(0, MAX_EVIDENCE)
    .filter((item) => (
      item &&
      typeof item.indicator === 'string' &&
      typeof item.explanation === 'string' &&
      Array.isArray(item.evidenceIds) &&
      item.evidenceIds.some((id) => evidenceById.has(id))
    ))
    .map((item) => ({
      indicator: boundedText(item.indicator, 300),
      explanation: boundedText(item.explanation),
      evidenceIds: [...new Set(item.evidenceIds.filter((id) => evidenceById.has(id)))]
    }))
    .filter((item) => item.indicator && item.explanation && item.evidenceIds.length);
};

const validateRequestedData = (items, evidenceById) => {
  if (!Array.isArray(items)) {
    throw new TypeError('AI requestedData must be an array.');
  }
  return items.slice(0, MAX_EVIDENCE)
    .filter((item) => (
      item &&
      typeof item.type === 'string' &&
      DATA_SENSITIVITY.has(item.sensitivity) &&
      Array.isArray(item.evidenceIds) &&
      item.evidenceIds.some((id) => evidenceById.has(id))
    ))
    .map((item) => ({
      type: boundedText(item.type, 150),
      sensitivity: item.sensitivity,
      evidenceIds: [...new Set(item.evidenceIds.filter((id) => evidenceById.has(id)))]
    }))
    .filter((item) => item.type && item.evidenceIds.length);
};

module.exports = {
  extractGroundedClaims,
  validateEvidence,
  validateIndicators,
  validateRequestedData
};
