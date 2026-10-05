import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CHAYAKADA_SOUNDS,
  CHAYAKADA_PRESETS,
  BUS_SOUNDS,
  BUS_PRESETS,
  TRAIN_SOUNDS,
  TRAIN_PRESETS,
  ALL_AMBIENT_SOUNDS,
  ALL_AMBIENT_PRESETS,
} from '../constants/chayakadaData';

export type AmbientCategory = 'chayakada' | 'bus' | 'train';

export const CHAYAKADA_SOUND_IDS = new Set(CHAYAKADA_SOUNDS.map((s) => s.id));
export const BUS_SOUND_IDS = new Set(BUS_SOUNDS.map((s) => s.id));
export const TRAIN_SOUND_IDS = new Set(TRAIN_SOUNDS.map((s) => s.id));

export const getSoundCategory = (soundId: string): AmbientCategory => {
  if (TRAIN_SOUND_IDS.has(soundId)) return 'train';
  if (BUS_SOUND_IDS.has(soundId)) return 'bus';
  return 'chayakada';
};

interface ChayakadaContextType {
  isBannerVisible: boolean;
  setIsBannerVisible: (visible: boolean) => void;
  toggleBanner: () => void;
  isModalOpen: boolean;
  openModal: (initialTab?: AmbientCategory) => void;
  closeModal: () => void;
  isAmbientPlaying: boolean;
  activePresetId: string | null;
  soundVolumes: Record<string, number>;
  activeSounds: Record<string, boolean>;
  masterAmbientVolume: number;
  hasMalayalam: boolean;
  ambientTab: AmbientCategory;
  setAmbientTab: (tab: AmbientCategory) => void;
  refreshLanguagePreference: () => Promise<void>;
  toggleSound: (soundId: string) => void;
  setSoundVolume: (soundId: string, volume: number) => void;
  setMasterAmbientVolume: (volume: number) => void;
  applyPreset: (presetId: string) => void;
  toggleMasterAmbient: () => void;
  stopAllAmbient: () => void;
  getActiveSoundsCount: () => number;
}

const STORAGE_KEY = '@chayakada_soundscape_settings';

const ChayakadaContext = createContext<ChayakadaContextType | undefined>(undefined);

