const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: {
      type: String,
      enum: [
        'ADMIN_LOGIN',
        'USER_BLOCKED',
        'USER_UNBLOCKED',
        'USER_DELETED',
        'COUPON_CREATED',
        'COUPON_EDITED',
        'COUPON_DISABLED',
        'ADMIN_CREATED',
        'ADMIN_ROLE_CHANGED',
        'SUBSCRIPTION_VIEWED',
        'SETTINGS_CHANGED',
      ],
      required: true,
      index: true,
    },
    targetId: { type: String, default: null },
    targetType: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
