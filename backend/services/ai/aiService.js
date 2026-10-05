const providers = new Map();
const geminiProvider = require('./geminiProvider');

providers.set('gemini', geminiProvider);

const registerAiProvider = (providerName, adapter) => {
  if (!providerName || !adapter || typeof adapter.generateStructuredAnalysis !== 'function') {
    throw new TypeError('AI providers must implement generateStructuredAnalysis.');
  }

  providers.set(providerName, adapter);
};

const isAiConfigured = () => {
  const providerName = process.env.AI_PROVIDER?.trim();
  return Boolean(
    providerName &&
    process.env.AI_MODEL?.trim() &&
    process.env.AI_API_KEY?.trim() &&
    providers.has(providerName)
  );
};

const generateStructuredAnalysis = async (request) => {
  const providerName = process.env.AI_PROVIDER?.trim();
  const model = process.env.AI_MODEL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const apiUrl = process.env.AI_API_URL?.trim();

  if (!providerName || !model || !apiKey) {
    const error = new Error('AI is not configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const provider = providers.get(providerName);
  if (!provider) {
    const error = new Error('No adapter is registered for the configured AI provider.');
    error.code = 'AI_PROVIDER_UNAVAILABLE';
    throw error;
  }

  return provider.generateStructuredAnalysis({
    apiKey,
    apiUrl,
    model,
    ...request
  });
};

module.exports = {
  generateStructuredAnalysis,
  registerAiProvider,
  isAiConfigured
};
