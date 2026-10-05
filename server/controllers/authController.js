const authService = require('../services/authService');
const User = require('../models/User');

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token required' });
    }
    const result = await authService.verifyGoogleToken(idToken);
    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
      isNewUser: result.isNewUser,
      serverTime: Date.now()
    });
  } catch (error) {
    if (error.message === 'USER_BLOCKED') {
      return res.status(403).json({
        success: false,
        code: 'USER_BLOCKED',
        message: 'Your account has been blocked. Please contact support.'
      });
    }
    return res.status(401).json({ success: false, message: error.message });
  }
};

exports.guestLogin = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const session = await authService.createGuestSession(deviceId);
    return res.status(200).json({
      success: true,
      ...session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGuestStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const status = await authService.getGuestSessionStatus(sessionId);
    return res.status(200).json({
      success: true,
      ...status
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        code: 'USER_BLOCKED',
        message: 'Your account has been blocked. Please contact support.'
      });
    }
    user.lastActiveAt = new Date();
    await user.save();
    return res.status(200).json({
      success: true,
      user,
      serverTime: Date.now()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getServerTime = (req, res) => {
  return res.status(200).json({ serverTime: Date.now() });
};

exports.registerSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.sendRegistrationOtp(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.registerVerifyOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    const result = await authService.verifyRegistrationOtp(name, email, password, otp);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.loginEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginWithEmail(email, password);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'USER_BLOCKED') {
      return res.status(403).json({
        success: false,
        code: 'USER_BLOCKED',
        message: 'Your account has been blocked. Please contact support.',
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};
