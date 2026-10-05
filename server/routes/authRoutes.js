const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/google', authController.googleLogin);
router.post('/guest', authController.guestLogin);
router.get('/guest/:sessionId', authController.getGuestStatus);
router.get('/time', authController.getServerTime);
router.get('/me', verifyToken, authController.getMe);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
