// utils/helpers.js
// General helper functions used across the backend application.

/**
 * Mask sensitive data (like Aadhaar, phone numbers) before saving to the database
 */
const maskSensitiveText = (text) => {
  if (!text) return '';
  // Mask 12-digit numbers (like Aadhaar) leaving last 4 digits
  return text.replace(/\b(\d{4})[ -]?(\d{4})[ -]?(\d{4})\b/g, 'XXXX-XXXX-$3');
};

module.exports = {
  maskSensitiveText
};
