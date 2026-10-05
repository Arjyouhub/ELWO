/**
 * Adds user-requested songs directly into the live MongoDB catalog:
 * - AMBILY SONGS ("Aaraadhike", "Njan Jackson Allada")
 * - KHALIFA (Malayalam 2026)
 * - I M GAME ("Mazhavillaye" - I'M Game 2026)
 * - JAILER 2 ("Hukum Reloaded" - Jailer 2 2026 & "Kaavaalaa" - Jailer)
 * - KUNJIKAVIL MEGAME ("Kunjikkavil Meghame" - Aashaan 2026)
 * - MEGAME ("Megham Karukatha" & "Megame Megame")
 */

require('dotenv').config();
const { connectDB } = require('../config/db');
const Track = require('../models/Track');
const CryptoJS = require('crypto-js');

const DES_KEY_BYTES = CryptoJS.enc.Utf8.parse('38346591');

const SONG_IDS = [
  'ER5NUWNt', // Aaraadhike (Ambili)
  '6NN9zI_P', // Njan Jackson Allada (Ambili)
  'ipWNqOmb', // Khalifa (2026)
  'VU9Tu56D', // Mazhavillaye (I'M Game 2026)
  'haBhsw5G', // Hukum Reloaded (Jailer 2 2026)
  'nHs_0eEA', // Kaavaalaa (Jailer)
  'oNf1sczn', // Kunjikkavil Meghame (2026)
  '-TFpspH-', // Megham Karukatha (Thiruchitrambalam)
  'W7ZEsyHF', // Megame Megame
];

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

function decryptMediaUrl(encryptedUrl) {
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
      return decrypted.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
    }
  } catch (e) {}
  return '';
}

async function addSongs() {
  await connectDB();
  console.log(`[ELWO] Fetching metadata for ${SONG_IDS.length} requested songs...`);

  const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${SONG_IDS.join(',')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data = await res.json();

  let addedCount = 0;
  let updatedCount = 0;

  for (const id of SONG_IDS) {
    const raw = data[id];
    if (!raw) {
      console.warn(`[ELWO] Song ID ${id} not found in provider`);
      continue;
    }

    const title = cleanHtml(raw.song || raw.title || 'Untitled');
    const artistName = cleanHtml(raw.primary_artists || raw.singers || raw.music || 'Various Artists');
    const albumTitle = cleanHtml(raw.album || '');
    const streamUrl = decryptMediaUrl(raw.encrypted_media_url);

    if (!streamUrl) {
      console.warn(`[ELWO] Could not decrypt audio URL for "${title}" (${id})`);
      continue;
    }

    let artworkUrl = raw.image || '';
    if (artworkUrl) {
      artworkUrl = artworkUrl.replace('150x150', '500x500').replace('50x50', '500x500');
    }

    const rawLang = raw.language ? raw.language.charAt(0).toUpperCase() + raw.language.slice(1).toLowerCase() : 'Malayalam';
    const language = ['Malayalam', 'Tamil', 'Hindi', 'English'].includes(rawLang) ? rawLang : 'Malayalam';

    let releaseDate = raw.release_date || (raw.year ? `${raw.year}-01-01` : '2026-01-01');
    if (/^\d{4}$/.test(releaseDate)) {
      releaseDate = `${releaseDate}-01-01`;
    }

    const trackDoc = {
      provider: 'jiosaavn',
      providerTrackId: String(id),
      title,
      artistName,
      artistId: raw.primary_artists_id || 'saavn_artist',
      albumTitle,
      albumId: raw.albumid || null,
      language,
      genre: cleanHtml(raw.genre || raw.origin || 'Soundtrack'),
      streamUrl,
      audioSource: streamUrl,
      artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
      duration: parseInt(raw.duration || '0', 10) || 195,
      releaseDate,
      addedAt: new Date(), // Just added to ELWO!
      isPublished: true,
      playCount: parseInt(raw.play_count || '0', 10) || 120000,
      lyrics: raw.lyrics ? cleanHtml(raw.lyrics) : null,
      year: raw.year ? String(raw.year) : undefined,
    };

    const existing = await Track.findOne({ provider: 'jiosaavn', providerTrackId: String(id) });
    if (!existing) {
      await Track.create(trackDoc);
      addedCount++;
      console.log(`[ELWO] ✅ ADDED: "${title}" (${language}) - Album: "${albumTitle}" [NEW]`);
    } else {
      existing.title = title;
      existing.artistName = artistName;
      existing.albumTitle = albumTitle;
      existing.streamUrl = streamUrl;
      existing.audioSource = streamUrl;
      existing.artworkUrl = artworkUrl;
      existing.isPublished = true;
      existing.addedAt = new Date(); // Re-tag as freshly added
      await existing.save();
      updatedCount++;
      console.log(`[ELWO] 🔄 UPDATED & PUBLISHED: "${title}" (${language}) [NEW]`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`[ELWO] Successfully processed: ${addedCount} added, ${updatedCount} updated.`);
  console.log(`[ELWO] Total songs now in catalog: ${await Track.countDocuments()}`);
  console.log(`====================================================`);
  process.exit(0);
}

addSongs().catch(err => {
  console.error('[ELWO] Error adding songs:', err);
  process.exit(1);
});
