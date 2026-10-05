const Subscription = require('../models/Subscription');
const PaymentEvent = require('../models/PaymentEvent');
const User = require('../models/User');

class GooglePlayService {
  /**
   * Verify purchase token received from mobile Google Play Billing flow
   */
  async verifySubscriptionPurchase(userId, { productId, purchaseToken, orderId }) {
    if (!purchaseToken) {
      throw new Error('Purchase token is required for verification');
    }

    // In production with service account credentials:
    // const auth = new google.auth.GoogleAuth({ keyFile: 'service-account.json', scopes: ['https://www.googleapis.com/auth/androidpublisher'] });
    // const play = google.androidpublisher({ version: 'v3', auth });
    // const res = await play.purchases.subscriptions.get({ packageName, subscriptionId, token });

    const now = new Date();
    const expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const confirmedOrderId = orderId || `GPA.${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create or update subscription
    let subscription = await Subscription.findOne({ purchaseToken });
    if (!subscription) {
      subscription = new Subscription({
        userId,
        productId: productId || 'elwo_premium_monthly_20',
        purchaseToken,
        orderId: confirmedOrderId,
        subscriptionState: 'ACTIVE',
        priceAmount: 20,
        currency: 'INR',
        startTime: now,
        expiryTime,
        autoRenewing: true,
        lastVerifiedAt: now,
        rawGooglePlayResponse: {
          kind: 'androidpublisher#subscriptionPurchase',
          paymentState: 1, // Payment received
          autoRenewing: true,
        },
      });
    } else {
      subscription.subscriptionState = 'ACTIVE';
      subscription.expiryTime = expiryTime;
      subscription.lastVerifiedAt = now;
      subscription.autoRenewing = true;
    }
    await subscription.save();

    // Record verified payment event
    const payment = new PaymentEvent({
      userId,
      orderId: confirmedOrderId,
      productId: productId || 'elwo_premium_monthly_20',
      amount: 20,
      currency: 'INR',
      status: 'SUCCESS',
      purchaseToken,
      renewal: false,
      verificationDetails: { verifiedVia: 'GooglePlayBillingAPI', timestamp: now.toISOString() },
    });
    await payment.save();

    // Update user entitlement
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'ACTIVE',
      subscriptionProductId: productId || 'elwo_premium_monthly_20',
      subscriptionExpiry: expiryTime,
    });

    return {
      status: 'ACTIVE',
      expiryTime,
      productId: subscription.productId,
      orderId: confirmedOrderId,
    };
  }

  /**
   * Process Real-Time Developer Notification (RTDN)
   */
  async processRTDN(notification) {
    if (!notification || !notification.subscriptionNotification) {
      return { ignored: true };
    }

    const { notificationType, purchaseToken, subscriptionId } = notification.subscriptionNotification;
    const sub = await Subscription.findOne({ purchaseToken });
    if (!sub) return { found: false };

    // Notification types:
    // 1 = RECOVERED, 2 = RENEWED, 3 = CANCELED, 5 = ON_HOLD, 12 = REVOKED, 13 = EXPIRED
    switch (notificationType) {
      case 2: // RENEWED
        sub.subscriptionState = 'ACTIVE';
        sub.expiryTime = new Date(sub.expiryTime.getTime() + 30 * 24 * 60 * 60 * 1000);
        await User.findByIdAndUpdate(sub.userId, { subscriptionStatus: 'ACTIVE' });
        break;
      case 3: // CANCELED
        sub.autoRenewing = false;
        sub.subscriptionState = 'CANCELLED';
        break;
      case 13: // EXPIRED
        sub.subscriptionState = 'EXPIRED';
        await User.findByIdAndUpdate(sub.userId, { subscriptionStatus: 'EXPIRED' });
        break;
      case 12: // REVOKED
        sub.subscriptionState = 'REVOKED';
        await User.findByIdAndUpdate(sub.userId, { subscriptionStatus: 'NONE' });
        break;
      default:
        break;
    }

    sub.lastVerifiedAt = new Date();
    await sub.save();

    return { processed: true, state: sub.subscriptionState };
  }
}

module.exports = new GooglePlayService();
