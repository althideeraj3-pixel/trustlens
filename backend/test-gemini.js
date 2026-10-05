const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');
const { addAiExplanation } = require('./services/ai/explanationService');
const analysisService = require('./services/analysisService');
const { analyzeInput } = require('./engine');
const { validateYoutubeUrl } = require('./services/ai/geminiProvider');
const { classifyVideoUrl } = require('./services/videoService');
const { fetchArticleContent } = require('./services/safeArticleService');

const validTranslations = {
  en: { summary: 'A reward is offered.', riskExplanation: 'Check the message before acting.' },
  te: { summary: 'బహుమతి అందించబడుతుంది.', riskExplanation: 'చర్య తీసుకునే ముందు సందేశాన్ని తనిఖీ చేయండి.' },
  hi: { summary: 'इनाम दिया जा रहा है।', riskExplanation: 'कार्रवाई करने से पहले संदेश की जाँच करें।' }
};

const validOutput = (language = 'en', visual = false) => ({
  summary: 'A reward is offered.',
  riskExplanation: 'A reward offer should be verified before acting.',
  claims: visual ? [{
    text: 'The video appears to promote a reward.',
    evidenceIds: ['media-input'],
    evidenceQuote: '',
    interpretation: 'A reward is visibly advertised.',
    timestampSeconds: 12,
    needsVerification: true,
    reason: 'The video makes a promotional claim.'
  }] : [{
    text: 'The message offers a reward.',
    evidenceIds: ['source-1'],
    evidenceQuote: 'Congratulations! You won ₹25,000.',
    interpretation: '',
    timestampSeconds: null,
    needsVerification: true,
    reason: 'The supplied text contains a prize claim.'
  }],
  evidence: visual ? [{
    evidenceId: 'media-input',
    sourceType: 'ai_visual_interpretation',
    quote: '',
    interpretation: 'A reward is visibly advertised.',
    sourceUrl: '',
    timestampSeconds: 12
  }] : [{
    evidenceId: 'source-1',
    sourceType: 'user_provided',
    quote: 'Congratulations! You won ₹25,000.',
    interpretation: '',
    sourceUrl: '',
    timestampSeconds: null
  }],
  suspiciousIndicators: [],
  requestedData: [],
  recommendedActions: ['Verify the offer through an official source.'],
  uncertainty: 'The offer has not been independently verified.',
  confidence: 0.8,
  language,
  translations: validTranslations,
  limitations: []
});

const createMockGeminiServer = () => {
  let mode = 'success';
  let fileStatePolls = 0;
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const url = new URL(req.url, 'http://127.0.0.1');
    requests.push({
      method: req.method,
      path: url.pathname,
      headers: req.headers,
      body: body.toString('utf8')
    });

    if (url.pathname === '/upload/v1beta/files' && req.method === 'POST') {
      res.setHeader('x-goog-upload-url', `${baseUrl}/upload-session`);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    if (url.pathname === '/upload-session' && req.method === 'POST') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        file: { name: 'files/test-video', uri: 'gemini-file://test-video', mimeType: 'video/mp4' }
      }));
      return;
    }
    if (url.pathname === '/v1beta/files/test-video' && req.method === 'GET') {
      fileStatePolls += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        name: 'files/test-video',
        uri: 'gemini-file://test-video',
        mimeType: 'video/mp4',
        state: mode === 'video-file-failed' ? 'FAILED' : fileStatePolls === 1 ? 'PROCESSING' : 'ACTIVE'
      }));
      return;
    }
    if (url.pathname === '/v1beta/files/test-video' && req.method === 'DELETE') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    if (url.pathname === '/v1beta/interactions' && req.method === 'POST') {
      if (mode === 'api-failure') {
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'private provider response' } }));
        return;
      }
      const request = JSON.parse(body.toString('utf8'));
      if (mode === 'malformed') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ output_text: 'not-json' }));
        return;
      }
      const hasVideo = request.input.some((item) => item.type === 'video');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        output_text: JSON.stringify(validOutput('te', hasVideo))
      }));
      return;
    }

    res.writeHead(404);
    res.end();
  });
  let baseUrl = '';
  return {
    server,
    requests,
    setMode(value) {
      mode = value;
      fileStatePolls = 0;
    },
    async listen() {
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      return baseUrl;
    },
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };
};

