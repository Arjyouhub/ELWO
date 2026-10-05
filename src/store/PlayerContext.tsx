import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, PlayerState, RepeatMode } from '../types/music';
import { MOCK_TRACKS } from '../constants/mockData';
import { recommendationEngine } from '../services/recommendationEngine';
import { JioSaavnService } from '../services/jiosaavn';

const isExpoGo =
  Constants.appOwnership === AppOwnership.Expo ||
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const updateLockScreenControlsSafely = (player: AudioPlayer | null, track: Track) => {
  if (!player) return;
  // On Android in Expo Go, AudioControlsService cannot bind with native background service
  // which causes native jsLogger.error ("Failed to activate lockscreen controls").
  // Full lockscreen controls work in custom development or production builds.
  if (Platform.OS === 'android' && isExpoGo) {
    return;
  }

  setTimeout(() => {
    try {
      if (player && typeof player.setActiveForLockScreen === 'function') {
        player.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artistName,
          artworkUrl: track.artworkUrl,
          albumTitle: track.albumTitle,
        });
      }
    } catch {
      // Gracefully ignore if native lockscreen service is unavailable
    }
  }, 200);
};

interface PlayerContextType {
  state: PlayerState;
  recentlyPlayed: Track[];
  isFullPlayerVisible: boolean;
  setFullPlayerVisible: (visible: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleLikeCurrentTrack: () => void;
  addToQueue: (track: Track) => void;
  setVolume: (volume: number) => void;
  clearRecentlyPlayed: () => void;
  resetPlayerState: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted] = useState<boolean>(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [isFullPlayerVisible, setFullPlayerVisible] = useState<boolean>(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const volumeRef = useRef<number>(volume);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const isShuffleRef = useRef<boolean>(isShuffle);
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);
  const currentTrackRef = useRef<Track | null>(currentTrack);
  const positionRef = useRef<number>(position);
  const isTransitioningRef = useRef<boolean>(false);

  // Load saved music volume and recently played tracks on startup
  useEffect(() => {
    AsyncStorage.getItem('@elwo_music_volume')
      .then((saved) => {
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed)) {
            const clamped = Math.max(0, Math.min(1, parsed));
            setVolumeState(clamped);
            volumeRef.current = clamped;
            if (playerRef.current) {
              try {
                playerRef.current.volume = clamped;
              } catch {}
            }
          }
        }
      })
      .catch(() => {});

