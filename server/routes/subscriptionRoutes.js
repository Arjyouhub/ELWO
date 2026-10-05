const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/auth');

router.post('/verify', verifyToken, subscriptionController.verifyPurchase);
router.get('/my', verifyToken, subscriptionController.getMySubscription);

module.exports = router;
