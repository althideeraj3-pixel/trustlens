// engine/rules/linkRules.js
// Extracts links from text, flags shortened URLs and unsafe link structures (Rules R-LNK, R-SHT)

const keywords = require('../dictionaries/keywords.json');

const checkLinks = (text) => {
  const findings = [];
  const extractedUrls = [];

  // Match URLs starting with http://, https://, or common short links like bit.ly/...
  const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|in|org|net|xyz|top|site|app|cc|live|me|ly)\/[^\s]*)/gi;
  const matches = text.match(urlRegex) || [];

  for (const url of matches) {
    extractedUrls.push(url);

    // Rule R-LNK: Link embedded in an actionable message (Weight 10)
    if (!findings.some((f) => f.ruleId === 'R-LNK')) {
      findings.push({
        ruleId: 'R-LNK',
        category: 'Embedded Link in Message',
        matchedSnippet: url,
        weight: 10,
        explanation: 'Message contains an external link prompting action. Verify the sender before clicking.'
      });
    }

    // Rule R-SHT: URL Shortener detected (Weight 10)
    const isShortener = (keywords.shorteners || []).some((shortener) =>
      url.toLowerCase().includes(shortener.toLowerCase())
    );

    if (isShortener && !findings.some((f) => f.ruleId === 'R-SHT')) {
      findings.push({
        ruleId: 'R-SHT',
        category: 'Obfuscated / Shortened URL',
        matchedSnippet: url,
        weight: 10,
        explanation: `Shortened or masked URL detected ("${url}"). Scammers use link shorteners to hide malicious or phishing destinations.`
      });
    }
  }

  return { findings, extractedUrls };
};

module.exports = { checkLinks };
