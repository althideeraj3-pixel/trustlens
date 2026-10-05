// routes/analyzeRoutes.js
// Maps analysis endpoints with optional authentication context.

const express = require('express');
const router = express.Router();
const {
  analyzeText,
  analyzeUrl,
  analyzeScreenshot,
  analyzeVideo,
  analyzeNews
} = require('../controllers/analyzeController');
const { optionalAuth } = require('../middlewares/authMiddleware');
const { uploadVideo } = require('../middlewares/videoUpload');

router.use(optionalAuth);

router.post('/text', analyzeText);
router.post('/url', analyzeUrl);
router.post('/screenshot', analyzeScreenshot);
router.post('/video', uploadVideo, analyzeVideo);
router.post('/news', analyzeNews);

module.exports = router;
