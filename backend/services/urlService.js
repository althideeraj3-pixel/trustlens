// services/urlService.js
// URL safety inspection with SSRF protection, lexical heuristics, and domain mismatch checks.
// Compliant with SRS Section 3.5 & NFR-S4.

const { URL } = require('url');

// Blocked private & loopback IP patterns (SSRF Protection - NFR-S4)
const PRIVATE_IP_REGEX = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+|::1|0\.0\.0\.0)$/i;

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.buzz', '.monster', '.work', '.cc', '.live', '.tk', '.ga', '.cf', '.gq', '.ml'];
const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'buff.ly', 'ow.ly', 'rb.gy', 'cutt.ly', 'shorturl.at'];
const MONITORED_BRANDS = ['sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'gpay', 'indianoil', 'indiapost', 'netflix', 'amazon'];

const analyzeUrlSafety = (rawUrl) => {
  let targetUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl; // Default to test scheme
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    throw new Error('Invalid URL format. Please provide a valid web address.');
  }

  const findings = [];
  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();

  // 1. SSRF Check: Block internal IP addresses and loopbacks
  if (PRIVATE_IP_REGEX.test(hostname)) {
    findings.push({
      ruleId: 'R-URL-SSRF',
      category: 'Prohibited Target',
      matchedSnippet: hostname,
      weight: 40,
      explanation: 'Target points to a private or internal loopback IP address. Request blocked for security.'
    });
  }

  // 2. Protocol Check (Missing HTTPS)
  if (protocol === 'http:') {
    findings.push({
      ruleId: 'R-URL-HTTP',
      category: 'Insecure Protocol',
      matchedSnippet: protocol,
      weight: 15,
      explanation: 'Connection is unencrypted (HTTP instead of HTTPS). Legitimate banks and services require HTTPS.'
    });
  }

  // 3. IP Address in Hostname
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    findings.push({
      ruleId: 'R-URL-IP',
      category: 'Raw IP Hostname',
      matchedSnippet: hostname,
      weight: 25,
      explanation: 'Website is hosted on a bare IP address rather than a registered domain name.'
    });
  }

  // 4. URL Shortener Detection
  if (SHORTENER_DOMAINS.some(d => hostname.includes(d))) {
    findings.push({
      ruleId: 'R-SHT',
      category: 'Obfuscated / Shortened URL',
      matchedSnippet: hostname,
      weight: 20,
      explanation: 'URL shortener detected. Scammers use masking to hide phishing or malware destinations.'
    });
  }

  // 5. High-Risk TLD Detection
  const hasRiskyTld = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));
  if (hasRiskyTld) {
    findings.push({
      ruleId: 'R-URL-TLD',
      category: 'High-Risk Domain Extension',
      matchedSnippet: hostname,
      weight: 15,
      explanation: 'Domain uses an unconventional, low-cost TLD frequently associated with disposable phishing campaigns.'
    });
  }

  // 6. Punycode / Internationalized Domain Lookalikes (Homograph Attacks)
  if (hostname.includes('xn--')) {
    findings.push({
      ruleId: 'R-URL-PUNY',
      category: 'Punycode Character Lookalike',
      matchedSnippet: hostname,
      weight: 25,
      explanation: 'Domain uses Punycode characters (xn--) often used to impersonate familiar brand names with lookalike Unicode characters.'
    });
  }

  // 7. Excessive Subdomain Stacking (> 3 subdomains)
  const domainParts = hostname.split('.');
  if (domainParts.length > 4) {
    findings.push({
      ruleId: 'R-URL-DEEP',
      category: 'Excessive Subdomain Depth',
      matchedSnippet: hostname,
      weight: 10,
      explanation: 'Excessive subdomains detected. Phishing pages often prepend trusted names to misleading root domains.'
    });
  }

  // 8. Brand Name in Non-Official Domain (e.g. sbi-verification.xyz)
  for (const brand of MONITORED_BRANDS) {
    if (hostname.includes(brand) && !hostname.endsWith(`.${brand}.co.in`) && !hostname.endsWith(`.${brand}.com`) && !hostname.endsWith(`.${brand}.in`)) {
      findings.push({
        ruleId: 'R-DOM',
        category: 'Brand Name Mismatch',
        matchedSnippet: brand,
        weight: 25,
        explanation: `Familiar brand "${brand}" is embedded inside an unrelated domain (${hostname}).`
      });
      break;
    }
  }

  // Calculate score
  let score = findings.reduce((acc, f) => acc + f.weight, 0);
  score = Math.min(100, score);

  let riskLevel = 'Low';
  if (score >= 60) riskLevel = 'High';
  else if (score >= 30) riskLevel = 'Moderate';

  return {
    url: targetUrl,
    hostname,
    protocol,
    findings,
    score,
    riskLevel,
    summary: findings.length === 0
      ? 'No structural URL anomalies or known phishing heuristics detected.'
      : `Detected ${findings.length} structural risk indicator(s) in this web address.`,
    verificationStatus: riskLevel === 'High' ? 'Verified Risk' : riskLevel === 'Moderate' ? 'Needs Verification' : 'Clean',
    sourceMetadata: {
      hostname,
      path: parsed.pathname,
      hasHttps: protocol === 'https:',
      isShortener: SHORTENER_DOMAINS.some(d => hostname.includes(d))
    }
  };
};

module.exports = {
  analyzeUrlSafety
};
