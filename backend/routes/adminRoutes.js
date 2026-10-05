// routes/adminRoutes.js
// Routes for TrustLens Administration Portal (Strictly Role=Admin).

const express = require('express');
const router = express.Router();
const {
  getAdminMetrics,
  getAdminUsers,
  updateUserStatus,
  getAdminAnalyses,
  getAdminRules,
  updateAdminRule,
  getAdminAuditLogs,
  getAdminFeedback
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');

// Enforce both JWT authentication and Admin role on all admin routes
router.use(protect);
router.use(requireAdmin);

router.get('/metrics', getAdminMetrics);
router.get('/users', getAdminUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/analyses', getAdminAnalyses);
router.get('/rules', getAdminRules);
router.put('/rules/:id', updateAdminRule);
router.get('/audit-logs', getAdminAuditLogs);
router.get('/feedback', getAdminFeedback);

module.exports = router;
