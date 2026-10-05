import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist, Artist, Album } from '../types/music';
import { MOCK_TRACKS, MOCK_PLAYLISTS, MOCK_ARTISTS, MOCK_ALBUMS } from '../constants/mockData';
import { recommendationEngine } from '../services/recommendationEngine';

interface LibraryContextType {
  likedTracks: Track[];
  playlists: Playlist[];
  followedArtists: Artist[];
  savedAlbums: Album[];
  searchHistory: string[];
  isAddToPlaylistOpen: boolean;
  selectedTrackForPlaylist: Track | null;
  openAddToPlaylist: (track: Track) => void;
  closeAddToPlaylist: () => void;
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (title: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  addSearchQuery: (query: string) => void;
  removeSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;
  clearLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const PLAYLISTS_STORAGE_KEY = '@elwo_user_playlists';
const LIKED_TRACKS_STORAGE_KEY = '@elwo_liked_tracks_list';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [followedArtists] = useState<Artist[]>(MOCK_ARTISTS.slice(0, 3));
  const [savedAlbums] = useState<Album[]>(MOCK_ALBUMS);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'Aavesham',
    'Anirudh Ravichander',
    'Sushin Shyam',
  ]);

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  // Load saved playlists and liked tracks from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      try {
        const [savedPlaylists, savedLiked] = await Promise.all([
          AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY),
          AsyncStorage.getItem(LIKED_TRACKS_STORAGE_KEY),
        ]);

        if (savedPlaylists) {
          const parsed = JSON.parse(savedPlaylists);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPlaylists(parsed);
          }
        }

        if (savedLiked) {
          const parsedLiked = JSON.parse(savedLiked);
          if (Array.isArray(parsedLiked)) {
            setLikedTracks(parsedLiked);
          }
        }
      } catch (err) {
        console.warn('Error loading library data:', err);
      }
    })();
  }, []);

  const savePlaylistsToStorage = (updatedPlaylists: Playlist[]) => {
    AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(updatedPlaylists)).catch(() => {});
  };

  const saveLikedTracksToStorage = (updatedLiked: Track[]) => {
    AsyncStorage.setItem(LIKED_TRACKS_STORAGE_KEY, JSON.stringify(updatedLiked)).catch(() => {});
  };

  const isLiked = useCallback(
    (trackId: string) => likedTracks.some((t) => t.id === trackId),
    [likedTracks]
  );

  const toggleLike = useCallback((track: Track) => {
    setLikedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      let updated: Track[];
      if (exists) {
        updated = prev.filter((t) => t.id !== track.id);
        recommendationEngine.trackUnliked(track);
      } else {
        updated = [track, ...prev];
        recommendationEngine.trackLiked(track);
      }
      saveLikedTracksToStorage(updated);
      return updated;
    });

    // Also auto-sync to 'pl-liked' playlist
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id === 'pl-liked') {
          const inPlaylist = pl.tracks.some((t) => t.id === track.id);
          const nextTracks = inPlaylist
            ? pl.tracks.filter((t) => t.id !== track.id)
            : [track, ...pl.tracks];
          return {
            ...pl,
            tracks: nextTracks,
            trackCount: nextTracks.length,
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      });
      savePlaylistsToStorage(updated);
      return updated;
    });
  }, []);

  const createPlaylist = useCallback((title: string, description = '') => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      description,
      coverUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      tracks: [],
      trackCount: 0,
      creatorName: 'You',
      isUserCreated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlaylists((prev) => {
      const next = [newPlaylist, ...prev];
      savePlaylistsToStorage(next);
      return next;
    });
    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    if (playlistId === 'pl-liked') return; // Cannot delete Liked Songs playlist
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlistId);
      savePlaylistsToStorage(next);
      return next;
    });
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id === playlistId) {
          const exists = pl.tracks.some((t) => t.id === track.id);
          if (exists) return pl;
          return {
            ...pl,
            tracks: [track, ...pl.tracks],
            trackCount: pl.trackCount + 1,
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      });
      savePlaylistsToStorage(next);
      return next;
    });

    if (playlistId === 'pl-liked') {
      setLikedTracks((prev) => {
        if (prev.some((t) => t.id === track.id)) return prev;
        const updated = [track, ...prev];
        saveLikedTracksToStorage(updated);
        return updated;
      });
    }
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id === playlistId) {
          const nextTracks = pl.tracks.filter((t) => t.id !== trackId);
          return {
            ...pl,
            tracks: nextTracks,
            trackCount: nextTracks.length,
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      });
      savePlaylistsToStorage(next);
      return next;
    });

    if (playlistId === 'pl-liked') {
      setLikedTracks((prev) => {
        const updated = prev.filter((t) => t.id !== trackId);
        saveLikedTracksToStorage(updated);
        return updated;
      });
    }
  }, []);

  const isTrackInPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      const pl = playlists.find((p) => p.id === playlistId);
      return !!pl?.tracks.some((t) => t.id === trackId);
    },
    [playlists]
  );

  const openAddToPlaylist = useCallback((track: Track) => {
    setSelectedTrackForPlaylist(track);
    setIsAddToPlaylistOpen(true);
  }, []);

  const closeAddToPlaylist = useCallback(() => {
    setIsAddToPlaylistOpen(false);
    setSelectedTrackForPlaylist(null);
  }, []);

  const addSearchQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) =>
      [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10)
    );
  }, []);

  const removeSearchQuery = useCallback((query: string) => {
    setSearchHistory((prev) => prev.filter((q) => q !== query));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const clearLibrary = useCallback(() => {
    setLikedTracks([]);
    setPlaylists(MOCK_PLAYLISTS);
    setSearchHistory([]);
    AsyncStorage.multiRemove([PLAYLISTS_STORAGE_KEY, LIKED_TRACKS_STORAGE_KEY]).catch(() => {});
  }, []);

  return (
    <LibraryContext.Provider
      value={{
        likedTracks,
        playlists,
        followedArtists,
        savedAlbums,
        searchHistory,
        isAddToPlaylistOpen,
        selectedTrackForPlaylist,
        openAddToPlaylist,
        closeAddToPlaylist,
        isLiked,
        toggleLike,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        isTrackInPlaylist,
        addSearchQuery,
        removeSearchQuery,
        clearSearchHistory,
        clearLibrary,
      }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
