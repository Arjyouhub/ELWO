const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discount: { type: Number, required: true, min: 1, max: 100 }, // percentage or months free
    start: { type: Date, default: Date.now },
    expiry: { type: Date, required: true, index: true },
    usageLimit: { type: Number, default: 100 },
    perUserLimit: { type: Number, default: 1 },
    timesUsed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISABLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coupon', couponSchema);
