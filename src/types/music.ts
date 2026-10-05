export type MusicLanguage = 'Malayalam' | 'Tamil' | 'Hindi' | 'English' | 'All';

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  monthlyListeners?: number;
  genres: string[];
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumTitle?: string;
  artworkUrl: string;
  duration: number; // in seconds
  language: MusicLanguage;
  genre: string;
  releaseDate: string;
  streamUrl?: string; // audio source
  audioSource?: string;
  provider?: string;
  providerTrackId?: string;
  addedAt?: string;
  isNew?: boolean;
  isPublished?: boolean;
  providerId?: string;
  isLiked?: boolean;
  playsCount?: number;
  lyrics?: string;
  year?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artworkUrl: string;
  releaseDate: string;
  language: MusicLanguage;
  genre: string;
  tracks: Track[];
  trackCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  trackCount: number;
  creatorName: string;
  isUserCreated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenreCategory {
  id: string;
  name: string;
  gradientColors: [string, string];
  iconName?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number; // current playback position in seconds
  duration: number; // current track duration in seconds
  isBuffering: boolean;
  queue: Track[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number; // 0 to 1
  isMuted: boolean;
}
