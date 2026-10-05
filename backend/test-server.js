const assert = require('assert');
const mongoose = require('mongoose');
const errorHandler = require('./middlewares/errorHandler');

const connectionStateBeforeImport = mongoose.connection.readyState;
const { app } = require('./server');

assert.strictEqual(
  mongoose.connection.readyState,
  connectionStateBeforeImport,
  'Importing the server module must not open a MongoDB connection.'
);

const originalNodeEnv = process.env.NODE_ENV;
const originalConsoleError = console.error;
let productionErrorResponse;
process.env.NODE_ENV = 'production';
console.error = () => {};
errorHandler(
  Object.assign(new Error('sensitive internal detail'), { status: 500 }),
  { method: 'GET', originalUrl: '/api/test' },
  {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      productionErrorResponse = { statusCode: this.statusCode, body };
    }
  },
  () => {}
);
console.error = originalConsoleError;
if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = originalNodeEnv;

assert.strictEqual(productionErrorResponse.statusCode, 500);
assert.strictEqual(productionErrorResponse.body.message, 'An unexpected server error occurred.');
assert.strictEqual('stack' in productionErrorResponse.body, false);

const server = app.listen(0, '127.0.0.1', async () => {
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.status, 'ok');
    console.log('Backend startup, health, and production error tests passed.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
