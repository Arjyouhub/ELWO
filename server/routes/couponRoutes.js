const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken } = require('../middleware/auth');

router.post('/validate', verifyToken, couponController.validateCoupon);
router.post('/redeem', verifyToken, couponController.redeemCoupon);

module.exports = router;