    // Load persisted recently played tracks
    AsyncStorage.getItem('@elwo_recently_played')
      .then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRecentlyPlayed(parsed);
              recommendationEngine.registerTracks(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (playerRef.current) {
      try {
        playerRef.current.volume = clamped;
      } catch {}
    }
    AsyncStorage.setItem('@elwo_music_volume', clamped.toString()).catch(() => {});
  }, []);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handle track finished event with Smart Auto-Next
  const handleTrackFinished = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Track completed in recommendation engine
    if (currentTrackRef.current) {
      recommendationEngine.trackPlayCompleted(currentTrackRef.current);
    }

    const currentMode = repeatModeRef.current;
    if (currentMode === 'one') {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
      isTransitioningRef.current = false;
      return;
    }

    let currentQueue = [...queueRef.current];
    const currentIndex = queueIndexRef.current;
    const shuffle = isShuffleRef.current;

    if (currentQueue.length === 0) {
      isTransitioningRef.current = false;
      return;
    }

    let nextIdx = currentIndex + 1;

    if (shuffle) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else if (nextIdx >= currentQueue.length) {
      if (currentMode === 'all') {
        nextIdx = 0;
      } else {
        // Smart Auto-Next: Pre-generate tailored upcoming tracks based on user taste
        const autoNextTracks = recommendationEngine.generateNextQueue(
          currentTrackRef.current,
          currentQueue,
          8
        );

        if (autoNextTracks.length > 0) {
          currentQueue = [...currentQueue, ...autoNextTracks];
          setQueue(currentQueue);
          queueRef.current = currentQueue;
          // nextIdx is now pointing to the first auto-next track!
        } else {
          setIsPlaying(false);
          setPosition(0);
          isTransitioningRef.current = false;
          return;
        }
      }
    }

    setQueueIndex(nextIdx);
    const nextSong = currentQueue[nextIdx];
    setCurrentTrack(nextSong);
    currentTrackRef.current = nextSong;
    setDuration(nextSong.duration);
    setPosition(0);
    setIsPlaying(true);
    setIsBuffering(true);

    recommendationEngine.trackPlayStarted(nextSong);

    (async () => {
      try {
        let stream = nextSong.streamUrl;
        if (!stream) {
          try {
            const live = await JioSaavnService.searchFullSongs(`${nextSong.title} ${nextSong.artistName}`, 1, 1);
            if (live[0]?.streamUrl) {
              stream = live[0].streamUrl;
              nextSong.streamUrl = stream;
            }
          } catch {}
        }

        if (playerRef.current && stream) {
          playerRef.current.replace(stream);
          playerRef.current.play();
          updateLockScreenControlsSafely(playerRef.current, nextSong);
        }
      } catch (e) {
        console.warn('Playback error during auto-advance:', e);
      } finally {
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 500);
      }
    })();
  }, []);

  // Initialize Audio Player and configure background audio mode
  useEffect(() => {
    try {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      }).catch(() => {});
    } catch {}

    try {
      const initialAudio = MOCK_TRACKS[0]?.streamUrl || null;
      const player = createAudioPlayer(initialAudio, {
        updateInterval: 500,
      });
      player.volume = volumeRef.current;
      playerRef.current = player;

      const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.duration && status.duration > 0) {
          setDuration(Math.round(status.duration));
        }
        if (status.currentTime !== undefined) {
          setPosition(Math.round(status.currentTime));
        }
        setIsPlaying(status.playing);
        setIsBuffering(status.isBuffering);

        if (status.didJustFinish) {
          handleTrackFinished();
        }
      });

      return () => {
        try {
          if (sub && typeof sub.remove === 'function') {
            sub.remove();
          }
          if (playerRef.current) {
            playerRef.current.pause();
            playerRef.current.remove();
            playerRef.current = null;
          }
        } catch {}
      };
    } catch (err) {
      console.warn('Could not initialize audio player:', err);
    }
  }, [handleTrackFinished]);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setDuration(track.duration);
    setPosition(0);
    setIsPlaying(true);
    setIsBuffering(true);

    // Track listening history & register track in recommendation pool
    recommendationEngine.trackPlayStarted(track);
    recommendationEngine.registerTracks([track, ...(newQueue || [])]);

    // Update persisted recently played list
    setRecentlyPlayed((prev) => {
      const updated = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 25);
      AsyncStorage.setItem('@elwo_recently_played', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      const index = queue.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        setQueueIndex(index);
      } else {
        const updated = [track, ...queue];
        setQueue(updated);
        setQueueIndex(0);
      }
    }

    // If playing a standalone track without a custom library queue, prepare algorithmic recommendations
    if (!newQueue && (!queue || queue.length <= 1)) {
      const moreTracks = recommendationEngine.generateNextQueue(track, [track], 8);
      if (moreTracks.length > 0) {
        setQueue([track, ...moreTracks]);
      }
    }

    // Asynchronously ensure live stream url and start playback
    (async () => {
      try {
        let stream = track.streamUrl;
        if (!stream) {
          try {
            const liveTracks = await JioSaavnService.searchFullSongs(`${track.title} ${track.artistName}`, 1, 1);
            if (liveTracks[0]?.streamUrl) {
              stream = liveTracks[0].streamUrl;
              track.streamUrl = stream;
            }
          } catch (fetchErr) {
            console.warn('Live stream lookup failed:', fetchErr);
          }
        }

        if (!playerRef.current && stream) {
          const player = createAudioPlayer(stream, {
            updateInterval: 500,
          });
          player.volume = volumeRef.current;
          playerRef.current = player;
          player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
            if (status.duration && status.duration > 0) {
              setDuration(Math.round(status.duration));
            }
            if (status.currentTime !== undefined) {
              setPosition(Math.round(status.currentTime));
            }
            setIsPlaying(status.playing);
            setIsBuffering(status.isBuffering);

            if (status.didJustFinish) {
              handleTrackFinished();
            }
          });
          player.play();
        } else if (playerRef.current && stream) {
          playerRef.current.replace(stream);
          playerRef.current.volume = volumeRef.current;
          playerRef.current.play();
        }

        if (playerRef.current && stream) {
          updateLockScreenControlsSafely(playerRef.current, track);
        }
      } catch (err) {
        console.warn('Playback error playing track:', err);
        setIsBuffering(false);
      }
    })();
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    try {
      if (!playerRef.current && currentTrack?.streamUrl) {
        playTrack(currentTrack);
        return;
      }
      if (playerRef.current) {
        if (isPlaying) {
          playerRef.current.pause();
          setIsPlaying(false);
        } else {
          playerRef.current.play();
          setIsPlaying(true);
        }
      } else {
        setIsPlaying((prev) => !prev);
      }
    } catch {
      setIsPlaying((prev) => !prev);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;

    // Detect track skip for recommendation engine learning
    if (currentTrack && position < duration * 0.7 && position > 2) {
      recommendationEngine.trackSkipped(currentTrack);
    }

    let nextIdx = queueIndex + 1;
    let currentQueue = [...queue];

    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else if (nextIdx >= currentQueue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        // Auto-next: Generate more tracks using recommendation engine
        const autoNextTracks = recommendationEngine.generateNextQueue(
          currentTrack,
          currentQueue,
          8
        );
        if (autoNextTracks.length > 0) {
          currentQueue = [...currentQueue, ...autoNextTracks];
          setQueue(currentQueue);
        } else {
          if (playerRef.current) playerRef.current.pause();
          setIsPlaying(false);
          return;
        }
      }
    }

    setQueueIndex(nextIdx);
    const nextSong = currentQueue[nextIdx];
    playTrack(nextSong, currentQueue);
  };

  const prevTrack = () => {
    if (position > 4) {
      seekTo(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    playTrack(prevSong, queue);
  };

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    setPosition(clamped);
    try {
      if (playerRef.current) {
        playerRef.current.seekTo(clamped);
      }
    } catch (err) {
      console.warn('Seek error:', err);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      if (playerRef.current) {
        playerRef.current.loop = next === 'one';
      }
      return next;
    });
  };

  const toggleLikeCurrentTrack = () => {
    if (!currentTrack) return;
    const willBeLiked = !currentTrack.isLiked;
    if (willBeLiked) {
      recommendationEngine.trackLiked(currentTrack);
    } else {
      recommendationEngine.trackUnliked(currentTrack);
    }

    setCurrentTrack((prev) => (prev ? { ...prev, isLiked: willBeLiked } : null));
    setQueue((prevQueue) =>
      prevQueue.map((t) => (t.id === currentTrack.id ? { ...t, isLiked: willBeLiked } : t))
    );
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
    AsyncStorage.removeItem('@elwo_recently_played').catch(() => {});
  }, []);

  const resetPlayerState = useCallback(() => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
    } catch {}
    setCurrentTrack(null);
    currentTrackRef.current = null;
    setIsPlaying(false);
    setPosition(0);
    positionRef.current = 0;
    setDuration(0);
    setQueue([]);
    queueRef.current = [];
    setQueueIndex(0);
    queueIndexRef.current = 0;
    setRecentlyPlayed([]);
    setFullPlayerVisible(false);
    AsyncStorage.removeItem('@elwo_recently_played').catch(() => {});
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        state: {
          currentTrack,
          isPlaying,
          position,
          duration,
          isBuffering,
          queue,
          queueIndex,
          isShuffle,
          repeatMode,
          volume,
          isMuted,
        },
        recentlyPlayed,
        isFullPlayerVisible,
        setFullPlayerVisible,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        toggleShuffle,
        cycleRepeatMode,
        toggleLikeCurrentTrack,
        addToQueue,
        setVolume,
        clearRecentlyPlayed,
        resetPlayerState,
      }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
