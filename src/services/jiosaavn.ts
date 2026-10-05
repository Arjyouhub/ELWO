import CryptoJS from 'crypto-js';
import { Track, Album, Playlist, MusicLanguage } from '../types/music';

// Des decryption key from cyberboysumanjay/JioSaavnAPI
const DES_KEY_BYTES = CryptoJS.enc.Utf8.parse('38346591');

// Endpoints from cyberboysumanjay/JioSaavnAPI
const ENDPOINTS = {
  SEARCH_SONGS: 'https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&q=',
  SEARCH_BASE: 'https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=',
  SONG_DETAILS: 'https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=',
  ALBUM_DETAILS: 'https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&_format=json&cc=in&_marker=0%3F_marker%3D0&albumid=',
  PLAYLIST_DETAILS: 'https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&cc=in&_marker=0%3F_marker%3D0&listid=',
  LYRICS_BASE: 'https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&ctx=web6dot0&api_version=4&_format=json&_marker=0%3F_marker%3D0&lyrics_id=',
};

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

/**
 * Decodes HTML entities commonly returned by JioSaavn
 */
export function cleanHtmlString(str: string): string {
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
    .replace(/<br\s*\/?>/gi, '\n');
}

/**
 * Decrypts JioSaavn encrypted_media_url using DES-ECB algorithm as in JioSaavnAPI
 */
