// controllers/adminController.js
// Administration controller for user management, analysis inspection, rule management, and analytics.

const User = require('../models/User');
const Analysis = require('../models/Analysis');
const Feedback = require('../models/Feedback');
const RiskRule = require('../models/RiskRule');
const AuditLog = require('../models/AuditLog');

// Default initial rules for seeding if collection is empty
const DEFAULT_RULES = [
  { ruleId: 'R-URG', name: 'Urgency & Pressure', category: 'Behavioral', weight: 15, description: 'Detects rush language like immediately, account blocked, or within 24 hours.' },
  { ruleId: 'R-RWD', name: 'Unsolicited Reward or Prize', category: 'Bait', weight: 20, description: 'Detects unexpected lottery, won prize, cashback, or bonus promises.' },
  { ruleId: 'R-IMP', name: 'Brand or Authority Impersonation', category: 'Identity', weight: 20, description: 'Detects claims of representing banks, courier services, or government agencies.' },
  { ruleId: 'R-PAY', name: 'Payment or Fee Demand', category: 'Financial', weight: 20, description: 'Detects advance processing fees, registration charges, or upfront transfer demands.' },
  { ruleId: 'R-DAT-C', name: 'Critical Data Request', category: 'Credentials', weight: 40, description: 'Detects requests for OTP, UPI PIN, passwords, or CVV. Forces High Risk.' },
  { ruleId: 'R-DAT-H', name: 'High Sensitivity Data Request', category: 'Credentials', weight: 30, description: 'Detects requests for Aadhaar, PAN card, or bank account numbers.' },
  { ruleId: 'R-DAT-M', name: 'Personal Contact Data Request', category: 'Credentials', weight: 10, description: 'Detects requests for phone number, email, or date of birth.' },
  { ruleId: 'R-LNK', name: 'Embedded Actionable Link', category: 'Web', weight: 10, description: 'Detects external web hyperlinks inside actionable message bodies.' },
  { ruleId: 'R-SHT', name: 'Obfuscated / Shortened URL', category: 'Web', weight: 10, description: 'Detects URL shortener domains such as bit.ly, tinyurl, or t.co.' }
];

// @desc    Get aggregate metrics for admin dashboard
// @route   GET /api/admin/metrics
// @access  Private (Admin)
const getAdminMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAnalyses,
      highRiskCount,
      moderateRiskCount,
      lowRiskCount,
      totalFeedback,
      recentAnalyses,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Analysis.countDocuments(),
      Analysis.countDocuments({ riskLevel: 'High' }),
      Analysis.countDocuments({ riskLevel: 'Moderate' }),
      Analysis.countDocuments({ riskLevel: 'Low' }),
      Feedback.countDocuments(),
      Analysis.find().sort({ createdAt: -1 }).limit(6).populate('userId', 'name email'),
      User.find().sort({ createdAt: -1 }).limit(6).select('-password')
    ]);

    // Input type breakdown
    const inputTypeStats = await Analysis.aggregate([
      { $group: { _id: '$inputType', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAnalyses,
        riskDistribution: {
          high: highRiskCount,
          moderate: moderateRiskCount,
          low: lowRiskCount
        },
        totalFeedback,
        inputTypeStats,
        recentAnalyses,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List and search users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (enable/disable) or role
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect self-lockout
    if (user._id.toString() === req.user._id.toString() && status === 'disabled') {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own administrator account.'
      });
    }

    const oldStatus = user.status;
    const oldRole = user.role;

    if (status) user.status = status;
    if (role) user.role = role;
    await user.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'USER_MODIFIED',
      performedBy: req.user._id,
      targetType: 'User',
      targetId: user._id.toString(),
      details: {
        changedUser: user.email,
        oldValues: { status: oldStatus, role: oldRole },
        newValues: { status: user.status, role: user.role }
      },
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} updated successfully.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all system analyses
// @route   GET /api/admin/analyses
// @access  Private (Admin)
const getAdminAnalyses = async (req, res, next) => {
  try {
    const { riskLevel, inputType, search } = req.query;
    const filter = {};

    if (riskLevel && riskLevel !== 'all') filter.riskLevel = riskLevel;
    if (inputType && inputType !== 'all') filter.inputType = inputType;
    if (search) {
      filter.$or = [
        { summary: { $regex: search, $options: 'i' } },
        { inputSummary: { $regex: search, $options: 'i' } }
      ];
    }

    const analyses = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(150)
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all risk rules (auto-seeds defaults if empty)
// @route   GET /api/admin/rules
// @access  Private (Admin)
const getAdminRules = async (req, res, next) => {
  try {
    let rules = await RiskRule.find().sort({ weight: -1 });

    if (rules.length === 0) {
      rules = await RiskRule.insertMany(DEFAULT_RULES);
    }

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update rule weight or active status
// @route   PUT /api/admin/rules/:id
// @access  Private (Admin)
const updateAdminRule = async (req, res, next) => {
  try {
    const { weight, active, description } = req.body;
    const rule = await RiskRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Risk Rule not found' });
    }

    const oldWeight = rule.weight;
    const oldActive = rule.active;

    if (typeof weight === 'number') rule.weight = Math.max(0, Math.min(100, weight));
    if (typeof active === 'boolean') rule.active = active;
    if (description) rule.description = description;
    rule.updatedBy = req.user._id;

    await rule.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'RULE_UPDATED',
      performedBy: req.user._id,
      targetType: 'RiskRule',
      targetId: rule.ruleId,
      details: {
        ruleId: rule.ruleId,
        oldValues: { weight: oldWeight, active: oldActive },
        newValues: { weight: rule.weight, active: rule.active }
      },
      ipAddress: req.ip || ''
    });

    res.status(200).json({
      success: true,
      message: `Rule ${rule.ruleId} updated successfully.`,
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get security audit trail
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAdminAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('performedBy', 'name email role');

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user feedback list
// @route   GET /api/admin/feedback
// @access  Private (Admin)
const getAdminFeedback = async (req, res, next) => {
  try {
    const feedbackList = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('analysisId', 'riskLevel score summary')
      .populate('userId', 'name email');

    res.status(200).json({
      success: true,
      count: feedbackList.length,
      data: feedbackList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminMetrics,
  getAdminUsers,
  updateUserStatus,
  getAdminAnalyses,
  getAdminRules,
  updateAdminRule,
  getAdminAuditLogs,
  getAdminFeedback
};
