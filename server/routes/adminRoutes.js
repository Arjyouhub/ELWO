const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken, requireRole } = require('../middleware/adminAuth');

// Public admin routes
router.post('/login', adminController.login);

// Protected admin routes
router.use(verifyAdminToken);

router.get('/me', adminController.getMe);
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users/:userId/block', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.blockUser);
router.post('/users/:userId/unblock', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.unblockUser);

router.get('/payments', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getPayments);
router.get('/subscriptions', adminController.getSubscriptions);

router.get('/coupons', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.getCoupons);
router.post('/coupons', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.createCoupon);
router.patch('/coupons/:couponId/status', requireRole(['SUPER_ADMIN', 'ADMIN']), adminController.toggleCouponStatus);

router.get('/audit-logs', requireRole(['SUPER_ADMIN']), adminController.getAuditLogs);
router.get('/system-health', adminController.getSystemHealth);

module.exports = router;
