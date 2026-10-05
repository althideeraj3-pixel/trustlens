const { URL } = require('url');
const { analyzeInput } = require('../engine');
const { analyzeUrlSafety } = require('./urlService');
const { fetchArticleContent } = require('./safeArticleService');
const { isAiConfigured } = require('./ai/aiService');

const SENSATIONAL_WORDS = [
  'shocking', 'miracle cure', 'secret leaked', 'they dont want you to know',
  'bombshell', 'conspiracy', 'illuminati', 'hidden truth', 'unbelievable',
  '100% guaranteed', 'viral truth', 'government hiding'
];

const analyzeNewsArticle = async (url = '', title = '', articleBody = '') => {
  let parsed = null;
  let urlSafety = null;
  let retrieved = null;
  const limitations = [];

  if (url.trim()) {
    try {
      let target = url.trim();
      if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
      parsed = new URL(target);
    } catch {
      throw new Error('Please provide a valid article URL.');
    }

    urlSafety = analyzeUrlSafety(parsed.href);
    if (isAiConfigured()) {
      try {
        retrieved = await fetchArticleContent(parsed.href);
        if (!title.trim()) title = retrieved.title;
      } catch (error) {
        const code = typeof error?.code === 'string' && /^ARTICLE_[A-Z0-9_]+$/.test(error.code)
          ? error.code
          : 'ARTICLE_FETCH_FAILED';
        console.warn(`Article retrieval unavailable (${code}); supplied text analysis will continue.`);
        limitations.push('Article content could not be directly retrieved; analysis uses only the supplied headline or text.');
      }
    } else {
      limitations.push('Article content could not be directly retrieved because Gemini is not configured; analysis uses only supplied text.');
    }
  }

  const userText = [title, articleBody].filter(Boolean).join('\n').trim();
  const combinedText = [userText, retrieved?.text].filter(Boolean).join('\n').toLowerCase();
  const findings = [];
  let sensationalMatches = [];
  for (const phrase of SENSATIONAL_WORDS) {
    if (combinedText.includes(phrase)) sensationalMatches.push(phrase);
  }

  if (sensationalMatches.length > 0) {
    findings.push({
      ruleId: 'R-NEWS-SENS',
      category: 'Sensational & Manipulative Language',
      matchedSnippet: sensationalMatches.slice(0, 3).join(', '),
      weight: 15,
      explanation: 'Headline/text contains high-urgency or sensational language designed to provoke emotional sharing rather than factual verification.'
    });
  }

  let engineReport = null;
  if (combinedText.trim().length >= 10) {
    engineReport = analyzeInput([title, articleBody, retrieved?.text].filter(Boolean).join('\n'));
    findings.push(...engineReport.findings);
  }

  const score = Math.min(
    100,
    (sensationalMatches.length > 0 ? 15 : 0) + (engineReport ? engineReport.score : 0)
  );
  let riskLevel = 'Low';
  if (score >= 60) riskLevel = 'High';
  else if (score >= 30) riskLevel = 'Moderate';

  const verificationStatus = riskLevel === 'High' ? 'Verified Risk' : 'Needs Verification';
  const report = {
    url: parsed?.href || '',
    hostname: parsed?.hostname.toLowerCase() || '',
    title: title || 'News Article',
    riskLevel,
    score,
    summary: findings.length === 0
      ? 'No sensationalist manipulation or known financial scam markers detected in the available text. Independent cross-verification is recommended.'
      : `Detected ${findings.length} claim or language risk indicators in the available article text.`,
    findings,
    dataRequests: engineReport ? engineReport.dataRequests : [],
    actions: {
      notActed: 'Cross-reference this claim with established news wire services (e.g. PTI, Reuters, PIB Fact Check) before sharing on social media.',
      enteredDetails: 'Do not submit personal details or survey forms on unverified news portals.',
      paid: 'Legitimate news publishers do not ask for fee deposits to access breaking public news.'
    },
    verificationStatus,
    sourceMetadata: {
      hostname: parsed?.hostname.toLowerCase() || '',
      hasHttps: parsed?.protocol === 'https:',
      path: parsed?.pathname || '',
      urlSafetyFindings: urlSafety?.findings || [],
      articleRetrieval: retrieved
        ? 'Retrieved by TrustLens safe HTTPS fetcher'
        : url.trim()
          ? 'Content could not be directly retrieved'
          : 'No article URL supplied'
    },
    uncertainty: 'This analysis highlights risk indicators in the available text. It is not definitive proof that the news story is genuine or fabricated.',
    limitations
  };

  const evidenceSources = [];
  if (userText) {
    evidenceSources.push({
      sourceType: 'user_provided',
      label: 'Headline or article text supplied by the user',
      text: userText
    });
  }
  if (retrieved?.text) {
    evidenceSources.push({
      sourceType: 'retrieved',
      label: 'Article text retrieved by TrustLens',
      sourceUrl: retrieved.sourceUrl,
      text: retrieved.text
    });
  }

  return {
    report,
    evidenceSources,
    aiInputText: [title, articleBody, retrieved?.text].filter(Boolean).join('\n'),
    limitations
  };
};

module.exports = { analyzeNewsArticle };