export const ChayakadaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [ambientTab, setAmbientTabState] = useState<AmbientCategory>('chayakada');
  const [activePresetId, setActivePresetId] = useState<string | null>('rainy-evening');
  const [masterAmbientVolume, setMasterAmbientVolumeState] = useState<number>(0.3);
  const [hasMalayalam, setHasMalayalam] = useState<boolean>(true);

  // Initial sound volumes matching 'rainy-evening'
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>(() => {
    const defaultPreset = CHAYAKADA_PRESETS[0];
    const initial: Record<string, number> = {};
    ALL_AMBIENT_SOUNDS.forEach((s) => {
      initial[s.id] = defaultPreset.volumes[s.id] ?? (s.defaultVolume * 0.8);
    });
    return initial;
  });

  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>(() => {
    const defaultPreset = CHAYAKADA_PRESETS[0];
    const initial: Record<string, boolean> = {};
    ALL_AMBIENT_SOUNDS.forEach((s) => {
      // By default only chayakada sounds are active
      if (CHAYAKADA_SOUND_IDS.has(s.id)) {
        initial[s.id] = (defaultPreset.volumes[s.id] ?? 0) > 0;
      } else {
        initial[s.id] = false;
      }
    });
    return initial;
  });

  // Reference holding the native AudioPlayer instances
  const playersRef = useRef<Map<string, AudioPlayer>>(new Map());
  const activeSoundsRef = useRef(activeSounds);
  const soundVolumesRef = useRef(soundVolumes);
  const masterAmbientVolumeRef = useRef(masterAmbientVolume);
  const isAmbientPlayingRef = useRef(isAmbientPlaying);
  const ambientTabRef = useRef<AmbientCategory>(ambientTab);

  useEffect(() => {
    ambientTabRef.current = ambientTab;
  }, [ambientTab]);

  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

  useEffect(() => {
    soundVolumesRef.current = soundVolumes;
  }, [soundVolumes]);

  useEffect(() => {
    masterAmbientVolumeRef.current = masterAmbientVolume;
  }, [masterAmbientVolume]);

  useEffect(() => {
    isAmbientPlayingRef.current = isAmbientPlaying;
  }, [isAmbientPlaying]);

  const refreshLanguagePreference = useCallback(async () => {
    try {
      const [langs, defLang, onboarded] = await Promise.all([
        AsyncStorage.getItem('@elwo_languages'),
        AsyncStorage.getItem('@elwo_default_language'),
        AsyncStorage.getItem('@elwo_language_onboarded'),
      ]);

      let isMalayalam = false;
      if (langs) {
        try {
          const parsed = JSON.parse(langs);
          if (Array.isArray(parsed) && parsed.includes('Malayalam')) {
            isMalayalam = true;
          }
        } catch {}
      }
      if (defLang === 'Malayalam') {
        isMalayalam = true;
      }

      if (onboarded) {
        setHasMalayalam(isMalayalam);
      } else {
        setHasMalayalam(false);
      }
    } catch {
      setHasMalayalam(false);
    }
  }, []);

  // Load saved preferences and language status on start
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [saved, langs, defLang, onboarded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem('@elwo_languages'),
          AsyncStorage.getItem('@elwo_default_language'),
          AsyncStorage.getItem('@elwo_language_onboarded'),
        ]);

        if (!isMounted) return;

        if (saved) {
          const parsed = JSON.parse(saved);
          const validIds = new Set(ALL_AMBIENT_SOUNDS.map((s) => s.id));
          if (parsed.volumes) {
            const cleanVolumes: Record<string, number> = {};
            Object.keys(parsed.volumes).forEach((k) => {
              if (validIds.has(k)) {
                cleanVolumes[k] = parsed.volumes[k];
              }
            });
            setSoundVolumes((prev) => ({ ...prev, ...cleanVolumes }));
          }
          if (parsed.activeSounds) {
            const cleanActives: Record<string, boolean> = {};
            Object.keys(parsed.activeSounds).forEach((k) => {
              if (validIds.has(k)) {
                cleanActives[k] = parsed.activeSounds[k];
              }
            });
            setActiveSounds((prev) => ({ ...prev, ...cleanActives }));
          }
          if (parsed.masterVolume !== undefined) setMasterAmbientVolumeState(parsed.masterVolume);
          if (parsed.activePresetId) setActivePresetId(parsed.activePresetId);
        }

        let isMalayalam = false;
        if (langs) {
          try {
            const parsed = JSON.parse(langs);
            if (Array.isArray(parsed) && parsed.includes('Malayalam')) {
              isMalayalam = true;
            }
          } catch {}
        }
        if (defLang === 'Malayalam') {
          isMalayalam = true;
        }

        if (onboarded) {
          setHasMalayalam(isMalayalam);
        } else {
          setHasMalayalam(false);
        }
      } catch (err) {
        console.warn('Failed to load Chayakada settings:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist preferences
  const savePreferences = useCallback(
    async (
      volumes: Record<string, number>,
      actives: Record<string, boolean>,
      masterVol: number,
      presetId: string | null
    ) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            volumes,
            activeSounds: actives,
            masterVolume: masterVol,
            activePresetId: presetId,
          })
        );
      } catch (err) {
        console.warn('Failed to save Chayakada settings:', err);
      }
    },
    []
  );

  // Helper to get or create an AudioPlayer for a sound
  const getOrCreatePlayer = useCallback((soundId: string): AudioPlayer | null => {
    let player = playersRef.current.get(soundId);
    if (!player) {
      const soundDef = ALL_AMBIENT_SOUNDS.find((s) => s.id === soundId);
      if (!soundDef) return null;

      try {
        player = createAudioPlayer(soundDef.url, {
          updateInterval: 1000,
          keepAudioSessionActive: true,
        });
        player.loop = true;
        playersRef.current.set(soundId, player);
      } catch (e) {
        console.warn(`Failed to initialize audio player for ${soundId}:`, e);
        return null;
      }
    }
    return player;
  }, []);

  // Update physical player states based on current settings
  const syncPlayback = useCallback(() => {
    const isMasterOn = isAmbientPlayingRef.current;
    const currentActive = activeSoundsRef.current;
    const currentVolumes = soundVolumesRef.current;
    const masterVol = masterAmbientVolumeRef.current;
    const currentTab = ambientTabRef.current;

    const validIds = new Set(ALL_AMBIENT_SOUNDS.map((s) => s.id));
    playersRef.current.forEach((player, id) => {
      if (!validIds.has(id)) {
        try {
          if (player.playing) player.pause();
          player.remove();
        } catch {}
        playersRef.current.delete(id);
      }
    });

    ALL_AMBIENT_SOUNDS.forEach((sound) => {
      const soundCat = getSoundCategory(sound.id);
      // STRICT CATEGORY ISOLATION:
      // Only sounds belonging to the currently active category (Chayakada, Bus, or Train) can play!
      // All other categories are paused!
      const isSoundActive = isMasterOn && soundCat === currentTab && !!currentActive[sound.id];
      const targetVol = Math.max(0, Math.min(1, (currentVolumes[sound.id] ?? 0.5) * masterVol));

      if (isSoundActive && targetVol > 0.01) {
        const player = getOrCreatePlayer(sound.id);
        if (player) {
          try {
            player.volume = targetVol;
            player.loop = true;
            if (!player.playing) {
              player.play();
            }
          } catch (e) {
            console.warn(`Error playing sound ${sound.id}:`, e);
          }
        }
      } else {
        const existingPlayer = playersRef.current.get(sound.id);
        if (existingPlayer) {
          try {
            if (existingPlayer.playing) {
              existingPlayer.pause();
            }
          } catch (e) {
            console.warn(`Error pausing sound ${sound.id}:`, e);
          }
        }
      }
    });
  }, [getOrCreatePlayer]);

  // Clean up on component unmount
  useEffect(() => {
    const players = playersRef.current;
    return () => {
      players.forEach((player) => {
        try {
          player.pause();
          player.remove();
        } catch {}
      });
      players.clear();
    };
  }, []);

  const toggleBanner = useCallback(() => {
    setIsBannerVisible((prev) => !prev);
  }, []);

  const openModal = useCallback((initialTab?: AmbientCategory) => {
    if (initialTab) {
      setAmbientTabState(initialTab);
      ambientTabRef.current = initialTab;
    }
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const setAmbientTab = useCallback(
    (newTab: AmbientCategory) => {
      setAmbientTabState(newTab);
      ambientTabRef.current = newTab;

      // Pause all audio players of other categories immediately
      playersRef.current.forEach((player, id) => {
        if (getSoundCategory(id) !== newTab) {
          try {
            if (player.playing) player.pause();
          } catch {}
        }
      });

      const targetSoundIds =
        newTab === 'train' ? TRAIN_SOUND_IDS : newTab === 'bus' ? BUS_SOUND_IDS : CHAYAKADA_SOUND_IDS;
      const targetPresets =
        newTab === 'train' ? TRAIN_PRESETS : newTab === 'bus' ? BUS_PRESETS : CHAYAKADA_PRESETS;

      setActiveSounds((prev) => {
        const updated = { ...prev };
        // Deactivate all sounds that don't belong to the newly selected category
        ALL_AMBIENT_SOUNDS.forEach((s) => {
          if (!targetSoundIds.has(s.id)) {
            updated[s.id] = false;
          }
        });

        // Check if there are active sounds in the new category
        const hasActiveInTarget = Object.entries(updated).some(([id, act]) => act && targetSoundIds.has(id));
        if (!hasActiveInTarget) {
          // Activate the default preset for this category
          const defaultPreset = targetPresets[0];
          Object.entries(defaultPreset.volumes).forEach(([id, vol]) => {
            if (vol > 0) updated[id] = true;
          });
          setActivePresetId(defaultPreset.id);
        } else {
          // If active preset doesn't match new category, switch to default preset
          const matchingPreset = targetPresets.find((p) => p.id === activePresetId);
          if (!matchingPreset) {
            setActivePresetId(targetPresets[0].id);
          }
        }

        savePreferences(soundVolumesRef.current, updated, masterAmbientVolumeRef.current, activePresetId);
        setTimeout(syncPlayback, 50);
        return updated;
      });
    },
    [activePresetId, savePreferences, syncPlayback]
  );

  const toggleSound = useCallback(
    (soundId: string) => {
      const soundCat = getSoundCategory(soundId);
      if (ambientTabRef.current !== soundCat) {
        setAmbientTabState(soundCat);
        ambientTabRef.current = soundCat;
      }

      setActiveSounds((prev) => {
        const nextState = !prev[soundId];
        const updated = { ...prev, [soundId]: nextState };

        // Ensure sounds from other categories are turned off
        ALL_AMBIENT_SOUNDS.forEach((s) => {
          if (getSoundCategory(s.id) !== soundCat) {
            updated[s.id] = false;
          }
        });

        // If toggling a sound on and master ambient is off, turn master ambient on!
        if (nextState && !isAmbientPlayingRef.current) {
          setIsAmbientPlaying(true);
          isAmbientPlayingRef.current = true;
        }

        setActivePresetId(null); // customized
        savePreferences(soundVolumesRef.current, updated, masterAmbientVolumeRef.current, null);
        setTimeout(syncPlayback, 50);
        return updated;
      });
    },
    [savePreferences, syncPlayback]
  );

  const setSoundVolume = useCallback(
    (soundId: string, volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      setSoundVolumes((prev) => {
        const updated = { ...prev, [soundId]: clamped };
        const player = playersRef.current.get(soundId);
        if (player && isAmbientPlayingRef.current && activeSoundsRef.current[soundId]) {
          try {
            player.volume = clamped * masterAmbientVolumeRef.current;
          } catch {}
        }
        savePreferences(updated, activeSoundsRef.current, masterAmbientVolumeRef.current, activePresetId);
        return updated;
      });
    },
    [activePresetId, savePreferences]
  );

  const setMasterAmbientVolume = useCallback(
    (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      setMasterAmbientVolumeState(clamped);
      masterAmbientVolumeRef.current = clamped;

      // Update volume on all currently playing players immediately
      playersRef.current.forEach((player, id) => {
        if (player && activeSoundsRef.current[id] && isAmbientPlayingRef.current) {
          try {
            player.volume = (soundVolumesRef.current[id] ?? 0.5) * clamped;
          } catch {}
        }
      });

      savePreferences(soundVolumesRef.current, activeSoundsRef.current, clamped, activePresetId);
    },
    [activePresetId, savePreferences]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = ALL_AMBIENT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      const newVolumes = { ...soundVolumesRef.current };
      const newActives = { ...activeSoundsRef.current };

      const isTrainPreset = TRAIN_PRESETS.some((tp) => tp.id === presetId);
      const isBusPreset = BUS_PRESETS.some((bp) => bp.id === presetId);
      const targetCategory: AmbientCategory = isTrainPreset ? 'train' : isBusPreset ? 'bus' : 'chayakada';
      const targetSounds = isTrainPreset ? TRAIN_SOUNDS : isBusPreset ? BUS_SOUNDS : CHAYAKADA_SOUNDS;
      const targetSoundIds = isTrainPreset ? TRAIN_SOUND_IDS : isBusPreset ? BUS_SOUND_IDS : CHAYAKADA_SOUND_IDS;

      // Switch ambient tab to the preset's category!
      setAmbientTabState(targetCategory);
      ambientTabRef.current = targetCategory;

      // Turn OFF all sounds from all other categories!
      ALL_AMBIENT_SOUNDS.forEach((s) => {
        if (!targetSoundIds.has(s.id)) {
          newActives[s.id] = false;
        }
      });

      // Pause any player not in the target category immediately
      playersRef.current.forEach((player, id) => {
        if (!targetSoundIds.has(id)) {
          try {
            if (player.playing) player.pause();
          } catch {}
        }
      });

      // Activate preset sounds
      targetSounds.forEach((s) => {
        const presetVol = preset.volumes[s.id] ?? 0;
        if (presetVol > 0) {
          newVolumes[s.id] = presetVol;
          newActives[s.id] = true;
        } else {
          newActives[s.id] = false;
        }
      });

      setSoundVolumes(newVolumes);
      setActiveSounds(newActives);
      setActivePresetId(presetId);
      setIsAmbientPlaying(true);
      isAmbientPlayingRef.current = true;

      savePreferences(newVolumes, newActives, masterAmbientVolumeRef.current, presetId);
      setTimeout(syncPlayback, 50);
    },
    [savePreferences, syncPlayback]
  );

  const toggleMasterAmbient = useCallback(() => {
    setIsAmbientPlaying((prev) => {
      const next = !prev;
      isAmbientPlayingRef.current = next;

      // If turning on and no sounds are active in current category, enable the default preset!
      if (next) {
        const currentTab = ambientTabRef.current;
        const targetSoundIds =
          currentTab === 'train' ? TRAIN_SOUND_IDS : currentTab === 'bus' ? BUS_SOUND_IDS : CHAYAKADA_SOUND_IDS;
        const anyActiveInCat = Object.entries(activeSoundsRef.current).some(
          ([id, act]) => act && targetSoundIds.has(id)
        );

        if (!anyActiveInCat) {
          const defaultPresetId =
            currentTab === 'train'
              ? 'konkan-monsoon'
              : currentTab === 'bus'
              ? 'ksrtc-rainy-journey'
              : 'rainy-evening';
          applyPreset(defaultPresetId);
          return true;
        }
      }

      setTimeout(syncPlayback, 50);
      return next;
    });
  }, [applyPreset, syncPlayback]);

  const stopAllAmbient = useCallback(() => {
    setIsAmbientPlaying(false);
    isAmbientPlayingRef.current = false;
    playersRef.current.forEach((player) => {
      try {
        if (player.playing) player.pause();
      } catch {}
    });
  }, []);

  const getActiveSoundsCount = useCallback(() => {
    if (!isAmbientPlaying) return 0;
    const currentTab = ambientTabRef.current;
    const targetSoundIds =
      currentTab === 'train' ? TRAIN_SOUND_IDS : currentTab === 'bus' ? BUS_SOUND_IDS : CHAYAKADA_SOUND_IDS;

    return Object.entries(activeSounds).filter(
      ([id, active]) => active && targetSoundIds.has(id) && (soundVolumes[id] ?? 0) > 0.05
    ).length;
  }, [isAmbientPlaying, activeSounds, soundVolumes]);

  return (
    <ChayakadaContext.Provider
      value={{
        isBannerVisible,
        setIsBannerVisible,
        toggleBanner,
        isModalOpen,
        openModal,
        closeModal,
        isAmbientPlaying,
        activePresetId,
        soundVolumes,
        activeSounds,
        masterAmbientVolume,
        hasMalayalam,
        ambientTab,
        setAmbientTab,
        refreshLanguagePreference,
        toggleSound,
        setSoundVolume,
        setMasterAmbientVolume,
        applyPreset,
        toggleMasterAmbient,
        stopAllAmbient,
        getActiveSoundsCount,
      }}>
      {children}
    </ChayakadaContext.Provider>
  );
};

export const useChayakada = (): ChayakadaContextType => {
  const context = useContext(ChayakadaContext);
  if (!context) {
    throw new Error('useChayakada must be used within a ChayakadaProvider');
  }
  return context;
};

export const useAmbience = useChayakada;
