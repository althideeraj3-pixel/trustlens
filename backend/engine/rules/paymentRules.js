// engine/rules/paymentRules.js
// Detects requests to pay a fee, deposit, or transfer money (Rule R-PAY)

const keywords = require('../dictionaries/keywords.json');

const matchKeyword = (text, word) => {
  if (/^[a-zA-Z0-9\s]+$/.test(word)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(word.toLowerCase());
};

const checkPaymentRequests = (text) => {
  const findings = [];

  const paymentPhrases = [
    ...(keywords.payments.en || []),
    ...(keywords.payments.te || []),
    ...(keywords.payments.hi || [])
  ];

  for (const phrase of paymentPhrases) {
    if (matchKeyword(text, phrase)) {
      findings.push({
        ruleId: 'R-PAY',
        category: 'Payment or Fee Request',
        matchedSnippet: phrase,
        weight: 20,
        explanation: `Demand for payment, fee, or deposit detected ("${phrase}"). Legitimate lotteries or official bodies never ask for upfront fees to release funds.`
      });
      break;
    }
  }

  return findings;
};

module.exports = { checkPaymentRequests };
