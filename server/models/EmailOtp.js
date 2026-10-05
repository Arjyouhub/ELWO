const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['REGISTER', 'RESET_PASSWORD'],
      default: 'REGISTER',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // MongoDB TTL index: Document automatically deletes after 10 minutes (600s)
    },
  }
);

emailOtpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
