const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');
const AuditLog = require('../models/AuditLog');

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (coupon.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Coupon is not active' });
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ success: false, message: 'Coupon offer has not started yet' });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    const userRedemptions = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      userId: req.user.id
    });

    if (coupon.perUserLimit > 0 && userRedemptions >= coupon.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum redemptions for this coupon'
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        googlePlayPromoCode: coupon.googlePlayPromoCode
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeemCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon || coupon.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
    }

    const redemption = await CouponRedemption.create({
      couponId: coupon._id,
      userId: req.user.id,
      code: coupon.code,
      discountValue: coupon.discountValue
    });

    coupon.timesUsed += 1;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon redeemed successfully',
      redemption
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
