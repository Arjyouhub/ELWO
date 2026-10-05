import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, MusicLanguage } from '../types/music';
import { MOCK_TRACKS, MOCK_ARTISTS } from '../constants/mockData';

export interface UserListeningProfile {
  likedTrackIds: Set<string>;
  likedArtistIds: Set<string>;
  recentlyPlayedTrackIds: string[]; // most recent first (max 50)
  recentlySkippedTrackIds: string[]; // most recent first (max 30)
  playCountByTrackId: Record<string, number>;
  playCountByArtistId: Record<string, number>;
  playCountByGenre: Record<string, number>;
  playCountByLanguage: Record<string, number>;
  languagePreferences: MusicLanguage[];
}

export interface RecommendationWeights {
  familiarRatio: number; // 0.70
  discoveryRatio: number; // 0.20
  explorationRatio: number; // 0.10
}

const STORAGE_KEY = '@elwo_user_listening_profile';

class RecommendationEngine {
  private profile: UserListeningProfile = {
    likedTrackIds: new Set<string>(),
    likedArtistIds: new Set<string>(),
    recentlyPlayedTrackIds: [],
    recentlySkippedTrackIds: [],
    playCountByTrackId: {},
    playCountByArtistId: {},
    playCountByGenre: {},
    playCountByLanguage: {},
    languagePreferences: ['Malayalam', 'Tamil', 'Hindi', 'English'],
  };

  private dynamicPool: Map<string, Track> = new Map();

  private weights: RecommendationWeights = {
    familiarRatio: 0.7,
    discoveryRatio: 0.2,
    explorationRatio: 0.1,
  };

  constructor() {
    this.loadProfile();
    // Pre-populate dynamic pool with mock tracks
    MOCK_TRACKS.forEach((t) => this.dynamicPool.set(t.id, t));
  }

  // Register live tracks discovered via JioSaavn search or feeds
  registerTracks(tracks: Track[]) {
    if (!tracks || !Array.isArray(tracks)) return;
    for (const t of tracks) {
      if (t && t.id) {
        this.dynamicPool.set(t.id, t);
      }
    }
  }

  getAllTracks(extraTracks: Track[] = []): Track[] {
    this.registerTracks(extraTracks);
    return Array.from(this.dynamicPool.values());
  }

