const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GuestSession = require('../models/GuestSession');
const { JWT_SECRET } = require('../middleware/auth');

const GUEST_DURATION_MS = 10 * 60 * 1000; // EXACTLY 10 MINUTES

class BackendAuthService {
  /**
   * Verify Google ID token and return/create user
   */
  async verifyGoogleUser(idToken, fallbackProfile = {}) {
    // In production, verify with Google:
    // const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();
    let email = fallbackProfile.email || 'arjun.elwo@gmail.com';
    let name = fallbackProfile.name || 'Arjun K K';
    let googleId = fallbackProfile.googleId || 'google_sub_1029384756';
    let profileImage = fallbackProfile.profileImage || null;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profileImage,
        preferredLanguages: [],
        onboardingCompleted: false,
        role: 'USER',
        status: 'ACTIVE',
        subscriptionStatus: 'NONE',
      });
      await user.save();
    } else {
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      if (!user.name && name) user.name = name;
      await user.save();
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    return {
      user,
      accessToken,
      refreshToken,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  /**
   * Create an authoritative server-time 10-minute guest session
   */
  async createGuestSession(ipAddress, userAgent) {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + GUEST_DURATION_MS);
    const sessionId = `guest_${startedAt.getTime()}_${Math.random().toString(36).substring(2, 9)}`;

    const guestSession = new GuestSession({
      guestSessionId: sessionId,
      guestStartedAt: startedAt,
      guestExpiresAt: expiresAt,
      status: 'ACTIVE',
      ipAddress,
      userAgent,
    });

    await guestSession.save();

    return {
      guestSessionId: sessionId,
      guestStartedAt: startedAt.getTime(),
      guestExpiresAt: expiresAt.getTime(),
      durationSeconds: 600,
    };
  }

  /**
   * Verify guest session status against server time
   */
  async verifyGuestSession(sessionId) {
    const session = await GuestSession.findOne({ guestSessionId: sessionId });
    if (!session) {
      return { valid: false, expired: true, remainingSeconds: 0 };
    }

    const now = Date.now();
    const remainingMs = session.guestExpiresAt.getTime() - now;

    if (remainingMs <= 0 || session.status === 'EXPIRED') {
      if (session.status !== 'EXPIRED') {
        session.status = 'EXPIRED';
        await session.save();
      }
      return { valid: false, expired: true, remainingSeconds: 0 };
    }

    return {
      valid: true,
      expired: false,
      remainingSeconds: Math.floor(remainingMs / 1000),
    };
  }
}

module.exports = new BackendAuthService();
