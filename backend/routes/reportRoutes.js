// routes/reportRoutes.js
// Routes for managing and viewing Trust Reports and feedback.

const express = require('express');
const router = express.Router();
const {
  getUserReports,
  getReportById,
  deleteReport,
  submitFeedback
} = require('../controllers/reportController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');

router.get('/', protect, getUserReports);
router.get('/:id', optionalAuth, getReportById);
router.delete('/:id', protect, deleteReport);
router.post('/:id/feedback', optionalAuth, submitFeedback);

module.exports = router;
