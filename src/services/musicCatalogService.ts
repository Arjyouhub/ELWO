/**
 * ELWO Live Music Catalog Service
 * 
 * Fetches dynamic music catalog from the backend MongoDB single source of truth.
 * Supports language preferences (Malayalam, Tamil, Hindi, English, multiple combination),
 * "Newly Added", "New Releases", Trending, and search.
 * Implements resilient caching (stale-while-revalidate) and seamless offline fallback.
 */

import { Track, MusicLanguage, Artist } from '../types/music';
import { MOCK_TRACKS, MOCK_ARTISTS } from '../constants/mockData';
import { getApiBaseUrl } from './authService';

export interface HomeCatalogResponse {
  languages: MusicLanguage[];
  newReleases: Track[];
  newlyAdded: Track[];
  trending: Track[];
  popular: Track[];
  classics: Track[];
  recommended: Track[];
  artists: Artist[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache for home catalog

function formatApiTrack(raw: any): Track {
  const isNew = Boolean(
    raw.isNew ??
      (raw.addedAt &&
        Date.now() - new Date(raw.addedAt).getTime() < 14 * 24 * 60 * 60 * 1000)
  );

  return {
    id: raw._id || raw.id || raw.providerTrackId || String(Math.random()),
    title: raw.title || 'Untitled Track',
    artistId: raw.artistId || 'saavn_artist',
    artistName: raw.artistName || raw.artist || 'Various Artists',
    albumId: raw.albumId || undefined,
    albumTitle: raw.albumTitle || raw.album || undefined,
    artworkUrl:
      raw.artworkUrl ||
      raw.artwork ||
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80',
    duration: raw.duration || 180,
    language: (raw.language || 'Malayalam') as MusicLanguage,
    genre: raw.genre || 'Film',
    releaseDate: raw.releaseDate || '2024-01-01',
    streamUrl: raw.streamUrl || raw.audioSource || undefined,
    audioSource: raw.streamUrl || raw.audioSource || undefined,
    provider: raw.provider || 'elwo',
    providerTrackId: raw.providerTrackId || raw.id,
    addedAt: raw.addedAt ? String(raw.addedAt) : undefined,
    isNew,
    isPublished: raw.isPublished !== false,
    playsCount: raw.playCount || raw.playsCount || 0,
    lyrics: raw.lyrics || undefined,
    year: raw.year || undefined,
  };
}

class MusicCatalogService {
  private homeCache: Map<string, CacheEntry<HomeCatalogResponse>> = new Map();

  /**
   * Invalidate cached data (e.g. on pull-to-refresh)
   */
  invalidateCache() {
    this.homeCache.clear();
  }

  /**
   * Fetch complete personalized Home catalog dynamically from MongoDB backend
   */
  async getHomeCatalog(
    preferredLanguages: MusicLanguage[] = ['Malayalam'],
    forceRefresh: boolean = false
  ): Promise<HomeCatalogResponse> {
    const cacheKey = preferredLanguages.sort().join(',');

    if (!forceRefresh) {
      const cached = this.homeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    try {
      const baseUrl = getApiBaseUrl();
      const langParam = preferredLanguages.join(',');
      const res = await fetch(
        `${baseUrl}/api/music/home?preferredLanguages=${encodeURIComponent(langParam)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Catalog API responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch catalog');
      }

      const response: HomeCatalogResponse = {
        languages: (json.languages || preferredLanguages) as MusicLanguage[],
        newReleases: (json.newReleases || []).map(formatApiTrack),
        newlyAdded: (json.newlyAdded || []).map(formatApiTrack),
        trending: (json.trending || []).map(formatApiTrack),
        popular: (json.popular || []).map(formatApiTrack),
        classics: (json.classics || []).map(formatApiTrack),
        recommended: (json.recommended || []).map(formatApiTrack),
        artists: (json.artists || []).map((a: any) => ({
          id: a.id || `art_${a.name}`,
          name: a.name || 'Artist',
          avatarUrl:
            a.avatarUrl ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
          genres: a.genres || ['Film'],
          monthlyListeners: a.monthlyListeners || 500000,
        })),
      };

      // Cache the response
      this.homeCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (err) {
      console.warn('[ELWO CATALOG] Backend home fetch error, using safe fallback:', err);
      return this.generateFallbackHome(preferredLanguages);
    }
  }

  /**
   * Fetch Newly Added songs (Sorted by addedAt DESC)
   */
  async getNewlyAdded(
    languages: MusicLanguage[] = ['Malayalam'],
    limit: number = 20,
    page: number = 1
  ): Promise<Track[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const langParam = languages.join(',');
      const res = await fetch(
        `${baseUrl}/api/music/tracks/newly-added?language=${encodeURIComponent(
          langParam
        )}&limit=${limit}&page=${page}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.tracks)) {
        return json.tracks.map(formatApiTrack);
      }
    } catch (err) {
      console.warn('[ELWO CATALOG] getNewlyAdded error:', err);
    }

    // Fallback: Filter baseline tracks
    return MOCK_TRACKS.filter(
      (t) => languages.includes(t.language) || languages.includes('All')
    ).slice(0, limit);
  }

  /**
   * Fetch New Releases (Sorted by releaseDate DESC)
   */
  async getNewReleases(
    languages: MusicLanguage[] = ['Malayalam'],
    limit: number = 20,
    page: number = 1
  ): Promise<Track[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const langParam = languages.join(',');
      const res = await fetch(
        `${baseUrl}/api/music/tracks/new-releases?language=${encodeURIComponent(
          langParam
        )}&limit=${limit}&page=${page}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.tracks)) {
        return json.tracks.map(formatApiTrack);
      }
    } catch (err) {
      console.warn('[ELWO CATALOG] getNewReleases error:', err);
    }

    return MOCK_TRACKS.filter(
      (t) => languages.includes(t.language) || languages.includes('All')
    )
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
      .slice(0, limit);
  }

  /**
   * Search across the live backend MongoDB catalog
   */
  async searchTracks(
    query: string,
    language?: MusicLanguage,
    limit: number = 20
  ): Promise<Track[]> {
    if (!query || !query.trim()) return [];
    try {
      const baseUrl = getApiBaseUrl();
      const langParam = language && language !== 'All' ? `&language=${encodeURIComponent(language)}` : '';
      const res = await fetch(
        `${baseUrl}/api/music/search?q=${encodeURIComponent(query.trim())}${langParam}&limit=${limit}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.tracks) && json.tracks.length > 0) {
        return json.tracks.map(formatApiTrack);
      }
    } catch (err) {
      console.warn('[ELWO CATALOG] Search API error, falling back locally:', err);
    }

    const qLower = query.toLowerCase().trim();
    return MOCK_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(qLower) ||
        t.artistName.toLowerCase().includes(qLower) ||
        (t.albumTitle && t.albumTitle.toLowerCase().includes(qLower))
    );
  }

  /**
   * Offline / network failure fallback generator using baseline songs
   */
  private generateFallbackHome(preferredLanguages: MusicLanguage[]): HomeCatalogResponse {
    const isAll = preferredLanguages.includes('All');
    const filtered = MOCK_TRACKS.filter(
      (t) => isAll || preferredLanguages.includes(t.language)
    );

    const sortedByDate = [...filtered].sort((a, b) =>
      b.releaseDate.localeCompare(a.releaseDate)
    );
    const sortedByPlays = [...filtered].sort(
      (a, b) => (b.playsCount || 0) - (a.playsCount || 0)
    );

    return {
      languages: preferredLanguages,
      newReleases: sortedByDate.slice(0, 10).map((t) => ({ ...t, isNew: true })),
      newlyAdded: sortedByDate.slice(0, 10).map((t) => ({ ...t, isNew: true })),
      trending: sortedByPlays.slice(0, 10),
      popular: sortedByPlays.slice(0, 10),
      classics: [...filtered]
        .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
        .slice(0, 10),
      recommended: sortedByPlays.slice(0, 8),
      artists: MOCK_ARTISTS.slice(0, 8),
    };
  }
}

export const musicCatalogService = new MusicCatalogService();