  private async loadProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.profile = {
          likedTrackIds: new Set(parsed.likedTrackIds || []),
          likedArtistIds: new Set(parsed.likedArtistIds || []),
          recentlyPlayedTrackIds: parsed.recentlyPlayedTrackIds || [],
          recentlySkippedTrackIds: parsed.recentlySkippedTrackIds || [],
          playCountByTrackId: parsed.playCountByTrackId || {},
          playCountByArtistId: parsed.playCountByArtistId || {},
          playCountByGenre: parsed.playCountByGenre || {},
          playCountByLanguage: parsed.playCountByLanguage || {},
          languagePreferences: parsed.languagePreferences || ['Malayalam', 'Tamil', 'Hindi', 'English'],
        };
      }
    } catch (e) {
      console.warn('Failed to load listening profile:', e);
    }
  }

  private async saveProfile() {
    try {
      const serialized = {
        likedTrackIds: Array.from(this.profile.likedTrackIds),
        likedArtistIds: Array.from(this.profile.likedArtistIds),
        recentlyPlayedTrackIds: this.profile.recentlyPlayedTrackIds,
        recentlySkippedTrackIds: this.profile.recentlySkippedTrackIds,
        playCountByTrackId: this.profile.playCountByTrackId,
        playCountByArtistId: this.profile.playCountByArtistId,
        playCountByGenre: this.profile.playCountByGenre,
        playCountByLanguage: this.profile.playCountByLanguage,
        languagePreferences: this.profile.languagePreferences,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch {}
  }

  // Check if this is an established user who has already played tracks
  isExistingUser(): boolean {
    const totalPlays = Object.values(this.profile.playCountByTrackId).reduce((a, b) => a + b, 0);
    return totalPlays >= 2 || this.profile.recentlyPlayedTrackIds.length >= 2;
  }

  // Event Tracking
  trackPlayStarted(track: Track) {
    if (!track) return;
    this.dynamicPool.set(track.id, track);
    this.profile.recentlyPlayedTrackIds = [
      track.id,
      ...this.profile.recentlyPlayedTrackIds.filter((id) => id !== track.id),
    ].slice(0, 50);

    this.profile.playCountByTrackId[track.id] = (this.profile.playCountByTrackId[track.id] || 0) + 1;
    if (track.artistId) {
      this.profile.playCountByArtistId[track.artistId] =
        (this.profile.playCountByArtistId[track.artistId] || 0) + 1;
    }
    if (track.genre) {
      this.profile.playCountByGenre[track.genre] =
        (this.profile.playCountByGenre[track.genre] || 0) + 1;
    }
    if (track.language) {
      this.profile.playCountByLanguage[track.language] =
        (this.profile.playCountByLanguage[track.language] || 0) + 1;
    }
    this.saveProfile();
  }

  trackPlayCompleted(track: Track) {
    if (!track) return;
    this.profile.playCountByTrackId[track.id] = (this.profile.playCountByTrackId[track.id] || 0) + 2;
    this.saveProfile();
  }

  trackSkipped(track: Track) {
    if (!track) return;
    this.profile.recentlySkippedTrackIds = [
      track.id,
      ...this.profile.recentlySkippedTrackIds.filter((id) => id !== track.id),
    ].slice(0, 30);
    this.saveProfile();
  }

  trackLiked(track: Track) {
    if (!track) return;
    this.profile.likedTrackIds.add(track.id);
    if (track.artistId) {
      this.profile.likedArtistIds.add(track.artistId);
    }
    this.saveProfile();
  }

  trackUnliked(track: Track) {
    if (!track) return;
    this.profile.likedTrackIds.delete(track.id);
    this.saveProfile();
  }

  setLanguagePreference(languages: MusicLanguage[]) {
    this.profile.languagePreferences = languages;
    this.saveProfile();
  }

  getProfile(): UserListeningProfile {
    return this.profile;
  }

  // Exact Scoring Algorithm
  scoreCandidate(
    candidate: Track,
    currentTrack: Track | null,
    queueTrackIds: Set<string>
  ): number {
    let score = 0;

    if (currentTrack) {
      // 1. Same Language is paramount for a cohesive listening session (+50)
      if (candidate.language && candidate.language === currentTrack.language) {
        score += 50;
      }

      // 2. Same Artist (+45)
      if (candidate.artistId && candidate.artistId === currentTrack.artistId) {
        score += 45;
      } else if (
        candidate.artistName &&
        currentTrack.artistName &&
        candidate.artistName.toLowerCase().includes(currentTrack.artistName.split(',')[0].toLowerCase().trim())
      ) {
        score += 35;
      }

      // 3. Same Genre / Vibe (+25)
      if (candidate.genre && candidate.genre === currentTrack.genre) {
        score += 25;
      }

      // 4. Diversify across movies: Avoid auto-queueing songs from the exact same movie/album
      if (
        (candidate.albumId && candidate.albumId === currentTrack.albumId) ||
        (candidate.albumTitle &&
          currentTrack.albumTitle &&
          candidate.albumTitle.toLowerCase().trim() ===
            currentTrack.albumTitle.toLowerCase().trim())
      ) {
        score -= 35;
      }
    }

    // User learned affinity:
    if (candidate.artistId && this.profile.likedArtistIds.has(candidate.artistId)) {
      score += 25;
    }

    if (this.profile.likedTrackIds.has(candidate.id)) {
      score += 25;
    }

    const playCount = this.profile.playCountByTrackId[candidate.id] || 0;
    if (playCount >= 5) {
      score += 20;
    } else if (playCount >= 2) {
      score += 10;
    }

    // Language preference affinity
    if (candidate.language) {
      const prefIdx = this.profile.languagePreferences.indexOf(candidate.language);
      if (prefIdx === 0) {
        score += 30; // Primary default language
      } else if (prefIdx > 0) {
        score += 15; // Secondary preferred language
      }
    }

    // Penalties:
    // Avoid immediate repeat
    if (this.profile.recentlyPlayedTrackIds.slice(0, 5).includes(candidate.id)) {
      score -= 50;
    }

    // Skipped songs
    if (this.profile.recentlySkippedTrackIds.slice(0, 10).includes(candidate.id)) {
      score -= 40;
    }

    // Already queued
    if (queueTrackIds.has(candidate.id)) {
      score -= 100;
    }

    return score;
  }

  // Pre-generate the next algorithmic queue
  generateNextQueue(
    currentTrack: Track | null,
    existingQueue: Track[] = [],
    count: number = 8,
    customAvailableTracks?: Track[]
  ): Track[] {
    const queueIds = new Set<string>(existingQueue.map((t) => t.id));
    if (currentTrack) queueIds.add(currentTrack.id);

    const allAvailableTracks = customAvailableTracks && customAvailableTracks.length > 0
      ? this.getAllTracks(customAvailableTracks)
      : this.getAllTracks();

    // Score all candidates
    const scoredCandidates = allAvailableTracks
      .map((track) => ({
        track,
        score: this.scoreCandidate(track, currentTrack, queueIds),
      }))
      .sort((a, b) => b.score - a.score);

    // Filter to top candidate tracks
    const topScored = scoredCandidates
      .filter((c) => !queueIds.has(c.track.id) && c.track.id !== currentTrack?.id)
      .slice(0, count)
      .map((c) => c.track);

    return topScored;
  }

  // Get the single best algorithmic next song when one song finishes
  getNextAlgorithmicTrack(
    currentTrack: Track,
    allAvailableTracks: Track[] = MOCK_TRACKS,
    excludeIds: Set<string> = new Set()
  ): Track | null {
    const scored = allAvailableTracks
      .filter((t) => t.id !== currentTrack.id && !excludeIds.has(t.id))
      .map((t) => ({ track: t, score: this.scoreCandidate(t, currentTrack, excludeIds) }))
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].track : null;
  }

  // Get Personalized "Made For You" Mix
  getMadeForYou(tracks: Track[] = MOCK_TRACKS, count: number = 8): Track[] {
    return this.generateNextQueue(null, [], count, tracks);
  }

  // Get Personalized "Your Vibe" Mix based on user's top played language & genre
  getYourVibe(tracks: Track[] = MOCK_TRACKS, count: number = 8): Track[] {
    const topLanguage = Object.entries(this.profile.playCountByLanguage)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Malayalam';

    const filtered = tracks.filter((t) => t.language === topLanguage);
    return filtered.length > 0 ? filtered.slice(0, count) : tracks.slice(0, count);
  }

  // Get Fresh Drops
  getFreshDrops(tracks: Track[] = MOCK_TRACKS, count: number = 8): Track[] {
    return [...tracks]
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, count);
  }

  // Get Recommended Artists
  getRecommendedArtists(count: number = 6) {
    return MOCK_ARTISTS.slice(0, count);
  }
}

export const recommendationEngine = new RecommendationEngine();
