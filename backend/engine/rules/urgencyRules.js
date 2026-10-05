// engine/rules/urgencyRules.js
// Detects urgency and threat phrases (Rule R-URG)

const keywords = require('../dictionaries/keywords.json');

const matchKeyword = (text, word) => {
  if (/^[a-zA-Z0-9\s]+$/.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(word.toLowerCase());
};

const checkUrgency = (text) => {
  const findings = [];

  const urgencyWords = [
    ...(keywords.urgency.en || []),
    ...(keywords.urgency.te || []),
    ...(keywords.urgency.hi || [])
  ];

  for (const word of urgencyWords) {
    if (matchKeyword(text, word)) {
      findings.push({
        ruleId: 'R-URG',
        category: 'Urgency & Pressure',
        matchedSnippet: word,
        weight: 15,
        explanation: `Urgency language detected ("${word}"). Scammers frequently use rush tactics to prevent careful thinking.`
      });
      break; // Flag once per category
    }
  }

  return findings;
};

module.exports = { checkUrgency };
