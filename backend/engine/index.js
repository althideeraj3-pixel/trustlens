// engine/index.js
// Main entry point for the Rule-based Analysis Engine.
// Evaluates text against all deterministic rules without requiring external AI services.

const { checkUrgency } = require('./rules/urgencyRules');
const { checkRewards } = require('./rules/rewardRules');
const { checkImpersonation } = require('./rules/impersonationRules');
const { checkPaymentRequests } = require('./rules/paymentRules');
const { checkDataRequests } = require('./rules/dataRequestRules');
const { checkLinks } = require('./rules/linkRules');
const { calculateRisk } = require('./scorer');

const analyzeInput = (text, language = 'en') => {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text is required for analysis');
  }

  // 1. Run all rule checks
  const urgencyFindings = checkUrgency(text);
  const rewardFindings = checkRewards(text);
  const impersonationFindings = checkImpersonation(text);
  const paymentFindings = checkPaymentRequests(text);
  const { findings: dataFindings, dataRequests } = checkDataRequests(text);
  const { findings: linkFindings, extractedUrls } = checkLinks(text);

  // 2. Aggregate all findings
  const allFindings = [
    ...urgencyFindings,
    ...rewardFindings,
    ...impersonationFindings,
    ...paymentFindings,
    ...dataFindings,
    ...linkFindings
  ];

  // 3. Compute overall risk score and level
  const riskResult = calculateRisk(allFindings, dataRequests);

  // 4. Generate structured Trust Report
  return {
    riskLevel: riskResult.riskLevel,
    score: riskResult.score,
    summary: riskResult.levelSummary,
    findingsCount: allFindings.length,
    findings: allFindings,
    dataRequests,
    extractedUrls,
    actions: {
      notActed: 'Do not click links, reply, or share any personal information. Verify using official channels only.',
      enteredDetails: 'Immediately change passwords from the official app/website, enable two-factor authentication, and monitor account activity.',
      paid: 'Contact your bank or payment provider immediately to freeze funds. Call National Cyber Helpline 1930 and file a complaint at cybercrime.gov.in.'
    },
    uncertainty: riskResult.uncertainty,
    analyzedAt: new Date().toISOString()
  };
};

module.exports = {
  analyzeInput
};
