const mongoose = require('mongoose');

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

couponRedemptionSchema.index({ couponId: 1, userId: 1 });

module.exports = mongoose.model('CouponRedemption', couponRedemptionSchema);
