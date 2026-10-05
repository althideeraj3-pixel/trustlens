// engine/rules/dataRequestRules.js
// Detects requests for sensitive personal and financial data (Rules R-DAT-C, R-DAT-H, R-DAT-M)

const keywords = require('../dictionaries/keywords.json');

const checkDataRequests = (text) => {
  const findings = [];
  const dataRequests = [];
  const lowerText = text.toLowerCase();

  // 1. Critical Data (OTP, PIN, Passwords) - Weight 40
  const criticalWords = [
    ...(keywords.criticalData.en || []),
    ...(keywords.criticalData.te || []),
    ...(keywords.criticalData.hi || [])
  ];

  for (const word of criticalWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText) || lowerText.includes(word)) {
      dataRequests.push({ type: word.toUpperCase(), sensitivity: 'Critical' });
      findings.push({
        ruleId: 'R-DAT-C',
        category: 'Critical Sensitive Data Request',
        matchedSnippet: word,
        weight: 40,
        explanation: `CRITICAL ALERT: Request for secret credential ("${word}"). Real banks, government agencies, and police NEVER ask for your OTP, UPI PIN, or password under any circumstances.`
      });
      break;
    }
  }

  // 2. High-Sensitivity Data (Aadhaar, PAN, Bank account) - Weight 30
  const highWords = [
    ...(keywords.highSensitivityData.en || []),
    ...(keywords.highSensitivityData.te || []),
    ...(keywords.highSensitivityData.hi || [])
  ];

  for (const word of highWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText) || lowerText.includes(word)) {
      dataRequests.push({ type: word.toUpperCase(), sensitivity: 'High' });
      findings.push({
        ruleId: 'R-DAT-H',
        category: 'High Sensitivity Data Request',
        matchedSnippet: word,
        weight: 30,
        explanation: `High-risk identity or financial data requested ("${word}"). Sharing this can lead to identity theft or unauthorized account access.`
      });
      break;
    }
  }

  // 3. Caution Data (Phone, Email, DOB) - Weight 10
  const cautionWords = [
    ...(keywords.cautionData.en || []),
    ...(keywords.cautionData.te || []),
    ...(keywords.cautionData.hi || [])
  ];

  for (const word of cautionWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText) || lowerText.includes(word)) {
      dataRequests.push({ type: word.toUpperCase(), sensitivity: 'Caution' });
      findings.push({
        ruleId: 'R-DAT-M',
        category: 'Personal Information Request',
        matchedSnippet: word,
        weight: 10,
        explanation: `Request for contact details or personal info ("${word}"). Be cautious when providing contact info to unsolicited messages.`
      });
      break;
    }
  }

  return { findings, dataRequests };
};

module.exports = { checkDataRequests };
