const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { verifyAdminToken, requireRole } = require('../middleware/adminAuth');

// ----------------------------------------------------
// Public Catalog Endpoints (Used by Mobile App)
// ----------------------------------------------------
router.get('/home', musicController.getHomeData);
router.get('/tracks/newly-added', musicController.getNewlyAdded);
router.get('/tracks/new-releases', musicController.getNewReleases);
router.get('/tracks', musicController.getTracks);
router.get('/search', musicController.searchTracks);
router.get('/tracks/:id', musicController.getTrackById);
router.post('/tracks/:id/like', musicController.likeTrack);
router.post('/tracks/:id/skip', musicController.skipTrack);

// ----------------------------------------------------
// Admin Management Endpoints (Protected with JWT)
// ----------------------------------------------------
router.get('/admin/tracks', verifyAdminToken, musicController.adminGetTracks);
router.get('/admin/stats', verifyAdminToken, musicController.adminGetStats);
router.post('/admin/sync', verifyAdminToken, musicController.adminTriggerSync);
router.get('/admin/sync-logs', verifyAdminToken, musicController.adminGetSyncLogs);
router.post('/admin/tracks', verifyAdminToken, musicController.adminCreateTrack);
router.put('/admin/tracks/:id', verifyAdminToken, musicController.adminUpdateTrack);
router.patch('/admin/tracks/:id/publish', verifyAdminToken, musicController.adminTogglePublish);
router.delete('/admin/tracks/:id', verifyAdminToken, requireRole(['SUPER_ADMIN', 'ADMIN']), musicController.adminDeleteTrack);

module.exports = router;
