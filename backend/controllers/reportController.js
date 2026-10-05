// controllers/reportController.js
// Handles saving, retrieving, filtering, and deleting user Trust Reports.

const Analysis = require('../models/Analysis');
const Feedback = require('../models/Feedback');

// @desc    Get reports for the logged in user
// @route   GET /api/reports
// @access  Private
const getUserReports = async (req, res, next) => {
  try {
    const { riskLevel, inputType, search } = req.query;
    const filter = { userId: req.user._id };

    if (riskLevel && riskLevel !== 'all') {
      filter.riskLevel = riskLevel;
    }

    if (inputType && inputType !== 'all') {
      filter.inputType = inputType;
    }

    if (search) {
      filter.$or = [
        { summary: { $regex: search, $options: 'i' } },
        { inputSummary: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Public / Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Analysis.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Trust Report not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res, next) => {
  try {
    const report = await Analysis.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Trust Report not found.'
      });
    }

    // Check ownership if user is not admin
    if (
      report.userId &&
      report.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this report.'
      });
    }

    await Analysis.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback on report accuracy
// @route   POST /api/reports/:id/feedback
// @access  Public (with optional user context)
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const report = await Analysis.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Trust Report not found.'
      });
    }

    if (!['helpful', 'false_alarm', 'confirmed_scam'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be helpful, false_alarm, or confirmed_scam.'
      });
    }

    const feedback = await Feedback.create({
      analysisId: report._id,
      userId: req.user ? req.user._id : null,
      rating,
      comment: comment || ''
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback.',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserReports,
  getReportById,
  deleteReport,
  submitFeedback
};
