// engine/scorer.js
// Calculates the total risk score (0-100), maps to Low/Moderate/High, and applies mandatory overrides.
// Compliant with TrustLens SRS Section 7.1 & 7.2

const calculateRisk = (findings = [], dataRequests = []) => {
  // Sum weights from all triggered rules
  let score = findings.reduce((total, finding) => total + (finding.weight || 0), 0);

  // Cap base score at 100
  score = Math.min(score, 100);

  // Default risk band mapping
  let riskLevel = 'Low';
  let levelSummary = 'Few or no risk indicators found. Still be careful; this is not a guarantee.';

  if (score >= 60) {
    riskLevel = 'High';
    levelSummary = 'Several strong risk indicators detected. Do not click, pay, or share information.';
  } else if (score >= 30) {
    riskLevel = 'Moderate';
    levelSummary = 'Some risk indicators found. Verify through an official channel before acting.';
  }

  // Override 1: If any Critical data (OTP, UPI PIN, password) is requested, force High
  const hasCriticalData = dataRequests.some((d) => d.sensitivity === 'Critical');
  if (hasCriticalData) {
    riskLevel = 'High';
    if (score < 60) score = 60;
    levelSummary = 'CRITICAL OVERRIDE: Request for secret credential (OTP/PIN/password) detected. Never share this with anyone.';
  }

  // Override 2: If both Payment request and Reward claim are present, force High
  const hasReward = findings.some((f) => f.ruleId === 'R-RWD');
  const hasPayment = findings.some((f) => f.ruleId === 'R-PAY');
  if (hasReward && hasPayment) {
    riskLevel = 'High';
    if (score < 60) score = 60;
    levelSummary = 'CRITICAL OVERRIDE: Classic advance-fee scam pattern (reward promised requiring upfront payment).';
  }

  return {
    score,
    riskLevel,
    levelSummary,
    uncertainty: 'Results represent risk indicators only, not definitive proof.'
  };
};

module.exports = { calculateRisk };
