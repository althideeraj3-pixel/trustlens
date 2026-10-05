// models/Analysis.js
// Stores complete forensic Trust Reports in MongoDB.

const mongoose = require('mongoose');

// Schema for individual evidence items detected by rules
const findingSchema = new mongoose.Schema({
  ruleId: { type: String, required: true },
  category: { type: String, required: true },
  matchedSnippet: { type: String },
  weight: { type: Number, default: 0 },
  explanation: { type: String, required: true },
  confidence: { type: Number, default: 1.0 }
});

// Schema for requested data items (e.g. Aadhaar, OTP)
const dataRequestSchema = new mongoose.Schema({
  type: { type: String, required: true },
  sensitivity: {
    type: String,
    enum: ['Caution', 'High', 'Critical'],
    required: true
  }
});

const translationSchema = new mongoose.Schema({
  summary: { type: String, default: '' },
  explanation: { type: String, default: '' },
  riskExplanation: { type: String, default: '' }
}, { _id: false });

const aiClaimSchema = new mongoose.Schema({
  text: { type: String, required: true },
  evidenceQuote: { type: String, default: '' },
  evidenceIds: { type: [String], default: [] },
  interpretation: { type: String, default: '' },
  timestampSeconds: { type: Number, default: null },
  needsVerification: { type: Boolean, required: true },
  reason: { type: String, required: true }
}, { _id: false });

const aiEvidenceSchema = new mongoose.Schema({
  evidenceId: { type: String, required: true },
  sourceType: {
    type: String,
    enum: ['user_provided', 'retrieved', 'deterministic_rule', 'ai_visual_interpretation'],
    required: true
  },
  quote: { type: String, default: '' },
  interpretation: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
  timestampSeconds: { type: Number, default: null }
}, { _id: false });

const aiIndicatorSchema = new mongoose.Schema({
  indicator: { type: String, required: true },
  explanation: { type: String, required: true },
  evidenceIds: { type: [String], default: [] }
}, { _id: false });

const aiRequestedDataSchema = new mongoose.Schema({
  type: { type: String, required: true },
  sensitivity: {
    type: String,
    enum: ['Caution', 'High', 'Critical'],
    required: true
  },
  evidenceIds: { type: [String], default: [] }
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['ai', 'fallback'],
    required: true
  },
  summary: { type: String, required: true },
  explanation: { type: String, required: true },
  riskExplanation: { type: String, default: '' },
  claims: { type: [aiClaimSchema], default: [] },
  evidence: { type: [aiEvidenceSchema], default: [] },
  suspiciousIndicators: { type: [aiIndicatorSchema], default: [] },
  requestedData: { type: [aiRequestedDataSchema], default: [] },
  verificationNeeded: { type: Boolean, required: true },
  recommendedActions: { type: [String], default: [] },
  uncertainty: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  language: { type: String, enum: ['en', 'te', 'hi'], default: 'en' },
  limitations: { type: [String], default: [] },
  translations: {
    en: { type: translationSchema, default: null },
    te: { type: translationSchema, default: null },
    hi: { type: translationSchema, default: null }
  }
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Can be null for anonymous/guest scans
      index: true
    },
    inputType: {
      type: String,
      required: true,
      enum: ['text', 'screenshot', 'url', 'video', 'news'],
      index: true
    },
    inputSummary: {
      type: String,
      trim: true
    },
    rawInput: {
      type: String // Sanitized or masked version
    },
    extractedText: {
      type: String // Masked for privacy
    },
    url: {
      type: String,
      trim: true
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Moderate', 'High'],
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true
    },
    summary: {
      type: String
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: undefined
    },
    findings: [findingSchema],
    dataRequests: [dataRequestSchema],
    actions: {
      notActed: { type: String },
      enteredDetails: { type: String },
      paid: { type: String }
    },
    sourceMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    verificationStatus: {
      type: String,
      enum: ['Verified Risk', 'Needs Verification', 'Limited Evidence', 'Clean'],
      default: 'Needs Verification'
    },
    language: {
      type: String,
      default: 'en'
    },
    uncertainty: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Compound index for admin analysis dashboard queries
analysisSchema.index({ riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
