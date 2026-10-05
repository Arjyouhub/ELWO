const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

router.get('/me', verifyToken, userController.getMe);
router.patch('/me', verifyToken, userController.updateMe);
router.patch('/preferences', verifyToken, userController.updatePreferences);
router.post('/preferences', verifyToken, userController.updatePreferences);

module.exports = router;