const withEnvironment = async (values, callback) => {
  const names = [
    'AI_PROVIDER', 'AI_API_KEY', 'AI_MODEL', 'AI_API_URL',
    'AI_TIMEOUT_MS', 'GEMINI_FILE_PROCESSING_TIMEOUT_MS'
  ];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(values, name)) process.env[name] = values[name];
    else delete process.env[name];
  }
  try {
    await callback();
  } finally {
    for (const name of names) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
};

const runTests = async () => {
  const mock = createMockGeminiServer();
  const baseUrl = await mock.listen();
  const tempVideo = path.join(os.tmpdir(), `trustlens-test-${Date.now()}.mp4`);
  await fs.promises.writeFile(tempVideo, Buffer.from('test video bytes'));
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    await withEnvironment({
      AI_PROVIDER: 'gemini',
      AI_API_KEY: 'test-key-never-logged',
      AI_MODEL: 'gemini-test-model',
      AI_API_URL: baseUrl,
      AI_TIMEOUT_MS: '3000',
      GEMINI_FILE_PROCESSING_TIMEOUT_MS: '10000'
    }, async () => {
      const text = 'Congratulations! You won ₹25,000. Share the OTP 123456 to claim.';
      const report = await analysisService.analyzeText(text, { language: 'te' });
      const deterministic = analyzeInput(text, 'te');
      assert.strictEqual(report.aiAnalysis.mode, 'ai');
      assert.strictEqual(report.aiAnalysis.language, 'te');
      assert(report.aiAnalysis.translations.en.summary);
      assert(report.aiAnalysis.translations.te.summary);
      assert(report.aiAnalysis.translations.hi.summary);
      assert.strictEqual(report.aiAnalysis.claims.length, 1);
      assert.strictEqual(report.score, deterministic.score);
      assert.strictEqual(report.riskLevel, deterministic.riskLevel);

      const interactionRequest = mock.requests.find((request) => request.path === '/v1beta/interactions');
      assert(interactionRequest);
      assert.strictEqual(interactionRequest.headers['x-goog-api-key'], 'test-key-never-logged');
      assert(!interactionRequest.body.includes('123456'), 'Sensitive OTP must be redacted before provider transmission.');
      const structuredRequest = JSON.parse(interactionRequest.body);
      assert.strictEqual(structuredRequest.response_format.mime_type, 'application/json');

      mock.setMode('malformed');
      const malformed = await analysisService.analyzeText('Congratulations! You won ₹25,000.', { language: 'hi' });
      assert.strictEqual(malformed.aiAnalysis.mode, 'fallback');
      assert.strictEqual(malformed.aiAnalysis.language, 'hi');
      assert(malformed.score >= 0);

      mock.setMode('api-failure');
      const failed = await analysisService.analyzeText(text, { language: 'en' });
      assert.strictEqual(failed.aiAnalysis.mode, 'fallback');
      assert.strictEqual(failed.riskLevel, 'High');

      mock.setMode('success');
      const video = await analysisService.analyzeVideo(
        'https://youtu.be/dQw4w9WgXcQ',
        '',
        'youtube',
        { language: 'en' }
      );
      assert.strictEqual(video.aiAnalysis.mode, 'ai');
      const youtubeRequest = mock.requests
        .filter((request) => request.path === '/v1beta/interactions')
        .map((request) => JSON.parse(request.body))
        .find((request) => request.input.some((item) => item.type === 'video'));
      assert(youtubeRequest);
      assert(youtubeRequest.input.some((item) => item.type === 'video' && item.uri === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'));

      assert.throws(
        () => validateYoutubeUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'),
        /valid public YouTube/
      );
      assert.throws(
        () => classifyVideoUrl('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'),
        /valid public YouTube/
      );

      const screenshot = await analysisService.analyzeScreenshot(
        'A suspicious request appears in this screenshot.',
        { language: 'en', image: { kind: 'image', mimeType: 'image/png', dataBase64: 'aW1hZ2U=' } }
      );
      assert.strictEqual(screenshot.aiAnalysis.mode, 'ai');
      const screenshotRequest = mock.requests
        .filter((request) => request.path === '/v1beta/interactions')
        .map((request) => JSON.parse(request.body))
        .find((request) => request.input.some((item) => item.type === 'image'));
      assert(screenshotRequest);
      assert(screenshotRequest.input.some((item) => item.type === 'image' && item.data === 'aW1hZ2U='));

      const uploaded = await analysisService.analyzeVideo('', 'User caption.', 'auto', {
        language: 'en',
        uploadedFile: {
          path: tempVideo,
          mimetype: 'video/mp4',
          originalname: 'sample.mp4'
        }
      });
      assert.strictEqual(uploaded.aiAnalysis.mode, 'ai');
      assert(mock.requests.some((request) => request.path === '/upload/v1beta/files'));
      assert(mock.requests.some((request) => request.path === '/v1beta/files/test-video' && request.method === 'GET'));
      assert(mock.requests.some((request) => request.path === '/v1beta/files/test-video' && request.method === 'DELETE'));

      mock.setMode('video-file-failed');
      const failedUpload = await analysisService.analyzeVideo('', '', 'auto', {
        language: 'en',
        uploadedFile: {
          path: tempVideo,
          mimetype: 'video/mp4',
          originalname: 'sample.mp4'
        }
      });
      assert.strictEqual(failedUpload.aiAnalysis.mode, 'fallback');
      assert(failedUpload.aiAnalysis.limitations.some((item) => item.includes('could not be directly inspected')));

      mock.setMode('api-failure');
      const failedYoutube = await analysisService.analyzeVideo(
        'https://youtu.be/dQw4w9WgXcQ',
        '',
        'youtube',
        { language: 'en' }
      );
      assert.strictEqual(failedYoutube.aiAnalysis.mode, 'fallback');
      assert(failedYoutube.aiAnalysis.limitations.some((item) => item.includes('Video content could not be directly inspected')));

      await assert.rejects(
        fetchArticleContent('http://127.0.0.1/private'),
        (error) => error.code === 'ARTICLE_URL_BLOCKED'
      );

      mock.setMode('success');
      await testAnalysisApiRoutes(tempVideo);
    });
  } finally {
    console.warn = originalWarn;
    await fs.promises.unlink(tempVideo).catch(() => {});
    await mock.close();
  }
};

const testAnalysisApiRoutes = async (tempVideo) => {
  const Analysis = require('./models/Analysis');
  const originalCreate = Analysis.create;
  Analysis.create = async () => ({ _id: 'test-report-id' });
  const app = express();
  app.use(express.json());
  app.use('/api/analyze', require('./routes/analyzeRoutes'));
  const apiServer = await new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });

  try {
    const apiBase = `http://127.0.0.1:${apiServer.address().port}/api/analyze`;
    const response = await fetch(`${apiBase}/news`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'A supplied article headline',
        articleBody: 'This supplied article has enough text to check.',
        language: 'te'
      })
    });
    const result = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.aiAnalysis.mode, 'ai');
    assert.strictEqual(result.data.analysisId, 'test-report-id');

    const videoForm = new FormData();
    videoForm.set('video', new Blob([await fs.promises.readFile(tempVideo)], { type: 'video/mp4' }), 'api-test.mp4');
    videoForm.set('language', 'en');
    const videoResponse = await fetch(`${apiBase}/video`, {
      method: 'POST',
      body: videoForm
    });
    const videoResult = await videoResponse.json();
    assert.strictEqual(videoResponse.status, 200);
    assert.strictEqual(videoResult.success, true);
    assert.strictEqual(videoResult.data.aiAnalysis.mode, 'ai');
    assert.strictEqual(videoResult.data.analysisId, 'test-report-id');
  } finally {
    Analysis.create = originalCreate;
    await new Promise((resolve, reject) => apiServer.close((error) => error ? reject(error) : resolve()));
  }
  console.log('Gemini adapter and API tests passed.');
};

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
