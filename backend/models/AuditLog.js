// models/AuditLog.js
// Security and administrative action audit trail.

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    targetType: {
      type: String, // 'User', 'RiskRule', 'Analysis', 'System'
      required: true
    },
    targetId: {
      type: String,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Audit logs are immutable
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
