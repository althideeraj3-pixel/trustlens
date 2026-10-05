// controllers/authController.js
// Handles user registration, login, profile management, and token issuance.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate signed JWT
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'trustlens_dev_secret_key_12345',
    { expiresIn: '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, language = 'en', seniorMode = false } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user', // Default role
      language,
      seniorMode,
      lastLogin: new Date()
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        seniorMode: user.seniorMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is disabled
    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'This account has been disabled. Please contact the administrator.'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        seniorMode: user.seniorMode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, language, seniorMode, ttsSpeed } = req.body;
    if (name) user.name = name;
    if (language) user.language = language;
    if (typeof seniorMode === 'boolean') user.seniorMode = seniorMode;
    if (typeof ttsSpeed === 'number') user.ttsSpeed = ttsSpeed;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request structure
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Don't leak if email exists or not for security
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been dispatched.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed initial demo admin and user accounts if not present
// @route   POST /api/auth/seed
// @access  Public
const seedDemoAccounts = async (req, res, next) => {
  try {
    let adminCreated = false;
    let userCreated = false;

    // Admin account
    let admin = await User.findOne({ email: 'admin@trustlens.ai' });
    if (!admin) {
      admin = await User.create({
        name: 'TrustLens Administrator',
        email: 'admin@trustlens.ai',
        password: 'Admin@12345',
        role: 'admin',
        status: 'active'
      });
      adminCreated = true;
    }

    // Demo user account
    let user = await User.findOne({ email: 'user@trustlens.ai' });
    if (!user) {
      user = await User.create({
        name: 'Demonstration User',
        email: 'user@trustlens.ai',
        password: 'User@12345',
        role: 'user',
        status: 'active'
      });
      userCreated = true;
    }

    res.status(200).json({
      success: true,
      message: 'Seed check complete.',
      details: {
        adminCreated,
        userCreated,
        accounts: [
          { email: 'admin@trustlens.ai', role: 'admin', defaultPass: 'Admin@12345' },
          { email: 'user@trustlens.ai', role: 'user', defaultPass: 'User@12345' }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  seedDemoAccounts
};
