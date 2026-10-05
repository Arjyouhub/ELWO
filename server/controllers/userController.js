const User = require('../models/User');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (profileImage !== undefined) user.profileImage = profileImage; // can be null to remove

    user.updatedAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { preferredLanguages } = req.body;
    if (!Array.isArray(preferredLanguages) || preferredLanguages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'preferredLanguages must be a non-empty array'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.preferredLanguages = preferredLanguages;
    user.onboardingCompleted = true;
    user.updatedAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordHeartbeat = async (req, res) => {
  try {
    const { phoneModel, osName, activeSeconds } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.lastActiveAt = new Date();
    if (phoneModel && typeof phoneModel === 'string' && phoneModel.trim()) {
      user.phoneModel = phoneModel.trim();
    }
    if (osName && typeof osName === 'string' && osName.trim()) {
      user.osName = osName.trim();
    }
    const deltaSeconds = Math.max(0, Math.min(300, parseInt(activeSeconds, 10) || 30));
    user.usageDurationSeconds = (user.usageDurationSeconds || 0) + deltaSeconds;

    await user.save();

    return res.status(200).json({
      success: true,
      lastActiveAt: user.lastActiveAt,
      usageDurationSeconds: user.usageDurationSeconds,
      phoneModel: user.phoneModel,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

