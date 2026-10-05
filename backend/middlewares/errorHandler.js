// middlewares/errorHandler.js
// Catches any errors thrown by our routes or controllers and sends a friendly message.

const errorHandler = (err, req, res, next) => {
  const candidateStatus = err.statusCode || err.status || res.statusCode;
  const statusCode = Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus <= 599
    ? candidateStatus
    : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500
    ? 'An unexpected server error occurred.'
    : err.message || 'An unexpected server error occurred.';

  if (isProduction) {
    console.error(`[API_ERROR] ${req.method} ${req.originalUrl} (${statusCode})`);
  } else {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
