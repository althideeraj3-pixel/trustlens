// engine/rules/rewardRules.js
// Detects unexpected reward, lottery, cashback, or prize claims (Rule R-RWD)

const keywords = require('../dictionaries/keywords.json');

const matchKeyword = (text, word) => {
  if (/^[a-zA-Z0-9\s]+$/.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(word.toLowerCase());
};

const checkRewards = (text) => {
  const findings = [];

  const rewardWords = [
    ...(keywords.rewards.en || []),
    ...(keywords.rewards.te || []),
    ...(keywords.rewards.hi || [])
  ];

  for (const word of rewardWords) {
    if (matchKeyword(text, word)) {
      findings.push({
        ruleId: 'R-RWD',
        category: 'Unsolicited Reward or Prize',
        matchedSnippet: word,
        weight: 20,
        explanation: `Unexpected reward or lottery phrase detected ("${word}"). Scammers bait victims with false promises of money or prizes.`
      });
      break; // Only flag once per category
    }
  }

  return findings;
};

module.exports = { checkRewards };
