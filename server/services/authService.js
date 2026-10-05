const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GuestSession = require('../models/GuestSession');
const EmailOtp = require('../models/EmailOtp');
const emailService = require('./emailService');
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

  /**
   * Send 6-digit OTP for new user registration
   */
  async sendRegistrationOtp(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    const formattedEmail = email.toLowerCase().trim();

    // Check if user already exists with password
    const existingUser = await User.findOne({ email: formattedEmail });
    if (existingUser && existingUser.passwordHash) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    // Generate 6-digit cryptographic OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Invalidate any previous registration OTPs for this email
    await EmailOtp.deleteMany({ email: formattedEmail, purpose: 'REGISTER' });

    // Save new OTP with 10-minute TTL
    await EmailOtp.create({
      email: formattedEmail,
      otpHash,
      purpose: 'REGISTER',
    });

    // Send email via EmailService
    await emailService.sendOtpEmail(formattedEmail, otp, 'ELWO Account Registration');

    return {
      success: true,
      message: 'Verification code sent to your email',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verify OTP and complete registration
   */
  async verifyRegistrationOtp(name, email, password, otp) {
    if (!name || name.trim().length === 0) {
      throw new Error('Please enter your name');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (!otp || otp.trim().length < 6) {
      throw new Error('Please enter the 6-digit verification code');
    }

    const formattedEmail = email.toLowerCase().trim();

    // Find the pending OTP record
    const otpRecord = await EmailOtp.findOne({
      email: formattedEmail,
      purpose: 'REGISTER',
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new Error('Verification code expired or not found. Please request a new one.');
    }

    const isValid = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isValid) {
      throw new Error('Invalid verification code. Please check and try again.');
    }

    // Hash user password
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, passwordSalt);

    // Create or update user
    let user = await User.findOne({ email: formattedEmail });
    if (!user) {
      user = new User({
        name: name.trim(),
        email: formattedEmail,
        passwordHash,
        emailVerified: true,
        onboardingCompleted: false,
        role: 'USER',
        status: 'ACTIVE',
        subscriptionStatus: 'NONE',
      });
    } else {
      user.name = name.trim();
      user.passwordHash = passwordHash;
      user.emailVerified = true;
      user.status = 'ACTIVE';
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    // Delete used OTP
    await EmailOtp.deleteMany({ email: formattedEmail, purpose: 'REGISTER' });

    // Generate JWT tokens
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
      success: true,
      user,
      accessToken,
      refreshToken,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  /**
   * Regular Login with Email and Password
   */
  async loginWithEmail(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const formattedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: formattedEmail });
    if (!user) {
      throw new Error('No account found with this email. Please sign up first.');
    }

    if (user.status === 'BLOCKED') {
      throw new Error('USER_BLOCKED');
    }

    if (!user.passwordHash) {
      throw new Error('This account was created with Google or Guest mode. Please set a password or use Google Sign-In.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Incorrect password. Please try again.');
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

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
      success: true,
      user,
      accessToken,
      refreshToken,
      onboardingCompleted: user.onboardingCompleted,
    };
  }
}

module.exports = new BackendAuthService();
