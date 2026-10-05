const googlePlayService = require('../services/googlePlayService');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

exports.verifyPurchase = async (req, res) => {
  try {
    const { productId, purchaseToken } = req.body;
    if (!productId || !purchaseToken) {
      return res.status(400).json({
        success: false,
        message: 'productId and purchaseToken are required'
      });
    }

    const result = await googlePlayService.verifyAndAcknowledgeSubscription(
      req.user.id,
      productId,
      purchaseToken
    );

    return res.status(200).json({
      success: true,
      message: 'Subscription verified and activated',
      subscription: result.subscription,
      user: result.user
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Verification failed'
    });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.id);
    return res.status(200).json({
      success: true,
      subscriptionStatus: user ? user.subscriptionStatus : 'FREE',
      subscriptionExpiry: user ? user.subscriptionExpiry : null,
      subscription
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
