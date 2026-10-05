// engine/rules/impersonationRules.js
// Detects claims of being a trusted organization (Bank, Police, Electricity, Courier, Telecom) (Rule R-IMP)

const keywords = require('../dictionaries/keywords.json');

const checkImpersonation = (text) => {
  const findings = [];
  const lowerText = text.toLowerCase();

  const orgWords = [
    ...(keywords.impersonation.en || []),
    ...(keywords.impersonation.te || []),
    ...(keywords.impersonation.hi || [])
  ];

  for (const org of orgWords) {
    // Check if the word appears as a standalone token or part of string
    const regex = new RegExp(`\\b${org}\\b`, 'i');
    if (regex.test(lowerText) || lowerText.includes(org)) {
      findings.push({
        ruleId: 'R-IMP',
        category: 'Brand or Authority Impersonation',
        matchedSnippet: org,
        weight: 20,
        explanation: `Mention of trusted entity or authority detected ("${org}"). Scammers frequently impersonate banks, utilities, or government officials.`
      });
      break;
    }
  }

  return findings;
};

module.exports = { checkImpersonation };
