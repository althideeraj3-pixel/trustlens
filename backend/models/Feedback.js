// models/Feedback.js
// Stores user feedback on analysis accuracy and detection quality.

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Can be anonymous
    },
    rating: {
      type: String,
      enum: ['helpful', 'false_alarm', 'confirmed_scam'],
      required: true
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
