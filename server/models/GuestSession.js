const mongoose = require('mongoose');

const guestSessionSchema = new mongoose.Schema(
  {
    guestSessionId: { type: String, required: true, unique: true, index: true },
    guestStartedAt: { type: Date, required: true, default: Date.now },
    guestExpiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge old guest sessions after 24 hours
guestSessionSchema.index({ guestExpiresAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('GuestSession', guestSessionSchema);
