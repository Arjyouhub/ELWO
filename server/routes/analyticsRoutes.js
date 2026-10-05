const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { verifyAdminToken } = require('../middleware/adminAuth');

router.use(verifyAdminToken);

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    return res.status(200).json({ success: true, metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth();
    return res.status(200).json({ success: true, health });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
