const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, default: 'elwo_premium_monthly_20' },
    amount: { type: Number, required: true, default: 20 },
    currency: { type: String, required: true, default: 'INR' },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED'],
      default: 'SUCCESS',
      index: true,
    },
    purchaseToken: { type: String, required: true },
    renewal: { type: Boolean, default: false },
    verificationDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    eventTimestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

paymentEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
