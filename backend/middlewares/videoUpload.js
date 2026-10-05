const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/mpeg',
  'video/3gpp',
  'video/x-msvideo',
  'video/x-flv',
  'video/x-ms-wmv'
]);

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().slice(0, 12);
    callback(null, `trustlens-video-${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 5,
    fieldSize: 5000
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      const error = new Error('Unsupported video type. Upload an MP4, WebM, MOV, MPEG, AVI, FLV, WMV, or 3GPP video.');
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

module.exports = {
  uploadVideo: upload.single('video'),
  MAX_UPLOAD_BYTES
};