export function decryptMediaUrl(
  encryptedUrl: string,
  quality: '320' | '160' | '96' = '320'
): string {
  if (!encryptedUrl) return '';

  try {
    const cipherParams = {
      ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl.trim()),
    };

    const decrypted = CryptoJS.DES.decrypt(cipherParams as any, DES_KEY_BYTES, {
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
    console.warn('JioSaavn decryption error:', err);
  }

  return '';
}

/**
 * Formats a raw JioSaavn song object into our app's Track type
 */
export function formatJioSaavnSong(rawSong: any): Track {
  const encUrl = rawSong.encrypted_media_url || '';
  let streamUrl = decryptMediaUrl(encUrl, '320');

  // Fallback to preview or aac URL if decryption produced empty
  if (!streamUrl && rawSong.media_preview_url) {
    streamUrl = rawSong.media_preview_url
      .replace('preview', 'aac')
      .replace('_96_p.mp4', '_320.mp4');
  }

  // Artwork in max resolution (500x500)
  let artworkUrl = rawSong.image || '';
  if (artworkUrl) {
    artworkUrl = artworkUrl.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  const durationSec = parseInt(rawSong.duration || '0', 10) || 180;
  const lang = (rawSong.language || 'All') as MusicLanguage;
  const capitalizedLang =
    lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();

  return {
    id: rawSong.id || String(Math.random()),
    title: cleanHtmlString(rawSong.song || rawSong.title || 'Untitled Track'),
    artistId: rawSong.primary_artists_id || 'saavn_artist',
    artistName: cleanHtmlString(
      rawSong.primary_artists || rawSong.singers || rawSong.music || 'Unknown Artist'
    ),
    albumId: rawSong.albumid || undefined,
    albumTitle: cleanHtmlString(rawSong.album || ''),
    artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
    duration: durationSec,
    language: (['Malayalam', 'Tamil', 'Hindi', 'English'].includes(capitalizedLang)
      ? capitalizedLang
      : 'All') as MusicLanguage,
    genre: cleanHtmlString(rawSong.genre || rawSong.origin || 'JioSaavn Stream'),
    releaseDate: rawSong.release_date || rawSong.year || new Date().toISOString().split('T')[0],
    streamUrl: streamUrl || undefined,
    playsCount: parseInt(rawSong.play_count || '0', 10) || undefined,
    lyrics: rawSong.lyrics ? cleanHtmlString(rawSong.lyrics) : undefined,
    year: rawSong.year || undefined,
  };
}

export const JioSaavnService = {
  /**
   * Search songs by name or keywords using JioSaavn direct song search API
   * and fetch complete details + decrypted 320kbps audio URLs
   */
  async searchSongs(query: string, limit: number = 20): Promise<Track[]> {
    if (!query || query.trim().length === 0) return [];

    try {
      const directSearchUrl = `${ENDPOINTS.SEARCH_SONGS}${encodeURIComponent(query.trim())}&n=${limit}`;
      const res = await fetch(directSearchUrl, { headers: DEFAULT_HEADERS });
      const text = await res.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/\(From "([^"]+)"\)/g, "(From '$1')");
        data = JSON.parse(cleaned);
      }

      if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
        const tracks: Track[] = [];
        for (const raw of data.results) {
          try {
            const track = formatJioSaavnSong(raw);
            if (track.streamUrl) {
              tracks.push(track);
            }
          } catch {}
        }
        if (tracks.length > 0) {
          return tracks.slice(0, limit);
        }
      }

      // Fallback to autocomplete if direct search returned empty
      const searchUrl = `${ENDPOINTS.SEARCH_BASE}${encodeURIComponent(query.trim())}`;
      const acRes = await fetch(searchUrl, { headers: DEFAULT_HEADERS });
      const acText = await acRes.text();
      let acData: any;
      try {
        acData = JSON.parse(acText);
      } catch {
        acData = JSON.parse(acText.replace(/\(From "([^"]+)"\)/g, "(From '$1')"));
      }

      const songResults = acData?.songs?.data || [];
      if (!songResults || songResults.length === 0) {
        return [];
      }

      const songIds = songResults
        .slice(0, limit)
        .map((s: any) => s.id)
        .filter(Boolean);

      if (songIds.length === 0) return [];

      const detailsUrl = `${ENDPOINTS.SONG_DETAILS}${songIds.join(',')}`;
      const detailsRes = await fetch(detailsUrl, { headers: DEFAULT_HEADERS });
      const detailsData = await detailsRes.json();

      const tracks: Track[] = [];
      for (const id of songIds) {
        const raw = detailsData[id];
        if (raw) {
          const track = formatJioSaavnSong(raw);
          if (track.streamUrl) {
            tracks.push(track);
          }
        }
      }

      return tracks;
    } catch (err) {
      console.warn('JioSaavn searchSongs error:', err);
      return [];
    }
  },

  /**
   * Get single song details with 320kbps decrypted stream
   */
  async getSong(songId: string, fetchLyrics: boolean = false): Promise<Track | null> {
    try {
      const url = `${ENDPOINTS.SONG_DETAILS}${songId}`;
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      const raw = data[songId];
      if (!raw) return null;

      const track = formatJioSaavnSong(raw);
      if (fetchLyrics && raw.has_lyrics === 'true') {
        const lyrics = await this.getLyrics(songId);
        if (lyrics) track.lyrics = lyrics;
      }

      return track;
    } catch (err) {
      console.warn('JioSaavn getSong error:', err);
      return null;
    }
  },

  /**
   * Fetch song lyrics
   */
  async getLyrics(songId: string): Promise<string | null> {
    try {
      const url = `${ENDPOINTS.LYRICS_BASE}${songId}`;
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      if (data?.lyrics) {
        return cleanHtmlString(data.lyrics);
      }
      return null;
    } catch (err) {
      console.warn('JioSaavn getLyrics error:', err);
      return null;
    }
  },

  /**
   * Fetch complete album details with all tracks decrypted
   */
  async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const url = `${ENDPOINTS.ALBUM_DETAILS}${albumId}`;
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      if (!data) return null;

      const rawSongs = data.songs || [];
      const tracks: Track[] = rawSongs.map((s: any) => formatJioSaavnSong(s));

      let artworkUrl = data.image || '';
      if (artworkUrl) {
        artworkUrl = artworkUrl.replace('150x150', '500x500').replace('50x50', '500x500');
      }

      return {
        id: data.id || albumId,
        title: cleanHtmlString(data.title || data.name || 'Album'),
        artistId: data.primary_artists_id || 'saavn_artist',
        artistName: cleanHtmlString(data.primary_artists || 'Various Artists'),
        artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
        releaseDate: data.release_date || data.year || '2024',
        language: (data.language || 'All') as MusicLanguage,
        genre: cleanHtmlString(data.genre || 'Soundtrack'),
        tracks,
        trackCount: tracks.length,
      };
    } catch (err) {
      console.warn('JioSaavn getAlbum error:', err);
      return null;
    }
  },

  /**
   * Fetch complete playlist details with all tracks decrypted
   */
  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const url = `${ENDPOINTS.PLAYLIST_DETAILS}${playlistId}`;
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      if (!data) return null;

      const rawSongs = data.songs || [];
      const tracks: Track[] = rawSongs.map((s: any) => formatJioSaavnSong(s));

      let coverUrl = data.image || '';
      if (coverUrl) {
        coverUrl = coverUrl.replace('150x150', '500x500').replace('50x50', '500x500');
      }

      return {
        id: data.id || playlistId,
        title: cleanHtmlString(data.listname || data.title || 'Playlist'),
        description: cleanHtmlString(data.description || 'JioSaavn Curated Playlist'),
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&q=80',
        tracks,
        trackCount: tracks.length,
        creatorName: cleanHtmlString(data.firstname || 'JioSaavn Editor'),
        isUserCreated: false,
        createdAt: data.year || '2024',
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('JioSaavn getPlaylist error:', err);
      return null;
    }
  },

  /**
   * Search full songs catalog using JioSaavn search.getResults
   * returns complete track details + decrypted 320kbps URLs in one single ultra-fast call
   */
  async searchFullSongs(query: string, page: number = 1, limit: number = 20): Promise<Track[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=${page}&n=${limit}&q=${encodeURIComponent(
        query.trim()
      )}`;
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      const results = data.results || [];
      return results
        .map((r: any) => formatJioSaavnSong(r))
        .filter((t: Track) => !!t.streamUrl);
    } catch (err) {
      console.warn('searchFullSongs error:', err);
      return [];
    }
  },

  /**
   * Fetch daily trending songs by language/category (Live Dynamic Daily Updates)
   */
  async getDailyTrending(language: MusicLanguage = 'All', limit: number = 15): Promise<Track[]> {
    const queryMap: Record<string, string> = {
      Malayalam: 'Latest Malayalam Songs 2025',
      Tamil: 'Trending Tamil Hits 2024',
      Hindi: 'Top Bollywood Hindi Hits',
      English: 'Billboard Hot 100 Pop',
      All: 'Top India Trending Songs',
    };
    const query = queryMap[language] || 'Top India Trending Songs';
    const songs = await this.searchFullSongs(query, 1, limit + 10);
    const seen = new Set<string>();
    const filtered = songs.filter((s) => {
      if (language === 'Malayalam' && s.title.toLowerCase().includes('illuminati')) {
        return false;
      }
      const baseTitle = s.title.toLowerCase().replace(/\s*\(remix\)/gi, '').trim();
      if (seen.has(baseTitle)) return false;
      seen.add(baseTitle);
      return true;
    });
    return filtered.slice(0, limit);
  },

  /**
   * Fetch daily fresh new releases filtered by selected language
   */
  async getDailyNewReleases(language: MusicLanguage = 'All', limit: number = 12): Promise<Track[]> {
    if (language === 'Malayalam') {
      const [bethlehemSongs, latestMovieSongs] = await Promise.all([
        this.searchFullSongs('Bethlehem Kudumba Unit', 1, 8),
        this.searchFullSongs('Malayalam New Movie Songs 2025', 1, 10),
      ]);
      const merged = [...bethlehemSongs, ...latestMovieSongs];
      const seen = new Set<string>();
      const filtered = merged.filter((s) => {
        if (s.title.toLowerCase().includes('illuminati')) {
          return false;
        }
        const baseTitle = s.title.toLowerCase().replace(/\s*\(remix\)/gi, '').trim();
        if (seen.has(baseTitle)) return false;
        seen.add(baseTitle);
        return true;
      });
      return filtered.slice(0, limit);
    }

    const queryMap: Record<string, string> = {
      Tamil: 'Latest Tamil Movie Songs 2025',
      Hindi: 'Latest Bollywood Releases 2025',
      English: 'Latest Global Pop Releases 2025',
      All: 'Latest New Releases Hits 2025',
    };
    const query = queryMap[language] || 'Latest New Releases Hits 2025';
    const songs = await this.searchFullSongs(query, 1, limit + 10);
    const seen = new Set<string>();
    const filtered = songs.filter((s) => {
      const baseTitle = s.title.toLowerCase().replace(/\s*\(remix\)/gi, '').trim();
      if (seen.has(baseTitle)) return false;
      seen.add(baseTitle);
      return true;
    });
    return filtered.slice(0, limit);
  },

  /**
   * Fetch daily top charts
   */
  async getTopCharts(limit: number = 10): Promise<Track[]> {
    return this.searchFullSongs('Weekly Top 20 Songs', 1, limit);
  },
};
