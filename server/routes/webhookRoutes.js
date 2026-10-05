const express = require('express');
const router = express.Router();
const googlePlayService = require('../services/googlePlayService');
const SystemEvent = require('../models/SystemEvent');

router.post('/google-play-rtdn', async (req, res) => {
  try {
    const payload = req.body;
    
    // Log the incoming RTDN event
    await SystemEvent.create({
      type: 'GOOGLE_PLAY_RTDN',
      source: 'Google Play Pub/Sub',
      payload,
      status: 'RECEIVED'
    });

    // In Google Cloud Pub/Sub, the message data is base64 encoded
    let rtdnData = payload;
    if (payload.message && payload.message.data) {
      const decoded = Buffer.from(payload.message.data, 'base64').toString('utf8');
      try {
        rtdnData = JSON.parse(decoded);
      } catch (err) {
        console.error('Failed to parse RTDN decoded JSON:', err);
      }
    }

    const result = await googlePlayService.handleRtdnNotification(rtdnData);

    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error handling RTDN webhook:', error);
    // Return 200 to acknowledge Pub/Sub message even on error to prevent infinite retry storms, but log event
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
