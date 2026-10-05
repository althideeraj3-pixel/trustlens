// services/videoService.js
// Forensic analysis service for Instagram Reels and YouTube video links.
// Compliant with TrustLens Core Principle: Evidence-first, not verdict-first.
// Never claims a video is binary "fake" or "real".

const { analyzeInput } = require('../engine');

const classifyVideoUrl = (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Please provide a valid public YouTube or Instagram link.');
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let platform;
  let videoId = 'unknown';
  if (hostname === 'instagram.com' && /^\/(?:reel|p|tv)\/[a-zA-Z0-9_-]+\/?$/i.test(parsed.pathname)) {
    platform = 'Instagram';
    videoId = parsed.pathname.split('/')[2];
  } else if (hostname === 'youtu.be' && /^\/[a-zA-Z0-9_-]{11}\/?$/.test(parsed.pathname)) {
    platform = 'YouTube';
    videoId = parsed.pathname.split('/')[1];
  } else if (
    ['youtube.com', 'm.youtube.com'].includes(hostname) &&
    (
      (/^\/watch\/?$/i.test(parsed.pathname) && /^[a-zA-Z0-9_-]{11}$/.test(parsed.searchParams.get('v') || '')) ||
      /^\/(?:shorts|live)\/[a-zA-Z0-9_-]{11}\/?$/i.test(parsed.pathname)
    )
  ) {
    platform = 'YouTube';
    videoId = parsed.searchParams.get('v') || parsed.pathname.split('/')[2];
  } else {
    throw new Error('Please provide a valid public YouTube or Instagram link.');
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) {
    throw new Error('Video links must use a public HTTPS address.');
  }
  return {
    platform,
    videoId,
    url: platform === 'YouTube'
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `${parsed.origin}${parsed.pathname}`
  };
};

const analyzeVideoUrl = (rawUrl = '', optionalCaption = '', platformHint = 'auto', uploadedFile = null) => {
  let platform;
  let videoId = '';
  let url = '';
  if (uploadedFile) {
    platform = 'Uploaded Video';
  } else {
    ({ platform, videoId, url } = classifyVideoUrl(rawUrl));
  }

  let engineReport = null;
  let textToScan = optionalCaption.trim();

  if (textToScan.length >= 5) {
    engineReport = analyzeInput(textToScan);
  }

  const findings = engineReport ? [...engineReport.findings] : [];
  let score = engineReport ? engineReport.score : 0;
  let riskLevel = engineReport ? engineReport.riskLevel : 'Low';

  findings.push({
    ruleId: 'R-VID-META',
    category: 'Source & Platform Metadata',
    matchedSnippet: platform,
    weight: 0,
    explanation: uploadedFile
      ? 'A user-uploaded video file is available for multimodal analysis.'
      : `Identified public ${platform} content (ID: ${videoId}). TrustLens evaluates the video only when Gemini can access it; submitted caption text is also checked.`
  });

  let verificationStatus = 'Limited Evidence';
  let summary = '';

  if (engineReport && engineReport.findings.length > 0) {
    verificationStatus = riskLevel === 'High' ? 'Verified Risk' : 'Needs Verification';
    summary = `Detected ${engineReport.findings.length} risk indicators in the video caption or associated claims.`;
  } else {
    summary = uploadedFile || platform === 'YouTube'
      ? `Video analysis requested for this ${platform} content.`
      : 'Content could not be directly inspected. Only the submitted caption or text can be analyzed.';
    verificationStatus = 'Limited Evidence';
  }

  return {
    url,
    platform,
    videoId,
    riskLevel,
    score,
    summary,
    findings,
    dataRequests: engineReport ? engineReport.dataRequests : [],
    actions: {
      notActed: `Do not trust investment advice, free cash schemes, or bio links promoted in ${platform} videos without official verification.`,
      enteredDetails: 'If you clicked a bio link and entered credentials, immediately change your passwords.',
      paid: 'If you sent money or UPI payments to an account advertised in this video, report immediately to 1930 / cybercrime.gov.in.'
    },
    verificationStatus,
    sourceMetadata: {
      platform,
      videoId,
      url,
      hasCaptionAnalyzed: textToScan.length >= 5,
      contentInspectionStatus: uploadedFile || platform === 'YouTube'
        ? 'Multimodal analysis requested'
        : 'Content could not be directly inspected'
    },
    uncertainty: uploadedFile || platform === 'YouTube'
      ? 'Video claims are AI interpretations of available visual and audio content, not independent proof.'
      : 'Instagram content could not be directly inspected. Analysis is limited to the submitted caption or text.'
  };
};

module.exports = {
  analyzeVideoUrl,
  classifyVideoUrl
};
