/**
 * ELWO Music Catalog Sync Service
 * 
 * Synchronizes new releases, newly added songs, and metadata
 * from authorized music provider APIs directly into MongoDB.
 * Enforces duplicate protection via compound unique index (provider + providerTrackId).
 */

const CryptoJS = require('crypto-js');
const Track = require('../models/Track');
const MusicSyncLog = require('../models/MusicSyncLog');

const DES_KEY_BYTES = CryptoJS.enc.Utf8.parse('38346591');

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

// Search keywords prioritized by language for latest songs & releases
const LANGUAGE_DISCOVERY_QUERIES = {
  Malayalam: [
    'Malayalam New Movie Songs 2025',
    'Latest Malayalam Hits 2025',
    'Bethlehem Kudumba Unit',
    'Malayalam Trending Songs',
  ],
  Tamil: [
    'Latest Tamil Movie Songs 2025',
    'Trending Tamil Hits 2025',
    'Tamil New Releases',
  ],
  Hindi: [
    'Latest Bollywood Releases 2025',
    'Top Hindi Songs 2025',
    'New Hindi Hits',
  ],
  English: [
    'Latest Global Pop Releases 2025',
    'Billboard Hot 100 Pop',
    'Top English Hits',
  ],
};

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();
}

function decryptMediaUrl(encryptedUrl, quality = '320') {
  if (!encryptedUrl) return '';
  try {
    const cipherParams = {
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl.trim()),
    };
    const decrypted = CryptoJS.DES.decrypt(cipherParams, DES_KEY_BYTES, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);

    if (decrypted && decrypted.startsWith('http')) {
      if (quality === '320') {
        return decrypted.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
      } else if (quality === '160') {
        return decrypted.replace('_96.mp4', '_160.mp4').replace('_320.mp4', '_160.mp4');
      }
      return decrypted;
    }
  } catch (err) {
    // Decryption error handled silently
  }
  return '';
}

function formatRawSong(rawSong, targetLanguage) {
  if (!rawSong) return null;
  const encUrl = rawSong.encrypted_media_url || '';
  let streamUrl = decryptMediaUrl(encUrl, '320');

  if (!streamUrl && rawSong.media_preview_url) {
    streamUrl = rawSong.media_preview_url
      .replace('preview', 'aac')
      .replace('_96_p.mp4', '_320.mp4');
  }

  if (!streamUrl) return null;

  let artworkUrl = rawSong.image || '';
  if (artworkUrl) {
    artworkUrl = artworkUrl.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  const durationSec = parseInt(rawSong.duration || '0', 10) || 180;
  const rawLang = rawSong.language ? rawSong.language.charAt(0).toUpperCase() + rawSong.language.slice(1).toLowerCase() : targetLanguage;
  const language = ['Malayalam', 'Tamil', 'Hindi', 'English'].includes(rawLang)
    ? rawLang
    : targetLanguage;

  const rawRelDate = rawSong.release_date || rawSong.year || new Date().toISOString().split('T')[0];
  let formattedRelDate = rawRelDate;
  if (/^\d{4}$/.test(rawRelDate)) {
    formattedRelDate = `${rawRelDate}-01-01`;
  }

  return {
    provider: 'jiosaavn',
    providerTrackId: String(rawSong.id),
    title: cleanHtml(rawSong.song || rawSong.title || 'Untitled Track'),
    artistName: cleanHtml(rawSong.primary_artists || rawSong.singers || rawSong.music || 'Various Artists'),
    artistId: rawSong.primary_artists_id || 'saavn_artist',
    albumTitle: cleanHtml(rawSong.album || ''),
    albumId: rawSong.albumid || null,
    artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
    duration: durationSec,
    language,
    genre: cleanHtml(rawSong.genre || rawSong.origin || 'Film Soundtrack'),
    releaseDate: formattedRelDate,
    streamUrl,
    audioSource: streamUrl,
    playCount: parseInt(rawSong.play_count || '0', 10) || 0,
    lyrics: rawSong.lyrics ? cleanHtml(rawSong.lyrics) : null,
    year: rawSong.year ? String(rawSong.year) : undefined,
    isPublished: true,
  };
}

async function searchProviderSongs(query, limit = 15) {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=${limit}&q=${encodeURIComponent(
      query.trim()
    )}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = JSON.parse(text.replace(/\(From "([^"]+)"\)/g, "(From '$1')"));
    }
    return data?.results || [];
  } catch (err) {
    console.warn(`[ELWO SYNC] Search failed for query "${query}":`, err.message);
    return [];
  }
}

class MusicSyncService {
  constructor() {
    this.isSyncing = false;
    this.scheduledTimer = null;
  }

