const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const PaymentEvent = require('../models/PaymentEvent');
const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');
const analyticsService = require('../services/analyticsService');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'elwo-admin-secret-key-2026';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (admin.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Admin account is disabled' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      adminId: admin._id,
      adminEmail: admin.email,
      details: { ip: req.ip }
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin
  });
};

exports.getDashboard = async (req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    return res.status(200).json({
      success: true,
      ...metrics
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, filter, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter === 'Active') query.status = 'ACTIVE';
    else if (filter === 'Blocked') query.status = 'BLOCKED';
    else if (filter === 'Premium') query.subscriptionStatus = 'ACTIVE';
    else if (filter === 'Free') query.subscriptionStatus = { $in: ['FREE', null] };
    else if (filter === 'Expired') query.subscriptionStatus = 'EXPIRED';

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'BLOCKED';
    user.updatedAt = new Date();
    await user.save();

    await AuditLog.create({
      action: 'USER_BLOCKED',
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      targetUserId: user._id,
      details: { reason: reason || 'Violation of terms', userName: user.name, userEmail: user.email }
    });

    return res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = 'ACTIVE';
    user.updatedAt = new Date();
    await user.save();

    await AuditLog.create({
      action: 'USER_UNBLOCKED',
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      targetUserId: user._id,
      details: { userName: user.name, userEmail: user.email }
    });

    return res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await PaymentEvent.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, validFrom, validUntil, usageLimit, perUserLimit, googlePlayPromoCode } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description,
      discountType: discountType || 'PERCENTAGE',
      discountValue: discountValue || 10,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit || 0,
      perUserLimit: perUserLimit || 1,
      googlePlayPromoCode,
      status: 'ACTIVE'
    });

    await AuditLog.create({
      action: 'COUPON_CREATED',
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      details: { code: coupon.code, discountValue: coupon.discountValue }
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.status = coupon.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await coupon.save();

    await AuditLog.create({
      action: coupon.status === 'ACTIVE' ? 'COUPON_ENABLED' : 'COUPON_DISABLED',
      adminId: req.admin._id,
      adminEmail: req.admin.email,
      details: { code: coupon.code, status: coupon.status }
    });

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth();
    return res.status(200).json({ success: true, ...health });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
