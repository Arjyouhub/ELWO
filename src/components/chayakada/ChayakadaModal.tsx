import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useChayakada } from '../../store/ChayakadaContext';
import { usePlayer } from '../../store/PlayerContext';
import {
  CHAYAKADA_SOUNDS,
  CHAYAKADA_PRESETS,
  CHAYAKADA_MENU,
  BUS_SOUNDS,
  BUS_PRESETS,
  BUS_TRIP_INFO,
  TRAIN_SOUNDS,
  TRAIN_PRESETS,
  TRAIN_TRIP_INFO,
  ChayakadaSound,
} from '../../constants/chayakadaData';

export const ChayakadaModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [showMenuBoard, setShowMenuBoard] = useState(false);

  const {
    isModalOpen,
    closeModal,
    isAmbientPlaying,
    activePresetId,
    soundVolumes,
    activeSounds,
    masterAmbientVolume,
    ambientTab,
    setAmbientTab,
    toggleSound,
    setSoundVolume,
    setMasterAmbientVolume,
    applyPreset,
    toggleMasterAmbient,
    stopAllAmbient,
    getActiveSoundsCount,
  } = useChayakada();

  const currentPresets =
    ambientTab === 'train'
      ? TRAIN_PRESETS
      : ambientTab === 'bus'
      ? BUS_PRESETS
      : CHAYAKADA_PRESETS;

  const currentSounds =
    ambientTab === 'train'
      ? TRAIN_SOUNDS
      : ambientTab === 'bus'
      ? BUS_SOUNDS
      : CHAYAKADA_SOUNDS;

  const { state: playerState, setVolume: setMusicVolume } = usePlayer();
  const isSongPlaying = playerState.isPlaying && !!playerState.currentTrack;

  const activeCount = getActiveSoundsCount();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 12
  );

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={closeModal}>
      <LinearGradient
        colors={['#0F172A', '#0B1020', '#060814']}
        style={[
          styles.container,
          {
            paddingTop: topInset,
            paddingBottom: 0,
          },
        ]}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={closeModal} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={24} color={Colors.dark.text} />
          </Pressable>

          <View style={styles.headerTitleGroup}>
            <Text numberOfLines={1} style={styles.headerMalayalam}>
              Ambience
            </Text>
          </View>

          <Pressable
            hitSlop={12}
            onPress={() => setShowMenuBoard(!showMenuBoard)}
            style={[styles.menuToggleBtn, showMenuBoard && styles.menuToggleBtnActive]}>
            <Ionicons
              name={
                ambientTab === 'train'
                  ? (showMenuBoard ? 'train' : 'train-outline')
                  : ambientTab === 'bus'
                  ? (showMenuBoard ? 'bus' : 'bus-outline')
                  : (showMenuBoard ? 'receipt' : 'receipt-outline')
              }
              size={18}
              color={showMenuBoard ? '#FFFFFF' : Colors.dark.accentViolet}
            />
          </Pressable>
        </View>

        {/* Ambient Category Selector Pills: Chayakada, Bus & Train */}
        <View style={styles.tabContainer}>
          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('chayakada')}
            style={[
              styles.tabBtn,
              ambientTab === 'chayakada' && styles.tabBtnActive,
            ]}>
            <Ionicons
              name="cafe"
              size={14}
              color={ambientTab === 'chayakada' ? '#FFFFFF' : Colors.dark.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabBtnText,
                ambientTab === 'chayakada' && styles.tabBtnTextActive,
              ]}>
              ചായക്കട
            </Text>
          </Pressable>

          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('bus')}
            style={[
              styles.tabBtn,
              ambientTab === 'bus' && styles.tabBtnActive,
            ]}>
            <Ionicons
              name="bus"
              size={14}
              color={ambientTab === 'bus' ? '#FFFFFF' : Colors.dark.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabBtnText,
                ambientTab === 'bus' && styles.tabBtnActive,
              ]}>
              ബസ് യാത്ര
            </Text>
          </Pressable>

          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('train')}
            style={[
              styles.tabBtn,
              ambientTab === 'train' && styles.tabBtnActive,
            ]}>
            <Ionicons
              name="train"
              size={14}
              color={ambientTab === 'train' ? '#FFFFFF' : Colors.dark.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabBtnText,
                ambientTab === 'train' && styles.tabBtnTextActive,
              ]}>
              ട്രെയിൻ
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Live Audio Blend Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusGlowDot,
                  isAmbientPlaying && styles.statusGlowDotActive,
                ]}
              />
              <View style={styles.statusTextWrapper}>
                <Text numberOfLines={1} style={styles.statusTitle}>
                  {isAmbientPlaying
                    ? `Ambience Active (${activeCount} sound${activeCount === 1 ? '' : 's'})`
                    : 'Ambience Paused'}
                </Text>
                {isSongPlaying ? (
                  <Text numberOfLines={1} style={styles.statusSubtitle}>
                    🎵 Blending with: {playerState.currentTrack?.title} — {playerState.currentTrack?.artistName}
                  </Text>
                ) : (
                  <Text numberOfLines={1} style={styles.statusSubtitle}>
                    Blend with your music anytime
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={toggleMasterAmbient}
              style={[
                styles.masterToggleBtn,
                isAmbientPlaying && styles.masterToggleBtnActive,
              ]}>
              <Ionicons
                name={isAmbientPlaying ? 'pause' : 'play'}
                size={16}
                color={isAmbientPlaying ? '#FFFFFF' : Colors.dark.primary}
              />
              <Text
                style={[
                  styles.masterToggleBtnText,
                  isAmbientPlaying && styles.masterToggleBtnTextActive,
                ]}>
                {isAmbientPlaying ? 'Pause' : 'Play'}
              </Text>
            </Pressable>
          </View>

          {/* Dual Independent Volume Controls: Music & Ambience */}
          <View style={styles.masterSliderCard}>
            {/* Music Software Gain Slider */}
            <View style={styles.masterSliderHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                <Ionicons name="musical-notes" size={16} color="#38BDF8" />
                <Text numberOfLines={1} style={[styles.masterSliderTitle, { color: '#38BDF8' }]}>
                  MUSIC
                </Text>
              </View>
              <Text style={styles.masterSliderPercent}>
                {Math.round((playerState.volume ?? 0.8) * 100)}%
              </Text>
            </View>

            <SliderBar
              value={playerState.volume ?? 0.8}
              onChange={setMusicVolume}
              activeColor="#38BDF8"
            />

            <View style={styles.sliderDivider} />

            {/* Ambience Independent Software Gain Slider */}
            <View style={styles.masterSliderHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                <Ionicons name="volume-high" size={16} color={Colors.dark.primary} />
                <Text numberOfLines={1} style={styles.masterSliderTitle}>
                  AMBIENCE
                </Text>
              </View>
              <Text style={styles.masterSliderPercent}>
                {Math.round(masterAmbientVolume * 100)}%
              </Text>
            </View>

            <SliderBar
              value={masterAmbientVolume}
              onChange={setMasterAmbientVolume}
              activeColor={Colors.dark.primary}
            />
          </View>

          {/* Mood Presets */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MOOD PRESETS</Text>
            <Text style={styles.sectionSubtitle}>Curated Soundscape Presets</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}>
            {currentPresets.map((preset) => {
              const isActive = activePresetId === preset.id && isAmbientPlaying;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => applyPreset(preset.id)}
                  style={[
                    styles.presetChip,
                    isActive && styles.presetChipActive,
                  ]}>
                  <Ionicons
                    name={preset.icon as any}
                    size={15}
                    color={isActive ? '#FFFFFF' : Colors.dark.accentViolet}
                  />
                  <View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.presetMalayalam,
                        isActive && styles.presetMalayalamActive,
                      ]}>
                      {preset.malayalam}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.presetEnglish,
                        isActive && styles.presetEnglishActive,
                      ]}>
                      {preset.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Optional Chalkboard Menu / Trip Info Board */}
          {showMenuBoard && (
            <View style={styles.menuBoard}>
              <View style={styles.menuBoardHeader}>
                <Text style={styles.menuBoardTitle}>
                  {ambientTab === 'train'
                    ? 'റെയിൽവേ യാത്രാ വിവരങ്ങൾ'
                    : ambientTab === 'bus'
                    ? 'കെ.എസ്.ആർ.ടി.സി യാത്രാ വിവരങ്ങൾ'
                    : 'ചായക്കട പലഹാരങ്ങൾ'}
                </Text>
                <Text style={styles.menuBoardSubtitle}>
                  {ambientTab === 'train'
                    ? 'Southern Railway • Kerala Express Line'
                    : ambientTab === 'bus'
                    ? 'Kerala State Road Transport Corporation (KSRTC)'
                    : 'Vintage Kerala Tea Stall Menu'}
                </Text>
              </View>

              <View style={styles.menuDivider} />

              {(ambientTab === 'train'
                ? TRAIN_TRIP_INFO
                : ambientTab === 'bus'
                ? BUS_TRIP_INFO
                : CHAYAKADA_MENU
              ).map((item, idx) => (
                <View key={idx} style={styles.menuItemRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.menuItemName}>
                      {item.item}
                    </Text>
                    <Text numberOfLines={1} style={styles.menuItemTag}>
                      {item.tag}
                    </Text>
                  </View>
                  <Text style={styles.menuItemPrice}>{item.price}</Text>
                </View>
              ))}

              <View style={styles.menuDivider} />
              <Text style={styles.menuFooter}>
                {ambientTab === 'train'
                  ? 'Window seat, chai & rhythmic rail cadence 🚆🌧️'
                  : ambientTab === 'bus'
                  ? 'Window seat, rain & ghat road breeze 🚌🌧️'
                  : 'Rain outside? Warm chai inside ☕🌧️'}
              </Text>
            </View>
          )}

          {/* Individual Sound Controls for the selected category */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.sectionTitle}>
                  {ambientTab === 'train' ? 'ട്രെയിൻ ശബ്ദങ്ങൾ' : ambientTab === 'bus' ? 'ബസ് യാത്ര ശബ്ദങ്ങൾ' : 'ചായക്കട ശബ്ദങ്ങൾ'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    currentSounds.forEach((s) => {
                      if (!activeSounds[s.id]) {
                        toggleSound(s.id);
                      }
                    });
                  }}>
                  <Text style={styles.enableAllText}>Enable All</Text>
                </Pressable>
                {isAmbientPlaying && (
                  <Pressable hitSlop={8} onPress={stopAllAmbient}>
                    <Text style={styles.muteAllText}>Mute All</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View style={styles.soundsList}>
            {currentSounds.map((sound) => {
              const isActive = !!activeSounds[sound.id] && isAmbientPlaying;
              const volume = soundVolumes[sound.id] ?? 0.5;

              return (
                <SoundRow
                  key={sound.id}
                  sound={sound}
                  isActive={isActive}
                  volume={volume}
                  onToggle={() => toggleSound(sound.id)}
                  onVolumeChange={(val) => setSoundVolume(sound.id, val)}
                />
              );
            })}
          </View>

          {/* Footer note */}
          <View style={styles.footerNote}>
            <Ionicons name="sparkles" size={14} color={Colors.dark.accentViolet} />
            <Text style={styles.footerNoteText}>
              Inspired by kattanchaya.in
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

// Individual sound card row
interface SoundRowProps {
  sound: ChayakadaSound;
  isActive: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (val: number) => void;
}

const SoundRow: React.FC<SoundRowProps> = ({
  sound,
  isActive,
  volume,
  onToggle,
  onVolumeChange,
}) => {
  return (
    <View style={[styles.soundCard, isActive && styles.soundCardActive]}>
      <Pressable onPress={onToggle} style={styles.soundCardHeader}>
        <View style={[styles.soundIconCircle, isActive && styles.soundIconCircleActive]}>
          <Ionicons
            name={sound.icon as any}
            size={18}
            color={isActive ? '#FFFFFF' : Colors.dark.accentViolet}
          />
        </View>

        <View style={styles.soundTextGroup}>
          <View style={styles.soundTitleRow}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.soundMalayalam, isActive && styles.soundMalayalamActive]}
            >
              {sound.malayalam}
            </Text>
            {!!sound.name && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.soundEnglish}
              >
                • {sound.name}
              </Text>
            )}
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.soundDesc}>
            {sound.description}
          </Text>
        </View>

        <View style={[styles.soundSwitch, isActive && styles.soundSwitchActive]}>
          <View style={[styles.soundSwitchThumb, isActive && styles.soundSwitchThumbActive]} />
        </View>
      </Pressable>

      {/* Volume slider for this sound */}
      <View style={styles.soundSliderRow}>
        <Ionicons
          name="volume-low"
          size={14}
          color={isActive ? Colors.dark.primary : Colors.dark.textMuted}
        />
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <SliderBar
            value={volume}
            onChange={onVolumeChange}
            activeColor={isActive ? Colors.dark.primary : 'rgba(139, 92, 246, 0.4)'}
          />
        </View>
        <Text style={[styles.soundVolText, isActive && styles.soundVolTextActive]}>
          {Math.round(volume * 100)}%
        </Text>
      </View>
    </View>
  );
};

