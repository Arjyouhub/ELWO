const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    profileImage: { type: String, default: null },
    preferredLanguages: { type: [String], default: [] },
    onboardingCompleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT'],
      default: 'USER',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        'ACTIVE',
        'PENDING',
        'GRACE_PERIOD',
        'ACCOUNT_HOLD',
        'CANCELLED',
        'EXPIRED',
        'REVOKED',
        'NONE',
      ],
      default: 'NONE',
      index: true,
    },
    subscriptionProductId: { type: String, default: null },
    subscriptionExpiry: { type: Date, default: null },
    lastLoginAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
