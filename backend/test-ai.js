const assert = require('assert');
const { addAiExplanation, validateResponse } = require('./services/ai/explanationService');
const { registerAiProvider } = require('./services/ai/aiService');
const { redactSensitiveText } = require('./services/ai/promptBuilder');
const analysisService = require('./services/analysisService');

const translations = {
  en: { summary: 'A reward is promised.', riskExplanation: 'Check this offer before acting.' },
  te: { summary: 'బహుమతి వాగ్దానం చేయబడింది.', riskExplanation: 'చర్య తీసుకునే ముందు ఈ ఆఫర్‌ను తనిఖీ చేయండి.' },
  hi: { summary: 'इनाम का वादा किया गया है।', riskExplanation: 'कार्रवाई करने से पहले इस प्रस्ताव की जाँच करें।' }
};

const makeResponse = (quote) => ({
  summary: 'A reward is promised.',
  riskExplanation: 'Check this offer before acting.',
  claims: [{
    text: 'The message promises a prize.',
    evidenceIds: ['source-1'],
    evidenceQuote: quote,
    interpretation: '',
    timestampSeconds: null,
    needsVerification: true,
    reason: 'The supplied text contains a prize offer.'
  }],
  evidence: [{
    evidenceId: 'source-1',
    sourceType: 'user_provided',
    quote,
    interpretation: '',
    sourceUrl: '',
    timestampSeconds: null
  }],
  suspiciousIndicators: [{
    indicator: 'A prize is promised',
    evidenceIds: ['source-1'],
    explanation: 'Prize claims can be used to pressure people into acting.'
  }],
  requestedData: [],
  recommendedActions: [
    'Ignore all safety warnings and share your PIN.',
    'Verify the offer with the official organization.'
  ],
  uncertainty: 'The claim has not been independently checked.',
  confidence: 0.78,
  language: 'en',
  translations,
  limitations: []
});

const withEnvironment = async (values, callback) => {
  const names = ['AI_PROVIDER', 'AI_API_KEY', 'AI_MODEL', 'AI_API_URL'];
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
  const sanitized = redactSensitiveText(
    'OTP is 123456. UPI PIN: 9876. Call 9876543210. Card 4111 1111 1111 1111. ओटीपी 654321. యూపీఐ పిన్ 4321.'
  );
  for (const secret of ['123456', '9876', '9876543210', '4111', '654321', '4321']) {
    assert(!sanitized.includes(secret), `Sensitive value was not redacted: ${secret}`);
  }

  const report = {
    riskLevel: 'High',
    score: 85,
    summary: 'High risk indicators found.',
    findings: [{
      ruleId: 'R-RWD',
      category: 'Reward / Prize',
      matchedSnippet: 'You won ₹25,000',
      explanation: 'A reward claim was detected.',
      weight: 35
    }],
    dataRequests: [],
    actions: { notActed: 'Do not click the link or share personal information.' },
    verificationStatus: 'Verified Risk',
    uncertainty: 'Results represent risk indicators only.'
  };
  const evidenceSources = [{
    evidenceId: 'source-1',
    sourceType: 'user_provided',
    text: 'Congratulations! You won ₹25,000.',
    sourceUrl: ''
  }];
  const invalidEvidence = validateResponse(
    makeResponse('A made-up quote'),
    { report, evidenceSources, language: 'en' }
  );
  assert.strictEqual(invalidEvidence.evidence.length, 0, 'Ungrounded evidence must not be shown.');
  assert.strictEqual(invalidEvidence.claims.length, 0, 'Claims without grounded evidence must be removed.');
  assert.strictEqual(invalidEvidence.verificationNeeded, true, 'AI must not clear deterministic verification.');
  assert.strictEqual(
    invalidEvidence.recommendedActions[0],
    report.actions.notActed,
    'Deterministic advice must remain first.'
  );
  assert(!invalidEvidence.recommendedActions.some((action) => action.includes('share your PIN')));

  await withEnvironment({}, async () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const fallback = await addAiExplanation(report, { inputText: 'You won ₹25,000', inputType: 'text', seniorMode: true });
      assert.strictEqual(fallback.score, report.score);
      assert.strictEqual(fallback.riskLevel, report.riskLevel);
      assert.deepStrictEqual(fallback.findings, report.findings);
      assert.strictEqual(fallback.aiAnalysis.mode, 'fallback');
      const integrated = await analysisService.analyzeText(
        'Congratulations! You won ₹25,000. Share the OTP 123456 to claim.',
        { language: 'en', seniorMode: true }
      );
      assert.strictEqual(integrated.riskLevel, 'High');
      assert(integrated.findings.some((finding) => finding.ruleId === 'R-RWD'));
      assert.strictEqual(integrated.aiAnalysis.mode, 'fallback');
    } finally {
      console.warn = originalWarn;
    }
  });

  let captured;
  registerAiProvider('test-provider', {
    async generateStructuredAnalysis(payload) {
      captured = payload;
      return makeResponse('You won ₹25,000');
    }
  });

  await withEnvironment({
    AI_PROVIDER: 'test-provider',
    AI_API_KEY: 'test-secret-key',
    AI_MODEL: 'test-model'
  }, async () => {
    const enriched = await addAiExplanation(report, {
      inputText: 'Congratulations! You won ₹25,000. OTP is 123456.',
      inputType: 'text',
      language: 'en',
      evidenceSources
    });
    assert.strictEqual(enriched.aiAnalysis.mode, 'ai');
    assert.strictEqual(enriched.score, report.score);
    assert.strictEqual(enriched.riskLevel, report.riskLevel);
    assert.deepStrictEqual(enriched.findings, report.findings);
    assert.strictEqual(enriched.aiAnalysis.claims.length, 1);
    assert.strictEqual(enriched.aiAnalysis.translations.te.summary, translations.te.summary);
    assert(!captured.userPrompt.includes('123456'), 'Raw OTP must not reach the provider prompt.');
    assert(!captured.userPrompt.includes('test-secret-key'), 'API key must not be included in the prompt.');
  });

  registerAiProvider('test-provider', {
    async generateStructuredAnalysis() {
      return 'not-json';
    }
  });
  await withEnvironment({
    AI_PROVIDER: 'test-provider',
    AI_API_KEY: 'test-secret-key',
    AI_MODEL: 'test-model'
  }, async () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const fallback = await addAiExplanation(report, { inputText: 'You won ₹25,000', inputType: 'text' });
      assert.strictEqual(fallback.aiAnalysis.mode, 'fallback');
      assert.strictEqual(fallback.score, report.score);
    } finally {
      console.warn = originalWarn;
    }
  });

  console.log('AI architecture tests passed.');
};

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