// Custom interactive slider bar
interface SliderBarProps {
  value: number;
  onChange: (val: number) => void;
  activeColor?: string;
}

const SliderBar: React.FC<SliderBarProps> = ({
  value,
  onChange,
  activeColor = Colors.dark.primary,
}) => {
  const [trackWidth, setTrackWidth] = useState(200);

  const handlePress = (e: any) => {
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    onChange(ratio);
  };

  const percent = Math.round(value * 100);

  return (
    <Pressable
      onPress={handlePress}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={styles.sliderTrackTouch}>
      <View style={styles.sliderTrackBg}>
        <View
          style={[
            styles.sliderTrackFill,
            { width: `${percent}%`, backgroundColor: activeColor },
          ]}
        />
        <View
          style={[
            styles.sliderKnob,
            {
              left: `${Math.max(0, Math.min(percent, 96))}%`,
              borderColor: activeColor,
            },
          ]}
        />
      </View>
    </Pressable>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060814',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleGroup: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginHorizontal: 8,
  },
  headerMalayalam: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 0.3,
  },
  menuToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    flexShrink: 0,
  },
  menuToggleBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.2,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 20, 40, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 16,
    gap: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  statusGlowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#475569',
    flexShrink: 0,
  },
  statusGlowDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  statusTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  statusSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  masterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    flexShrink: 0,
  },
  masterToggleBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  masterToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
    letterSpacing: 0.3,
  },
  masterToggleBtnTextActive: {
    color: '#FFFFFF',
  },
  masterSliderCard: {
    backgroundColor: 'rgba(14, 20, 40, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.18)',
    marginBottom: 20,
  },
  masterSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  masterSliderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.dark.accentViolet,
    flexShrink: 1,
  },
  masterSliderPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  sliderHint: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    marginTop: 8,
  },
  sliderDivider: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    marginVertical: 14,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.dark.textMuted,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: 1,
  },
  muteAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presetsRow: {
    gap: 10,
    paddingBottom: 18,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(18, 24, 46, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  presetChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  presetMalayalam: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  presetMalayalamActive: {
    color: '#FFFFFF',
  },
  presetEnglish: {
    fontSize: 9,
    color: Colors.dark.textMuted,
  },
  presetEnglishActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuBoard: {
    backgroundColor: '#0A0F1E',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    marginBottom: 20,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  menuBoardHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  menuBoardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  menuBoardSubtitle: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    gap: 8,
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  menuItemTag: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
    flexShrink: 0,
  },
  menuFooter: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  soundsList: {
    gap: 12,
  },
  soundCard: {
    backgroundColor: 'rgba(14, 20, 40, 0.6)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.16)',
  },
  soundCardActive: {
    backgroundColor: 'rgba(20, 28, 54, 0.9)',
    borderColor: 'rgba(139, 92, 246, 0.45)',
  },
  soundCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  soundIconCircleActive: {
    backgroundColor: Colors.dark.primary,
  },
  soundTextGroup: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
    justifyContent: 'center',
  },
  soundTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    minWidth: 0,
    overflow: 'hidden',
  },
  soundMalayalam: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
    flexShrink: 1,
  },
  soundMalayalamActive: {
    color: '#FFFFFF',
  },
  soundEnglish: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    flexShrink: 2,
  },
  soundDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  soundSwitch: {
    width: 38,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 68, 0.9)',
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  soundSwitchActive: {
    backgroundColor: Colors.dark.primary,
  },
  soundSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#64748B',
  },
  soundSwitchThumbActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  soundSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  soundVolText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    width: 34,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  soundVolTextActive: {
    color: Colors.dark.accentViolet,
    fontWeight: '700',
  },
  sliderTrackTouch: {
    height: 28,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 41, 68, 0.8)',
    position: 'relative',
    overflow: 'visible',
  },
  sliderTrackFill: {
    height: 6,
    borderRadius: 3,
  },
  sliderKnob: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerNoteText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  enableAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
