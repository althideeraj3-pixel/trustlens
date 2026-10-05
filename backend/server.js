// server.js
// Main entry point for the TrustLens Backend API & Rule Engine.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const User = require('./models/User');

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support image uploads & larger payloads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TrustLens Backend API is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Seed default demo accounts helper
const ensureDefaultAccounts = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@trustlens.ai' });
    if (!admin) {
      await User.create({
        name: 'TrustLens Administrator',
        email: 'admin@trustlens.ai',
        password: 'Admin@12345',
        role: 'admin',
        status: 'active'
      });
      console.log('👤 Default Admin account created: admin@trustlens.ai (pass: Admin@12345)');
    }

    const demoUser = await User.findOne({ email: 'user@trustlens.ai' });
    if (!demoUser) {
      await User.create({
        name: 'Demonstration User',
        email: 'user@trustlens.ai',
        password: 'User@12345',
        role: 'user',
        status: 'active'
      });
      console.log('👤 Default User account created: user@trustlens.ai (pass: User@12345)');
    }
  } catch (err) {
    console.warn('Notice: Could not auto-seed demo accounts:', err.message);
  }
};

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/analyze', require('./routes/analyzeRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = Number.parseInt(process.env.PORT || '5000', 10);

const startServer = async (port = PORT) => {
  const conn = await connectDB();
  if (conn) {
    await ensureDefaultAccounts();
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`🛡️ TrustLens server running on http://localhost:${port}`);
      resolve(server);
    });

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Cannot start TrustLens: port ${port} is already in use.`);
      } else {
        console.error(`Cannot start TrustLens: ${error.code || 'server error'}.`);
      }
      reject(error);
    });
  });
};

if (require.main === module) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
