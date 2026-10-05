const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: String, required: true, default: 'elwo_premium_monthly_20' },
    purchaseToken: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    subscriptionState: {
      type: String,
      enum: [
        'ACTIVE',
        'PENDING',
        'GRACE_PERIOD',
        'ACCOUNT_HOLD',
        'CANCELLED',
        'EXPIRED',
        'REVOKED',
      ],
      default: 'PENDING',
      index: true,
    },
    priceAmount: { type: Number, default: 20 },
    currency: { type: String, default: 'INR' },
    startTime: { type: Date, default: Date.now },
    expiryTime: { type: Date, required: true, index: true },
    autoRenewing: { type: Boolean, default: true },
    lastVerifiedAt: { type: Date, default: Date.now },
    rawGooglePlayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
