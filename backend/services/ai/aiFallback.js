const RULE_EXPLANATIONS = {
  'R-RWD': 'It promises a prize or reward, which can be used to tempt people into sharing details or paying a fee.',
  'R-URG': 'It pressures you to act quickly, which can make it harder to check whether the request is genuine.',
  'R-DAT': 'It asks for sensitive personal information. Do not share passwords, one-time codes, PINs, or financial details.',
  'R-PAY': 'It involves a payment request. Verify the recipient and reason through an official channel before paying.',
  'R-IMP': 'It may be pretending to represent a familiar organization. Contact that organization using details you find independently.',
  'R-SHT': 'It contains a shortened link, which hides the website address you would reach.',
  'R-URL-HTTP': 'The link does not use an encrypted HTTPS connection.',
  'R-NEWS-SENS': 'The wording is sensational. Check the claim with reliable, independent sources before sharing it.',
  'R-VID-META': 'Only the submitted video details were checked; the video itself was not verified.'
};

const createFallbackExplanation = (report, seniorMode = false, options = {}) => {
  const reasons = [...new Set(
    (report.findings || [])
      .map((finding) => RULE_EXPLANATIONS[finding.ruleId])
      .filter(Boolean)
  )];

  const summary = reasons.length
    ? `The rule checks found ${reasons.length} type(s) of safety warning.`
    : 'The rule checks did not find known warning patterns in the supplied material. This does not prove it is safe.';
  const explanation = reasons.length
    ? reasons.join(' ')
    : 'Be careful with unexpected requests. Verify important claims using an official channel.';
  const recommendation = report.actions?.notActed
    ? [report.actions.notActed]
    : [];
  const limitations = [...(options.limitations || [])];
  if (options.inputType === 'video' && !limitations.length) {
    limitations.push('Video content could not be directly inspected because AI analysis was unavailable.');
  }

  return {
    mode: 'fallback',
    summary,
    explanation: seniorMode ? `${summary} ${reasons[0] || 'Check it with someone you trust before acting.'}` : explanation,
    riskExplanation: seniorMode ? `${summary} ${reasons[0] || 'Check it with someone you trust before acting.'}` : explanation,
    claims: [],
    evidence: [],
    suspiciousIndicators: [],
    requestedData: [],
    verificationNeeded: report.verificationStatus !== 'Clean' || report.riskLevel !== 'Low',
    recommendedActions: recommendation,
    uncertainty: report.uncertainty || 'This explanation is based on deterministic checks only.',
    confidence: 0,
    language: options.language || 'en',
    translations: { en: null, te: null, hi: null },
    limitations
  };
};

module.exports = { createFallbackExplanation };