  /**
   * Main catalog sync method.
   * Scans provider endpoints, prevents duplicates, updates metadata,
   * sets addedAt for newly added songs, and logs results in MusicSyncLog.
   */
  async syncCatalog(triggeredBy = 'SYSTEM') {
    if (this.isSyncing) {
      console.log('[ELWO SYNC] A catalog sync is already in progress, skipping.');
      return { status: 'IN_PROGRESS', message: 'Sync already running' };
    }

    this.isSyncing = true;
    const syncLog = new MusicSyncLog({
      startedAt: new Date(),
      triggeredBy,
      status: 'IN_PROGRESS',
    });
    await syncLog.save();

    let tracksScanned = 0;
    let tracksAdded = 0;
    let tracksUpdated = 0;
    let tracksSkipped = 0;
    let tracksFailed = 0;
    let errorSummary = null;

    try {
      console.log(`[ELWO SYNC] Starting catalog sync (Triggered by: ${triggeredBy})...`);

      for (const [lang, queries] of Object.entries(LANGUAGE_DISCOVERY_QUERIES)) {
        for (const query of queries) {
          try {
            // Respect provider rate limit with a polite delay
            await new Promise((resolve) => setTimeout(resolve, 400));
            const rawSongs = await searchProviderSongs(query, 12);
            tracksScanned += rawSongs.length;

            for (const raw of rawSongs) {
              try {
                const trackData = formatRawSong(raw, lang);
                if (!trackData) {
                  tracksSkipped++;
                  continue;
                }

                // Check existing track in MongoDB
                const existing = await Track.findOne({
                  provider: trackData.provider,
                  providerTrackId: trackData.providerTrackId,
                });

                if (!existing) {
                  // NEW SONG! Set addedAt to right now
                  trackData.addedAt = new Date();
                  await Track.create(trackData);
                  tracksAdded++;
                } else {
                  // Existing track: Check if metadata or stream needs refresh
                  let updated = false;
                  if (!existing.streamUrl && trackData.streamUrl) {
                    existing.streamUrl = trackData.streamUrl;
                    existing.audioSource = trackData.streamUrl;
                    updated = true;
                  }
                  if (!existing.artworkUrl && trackData.artworkUrl) {
                    existing.artworkUrl = trackData.artworkUrl;
                    updated = true;
                  }
                  if (trackData.playCount > existing.playCount) {
                    existing.playCount = trackData.playCount;
                    updated = true;
                  }
                  if (updated) {
                    await existing.save();
                    tracksUpdated++;
                  } else {
                    tracksSkipped++;
                  }
                }
              } catch (trackErr) {
                tracksFailed++;
                console.warn('[ELWO SYNC] Track sync failed:', trackErr.message);
              }
            }
          } catch (queryErr) {
            console.warn(`[ELWO SYNC] Query "${query}" failed:`, queryErr.message);
          }
        }
      }

      syncLog.status = 'SUCCESS';
    } catch (err) {
      console.error('[ELWO SYNC] Catalog sync fatal error:', err);
      syncLog.status = 'FAILED';
      errorSummary = err.message;
      syncLog.errorSummary = errorSummary;
    } finally {
      syncLog.completedAt = new Date();
      syncLog.tracksScanned = tracksScanned;
      syncLog.tracksAdded = tracksAdded;
      syncLog.tracksUpdated = tracksUpdated;
      syncLog.tracksSkipped = tracksSkipped;
      syncLog.tracksFailed = tracksFailed;
      await syncLog.save();

      this.isSyncing = false;
      console.log(
        `[ELWO SYNC] Finished. Scanned: ${tracksScanned}, Added: ${tracksAdded}, Updated: ${tracksUpdated}, Skipped: ${tracksSkipped}, Failed: ${tracksFailed}`
      );
    }

    return {
      status: syncLog.status,
      tracksScanned,
      tracksAdded,
      tracksUpdated,
      tracksSkipped,
      tracksFailed,
      durationMs: syncLog.completedAt.getTime() - syncLog.startedAt.getTime(),
      completedAt: syncLog.completedAt,
      errorSummary,
    };
  }

  /**
   * Schedule automatic recurring background sync
   */
  startScheduledSync(intervalMinutes = 30) {
    const mins = parseInt(process.env.MUSIC_SYNC_INTERVAL_MINUTES || intervalMinutes, 10) || 30;
    const ms = mins * 60 * 1000;
    console.log(`[ELWO SYNC] Scheduled background sync active (every ${mins} minutes)`);

    if (this.scheduledTimer) {
      clearInterval(this.scheduledTimer);
    }

    this.scheduledTimer = setInterval(() => {
      this.syncCatalog('SYSTEM').catch((err) => {
        console.error('[ELWO SYNC] Scheduled sync error:', err.message);
      });
    }, ms);
  }

  /**
   * Fetch latest sync status and history
   */
  async getSyncStatus() {
    const lastLog = await MusicSyncLog.findOne().sort({ startedAt: -1 }).lean();
    return {
      isSyncing: this.isSyncing,
      lastSync: lastLog,
    };
  }
}

const musicSyncService = new MusicSyncService();

module.exports = musicSyncService;
