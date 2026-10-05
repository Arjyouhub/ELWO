const Track = require('../models/Track');
const MusicSyncLog = require('../models/MusicSyncLog');
const musicSyncService = require('../services/musicSyncService');

/**
 * Parses languages from query string
 * Accepts: 'Malayalam' or 'Malayalam,Tamil' or array
 */
function parseLanguages(langParam) {
  if (!langParam) return ['Malayalam', 'Tamil', 'Hindi', 'English'];
  if (Array.isArray(langParam)) return langParam;
  const split = langParam.split(',').map((l) => l.trim()).filter(Boolean);
  if (split.length === 0 || split.includes('All')) {
    return ['Malayalam', 'Tamil', 'Hindi', 'English'];
  }
  return split;
}

// ----------------------------------------------------
// PUBLIC MOBILE APP CATALOG ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/music/home
 * Single Source of Truth for Home Screen
 * Supports preferredLanguages query: e.g. ?preferredLanguages=Malayalam,Tamil
 */
exports.getHomeData = async (req, res) => {
  try {
    const rawLanguages = req.query.preferredLanguages || req.query.languages || req.query.language;
    const languages = parseLanguages(rawLanguages);

    const baseFilter = {
      isPublished: true,
      language: { $in: languages },
    };

    // Parallel optimized queries
    const [
      newReleases,
      newlyAdded,
      trending,
      popular,
      classics,
      recommended,
      distinctArtists,
    ] = await Promise.all([
      // 1. New Releases (Sorted by actual releaseDate DESC)
      Track.find(baseFilter).sort({ releaseDate: -1, _id: -1 }).limit(15).lean(),

      // 2. Newly Added (Sorted by date added to ELWO catalog DESC)
      Track.find(baseFilter).sort({ addedAt: -1, _id: -1 }).limit(15).lean(),

      // 3. Trending (High play count + high engagement)
      Track.find(baseFilter).sort({ playCount: -1, likeCount: -1 }).limit(15).lean(),

      // 4. Popular (Community favorites)
      Track.find(baseFilter).sort({ likeCount: -1, playCount: -1 }).limit(15).lean(),

      // 5. Classics (Older golden tracks released before 2023 or oldest available)
      Track.find({
        ...baseFilter,
        releaseDate: { $lt: '2023-01-01' },
      })
        .sort({ releaseDate: 1 })
        .limit(15)
        .lean()
        .then(async (results) => {
          if (results.length >= 6) return results;
          // Fallback: older tracks from catalog
          return Track.find(baseFilter).sort({ releaseDate: 1 }).limit(12).lean();
        }),

      // 6. Recommended Mix
      Track.find(baseFilter).sort({ playCount: -1, addedAt: -1 }).limit(15).lean(),

      // 7. Artists represented in current language catalog
      Track.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$artistName',
            artistId: { $first: '$artistId' },
            artworkUrl: { $first: '$artworkUrl' },
            genre: { $first: '$genre' },
            trackCount: { $sum: 1 },
          },
        },
        { $sort: { trackCount: -1 } },
        { $limit: 12 },
      ]),
    ]);

    // Format artists list
    const artists = distinctArtists.map((a) => ({
      id: a.artistId || `art_${encodeURIComponent(a._id)}`,
      name: a._id,
      avatarUrl:
        a.artworkUrl ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      genres: [a.genre || 'Soundtrack'],
      monthlyListeners: Math.floor(Math.random() * 800000) + 200000,
      trackCount: a.trackCount,
    }));

    return res.status(200).json({
      success: true,
      languages,
      newReleases,
      newlyAdded,
      trending,
      popular,
      classics,
      recommended,
      artists,
    });
  } catch (err) {
    console.error('[ELWO MUSIC] getHomeData error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/music/tracks/newly-added
 * Sort: addedAt DESC
 */
exports.getNewlyAdded = async (req, res) => {
  try {
    const languages = parseLanguages(req.query.language || req.query.languages);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {
      isPublished: true,
      language: { $in: languages },
    };

    const [tracks, total] = await Promise.all([
      Track.find(filter).sort({ addedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Track.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/music/tracks/new-releases
 * Sort: releaseDate DESC
 */
exports.getNewReleases = async (req, res) => {
  try {
    const languages = parseLanguages(req.query.language || req.query.languages);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {
      isPublished: true,
      language: { $in: languages },
    };

    const [tracks, total] = await Promise.all([
      Track.find(filter).sort({ releaseDate: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Track.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/music/tracks
 * General track list with language & cursor/page pagination
 */
exports.getTracks = async (req, res) => {
  try {
    const languages = parseLanguages(req.query.language || req.query.languages);
    const genre = req.query.genre;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {
      isPublished: true,
      language: { $in: languages },
    };
    if (genre) {
      filter.genre = new RegExp(genre, 'i');
    }

    const [tracks, total] = await Promise.all([
      Track.find(filter).sort({ addedAt: -1 }).skip(skip).limit(limit).lean(),
      Track.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/music/search
 * Server-side search across title, artistName, albumTitle, genre.
 * Includes newly added tracks immediately.
 */
exports.searchTracks = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(200).json({ success: true, tracks: [] });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const regex = new RegExp(q, 'i');

    const filter = {
      isPublished: true,
      $or: [
        { title: regex },
        { artistName: regex },
        { albumTitle: regex },
        { genre: regex },
      ],
    };

    if (req.query.language && req.query.language !== 'All') {
      filter.language = req.query.language;
    }

    const tracks = await Track.find(filter).sort({ playCount: -1 }).limit(limit).lean();

    return res.status(200).json({
      success: true,
      query: q,
      count: tracks.length,
      tracks,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/music/tracks/:id
 * Fetch single track and increment play count
 */
exports.getTrackById = async (req, res) => {
  try {
    const track = await Track.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    ).lean();

    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    return res.status(200).json({ success: true, track });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/music/tracks/:id/like
 */
exports.likeTrack = async (req, res) => {
  try {
    const increment = req.body.liked === false ? -1 : 1;
    const track = await Track.findByIdAndUpdate(
      req.params.id,
      { $inc: { likeCount: increment } },
      { new: true }
    ).lean();
    return res.status(200).json({ success: true, likeCount: track?.likeCount || 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/music/tracks/:id/skip
 */
exports.skipTrack = async (req, res) => {
  try {
    await Track.findByIdAndUpdate(req.params.id, { $inc: { skipCount: 1 } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------------------------------------------
// ADMIN DASHBOARD CATALOG MANAGEMENT ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/admin/music/tracks
 */
exports.adminGetTracks = async (req, res) => {
  try {
    const { tab, language, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (tab === 'published') {
      filter.isPublished = true;
    } else if (tab === 'drafts') {
      filter.isPublished = false;
    } else if (tab === 'new') {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      filter.addedAt = { $gte: fourteenDaysAgo };
    } else if (tab === 'updated') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.updatedAt = { $gte: sevenDaysAgo };
    }

    if (language && language !== 'All') {
      filter.language = language;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { artistName: regex }, { albumTitle: regex }];
    }

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (p - 1) * l;

    const [tracks, total] = await Promise.all([
      Track.find(filter).sort({ addedAt: -1, _id: -1 }).skip(skip).limit(l).lean(),
      Track.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tracks,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/music/stats
 */
exports.adminGetStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalTracks, publishedTracks, draftTracks, newToday, newThisWeek, lastSyncLog] =
      await Promise.all([
        Track.countDocuments(),
        Track.countDocuments({ isPublished: true }),
        Track.countDocuments({ isPublished: false }),
        Track.countDocuments({ addedAt: { $gte: startOfToday } }),
        Track.countDocuments({ addedAt: { $gte: sevenDaysAgo } }),
        MusicSyncLog.findOne().sort({ startedAt: -1 }).lean(),
      ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalTracks,
        publishedTracks,
        draftTracks,
        newToday,
        newThisWeek,
        lastSync: lastSyncLog,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/music/sync
 * Manually triggered catalog sync from Admin UI
 */
exports.adminTriggerSync = async (req, res) => {
  try {
    console.log('[ELWO ADMIN] Manual catalog sync requested by admin');
    const result = await musicSyncService.syncCatalog('ADMIN');
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/music/sync-logs
 */
exports.adminGetSyncLogs = async (req, res) => {
  try {
    const logs = await MusicSyncLog.find().sort({ startedAt: -1 }).limit(10).lean();
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/music/tracks
 * Manually add a song
 */
exports.adminCreateTrack = async (req, res) => {
  try {
    const {
      title,
      artistName,
      albumTitle,
      language,
      genre,
      artworkUrl,
      streamUrl,
      releaseDate,
      isPublished = true,
      duration = 180,
    } = req.body;

    if (!title || !artistName || !language || !streamUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, Artist, Language, and Audio Stream URL are required.',
      });
    }

    const providerTrackId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const track = await Track.create({
      provider: 'manual',
      providerTrackId,
      title: title.trim(),
      artistName: artistName.trim(),
      albumTitle: albumTitle ? albumTitle.trim() : null,
      language,
      genre: genre ? genre.trim() : 'Film',
      artworkUrl:
        artworkUrl ||
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
      streamUrl: streamUrl.trim(),
      audioSource: streamUrl.trim(),
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      addedAt: new Date(),
      isPublished: Boolean(isPublished),
      duration: parseInt(duration, 10) || 180,
    });

    return res.status(201).json({ success: true, track });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/admin/music/tracks/:id
 * Edit track metadata
 */
exports.adminUpdateTrack = async (req, res) => {
  try {
    const {
      title,
      artistName,
      albumTitle,
      language,
      genre,
      artworkUrl,
      streamUrl,
      releaseDate,
      isPublished,
      duration,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (artistName !== undefined) updates.artistName = artistName.trim();
    if (albumTitle !== undefined) updates.albumTitle = albumTitle.trim();
    if (language !== undefined) updates.language = language;
    if (genre !== undefined) updates.genre = genre.trim();
    if (artworkUrl !== undefined) updates.artworkUrl = artworkUrl.trim();
    if (streamUrl !== undefined) {
      updates.streamUrl = streamUrl.trim();
      updates.audioSource = streamUrl.trim();
    }
    if (releaseDate !== undefined) updates.releaseDate = releaseDate;
    if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);
    if (duration !== undefined) updates.duration = parseInt(duration, 10) || 180;

    const track = await Track.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    return res.status(200).json({ success: true, track });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/admin/music/tracks/:id/publish
 * Toggle publish status (Publish / Unpublish)
 */
exports.adminTogglePublish = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    track.isPublished = !track.isPublished;
    await track.save();

    return res.status(200).json({
      success: true,
      isPublished: track.isPublished,
      track,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/admin/music/tracks/:id
 */
exports.adminDeleteTrack = async (req, res) => {
  try {
    const deleted = await Track.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }
    return res.status(200).json({ success: true, message: 'Track deleted from catalog' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
