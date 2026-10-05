import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { usePlayer } from '../../store/PlayerContext';
import { useLibrary } from '../../store/LibraryContext';
import { useChayakada } from '../../store/ChayakadaContext';
import { JioSaavnService } from '../../services/jiosaavn';

export const FullScreenPlayerModal: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [scrubberWidth, setScrubberWidth] = useState(0);

  const {
    state,
    isFullPlayerVisible,
    setFullPlayerVisible,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    toggleShuffle,
    cycleRepeatMode,
    playTrack,
  } = usePlayer();

  const { isLiked, toggleLike, openAddToPlaylist } = useLibrary();
  const { openModal: openChayakada, isAmbientPlaying, getActiveSoundsCount, ambientTab } = useChayakada();
  const [showQueueView, setShowQueueView] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAmbienceBox, setShowAmbienceBox] = useState(false);
  const [fetchedLyrics, setFetchedLyrics] = useState<{ id: string; text: string | null } | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    queue,
    queueIndex,
    isShuffle,
    repeatMode,
    isBuffering,
  } = state;

  useEffect(() => {
    let isCancelled = false;
    if (!showLyrics || !currentTrack?.id || currentTrack.lyrics) {
      return;
    }

    if (fetchedLyrics?.id === currentTrack.id) {
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingLyrics(true);
      JioSaavnService.getLyrics(currentTrack.id)
        .then((l) => {
          if (!isCancelled) {
            setFetchedLyrics({ id: currentTrack.id, text: l || 'No lyrics available for this track.' });
            setIsLoadingLyrics(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setFetchedLyrics({ id: currentTrack.id, text: 'No lyrics available for this track.' });
            setIsLoadingLyrics(false);
          }
        });
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [showLyrics, currentTrack?.id, currentTrack?.lyrics, fetchedLyrics?.id]);

  const lyricsText = currentTrack?.lyrics || (fetchedLyrics?.id === currentTrack?.id ? fetchedLyrics?.text : null);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSeekPress = (e: any) => {
    const touchX = e.nativeEvent.locationX;
    const barWidth = scrubberWidth > 0 ? scrubberWidth : Math.min(width, 540) - Spacing.xl * 2;
    const ratio = Math.max(0, Math.min(touchX / barWidth, 1));
    seekTo(ratio * duration);
  };

  const isShortScreen = height < 740;
  const isLandscape = width > height;
  const maxArtworkByWidth = Math.min(width - 68, 330);
  const maxArtworkByHeight = isLandscape ? height * 0.44 : height * (isShortScreen ? 0.31 : 0.36);
  const artworkSize = Math.max(160, Math.min(maxArtworkByWidth, maxArtworkByHeight));

  const playerTopInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16
  );

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => setFullPlayerVisible(false)}>
      <LinearGradient
        colors={['#0F1629', '#080C18', '#04060E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.modalContainer,
          {
            paddingTop: playerTopInset,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        {/* Subtle Ambient Radial Glow in Top Section */}
        <View style={styles.topAmbientHalo} pointerEvents="none" />

        <View style={styles.responsiveWrapper}>
          {/* Modern Top Header Bar */}
          <View style={styles.header}>
            <Pressable
              hitSlop={12}
              onPress={() => setFullPlayerVisible(false)}
              style={styles.headerGlassBtn}>
              <Ionicons name="chevron-down" size={24} color={Colors.dark.text} />
            </Pressable>

            <View style={styles.headerTextContainer}>
              <View style={styles.headerBadge}>
                <View style={styles.headerLiveDot} />
                <Text style={styles.headerSubtitle}>PLAYING FROM</Text>
              </View>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {currentTrack.albumTitle || 'Elwo Music Studio'}
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                hitSlop={10}
                onPress={() => {
                  setShowLyrics(!showLyrics);
                  if (!showLyrics) setShowQueueView(false);
                }}
                style={[
                  styles.headerGlassBtn,
                  showLyrics && styles.headerGlassBtnActive,
                ]}>
                <Ionicons
                  name={showLyrics ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                  size={19}
                  color={showLyrics ? '#FFFFFF' : Colors.dark.textSecondary}
                />
              </Pressable>

              <Pressable
                hitSlop={10}
                onPress={() => {
                  setShowQueueView(!showQueueView);
                  if (!showQueueView) setShowLyrics(false);
                }}
                style={[
                  styles.headerGlassBtn,
                  showQueueView && styles.headerGlassBtnActive,
                ]}>
                <Ionicons
                  name={showQueueView ? 'list' : 'list-outline'}
                  size={20}
                  color={showQueueView ? '#FFFFFF' : Colors.dark.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {showQueueView ? (
            /* Queue Drawer View */
            <View style={styles.queueContainer}>
              <View style={styles.queueHeaderRow}>
                <View>
                  <Text style={styles.queueHeader}>Up Next in Queue</Text>
                  <Text style={styles.queueSubheader}>
                    {queue.length} tracks • {isShuffle ? 'Shuffle Play' : 'Sequential'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowQueueView(false)}
                  style={styles.drawerCloseBtn}>
                  <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.queueList}
                showsVerticalScrollIndicator={false}>
                {queue.map((track, idx) => {
                  const isItemActive = idx === queueIndex;
                  return (
                    <Pressable
                      key={`${track.id}-${idx}`}
                      style={[
                        styles.queueItem,
                        isItemActive && styles.queueItemActive,
                      ]}
                      onPress={() => playTrack(track)}>
                      <Image
                        source={{ uri: track.artworkUrl }}
                        style={styles.queueThumb}
                      />
                      <View style={styles.queueText}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.queueItemTitle,
                            isItemActive && styles.queueItemTitleActive,
                          ]}>
                          {track.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.queueItemArtist}>
                          {track.artistName}
                        </Text>
                      </View>
                      {isItemActive && (
                        <View style={styles.nowPlayingIndicator}>
                          <Ionicons
                            name="volume-high"
                            size={18}
                            color={Colors.dark.secondary}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : showLyrics ? (
            /* Lyrics View */
            <View style={styles.lyricsContainer}>
              <View style={styles.lyricsHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lyricsTitle}>Lyrics</Text>
                  <Text numberOfLines={1} style={styles.lyricsTrackName}>
                    {currentTrack.title} — {currentTrack.artistName}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowLyrics(false)}
                  style={styles.drawerCloseBtn}>
                  <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
                </Pressable>
              </View>

              {isLoadingLyrics ? (
                <View style={styles.lyricsLoading}>
                  <ActivityIndicator size="large" color={Colors.dark.primary} />
                  <Text style={styles.lyricsLoadingText}>Fetching verified lyrics...</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.lyricsScrollView}
                  contentContainerStyle={styles.lyricsScrollContent}
                  showsVerticalScrollIndicator={false}>
                  <Text style={styles.lyricsBody}>
                    {lyricsText || 'No synchronized lyrics available for this track.'}
                  </Text>
                </ScrollView>
              )}

              {/* Quick Playback Bar at bottom of Lyrics */}
              <View style={styles.lyricsQuickControls}>
                <Pressable hitSlop={10} onPress={prevTrack} style={styles.skipGlassBtn}>
                  <Ionicons name="play-skip-back" size={22} color={Colors.dark.text} />
                </Pressable>
                <Pressable hitSlop={8} onPress={togglePlay} style={styles.lyricsPlayBtn}>
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1']}
                    style={styles.lyricsPlayGradient}>
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </Pressable>
                <Pressable hitSlop={10} onPress={nextTrack} style={styles.skipGlassBtn}>
                  <Ionicons name="play-skip-forward" size={22} color={Colors.dark.text} />
                </Pressable>
              </View>
            </View>
          ) : (
            /* Main Modern Player View */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.mainContentScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {/* Artwork Centerpiece with Ambient Backlight Glow */}
              <View style={styles.artworkContainer}>
                {/* Backlight Ambient Glow */}
                <View
                  style={[
                    styles.artworkAuraGlow,
                    {
                      width: artworkSize * 0.95,
                      height: artworkSize * 0.95,
                      borderRadius: artworkSize * 0.48,
                    },
                  ]}
                />

                {/* Floating Artwork Card */}
                <View
                  style={[
                    styles.artworkWrapper,
                    { width: artworkSize, height: artworkSize },
                  ]}>
                  <Image
                    source={{ uri: currentTrack.artworkUrl }}
                    style={styles.artwork}
                    resizeMode="cover"
                  />
                  {/* Subtle Top-Glass Highlight Sheen */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.18)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.35 }}
                    style={styles.artworkSheen}
                  />
                </View>
              </View>

              {/* Song Meta Information & Glass Like Button */}
              <View style={styles.metaRow}>
                <View style={styles.metaText}>
                  <Text numberOfLines={1} style={styles.trackTitle}>
                    {currentTrack.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.artistName}>
                    {currentTrack.artistName}
                  </Text>
                  {currentTrack.language && (
                    <View style={styles.tagRow}>
                      <View style={styles.languageTag}>
                        <Text style={styles.languageText}>{currentTrack.language}</Text>
                      </View>
                      {currentTrack.genre && (
                        <View style={styles.genreTag}>
                          <Text style={styles.genreText}>{currentTrack.genre}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    hitSlop={10}
                    onPress={() => currentTrack && openAddToPlaylist(currentTrack)}
                    style={styles.likeGlassBtn}>
                    <Ionicons
                      name="bookmark-outline"
                      size={20}
                      color={Colors.dark.textSecondary}
                    />
                  </Pressable>

                  <Pressable
                    hitSlop={12}
                    onPress={() => toggleLike(currentTrack)}
                    style={[
                      styles.likeGlassBtn,
                      liked && styles.likeGlassBtnActive,
                    ]}>
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={24}
                      color={liked ? Colors.dark.accentRose : Colors.dark.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Modern Scrubber Track */}
              <View
                style={styles.scrubberContainer}
                onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}>
                <Pressable onPress={handleSeekPress} style={styles.seekTouchArea}>
                  <View style={styles.seekBackground}>
                    <LinearGradient
                      colors={['#00D2FF', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.seekProgress, { width: `${progressPercent}%` }]}
                    />
                    <View
                      style={[
                        styles.seekKnob,
                        { left: `${Math.max(0, Math.min(progressPercent, 97.5))}%` },
                      ]}
                    />
                  </View>
                </Pressable>

                <View style={styles.timeLabels}>
                  <Text style={styles.timeText}>{formatDuration(position)}</Text>
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>
              </View>

              {/* Modern Controls Row */}
              <View style={styles.controlsRow}>
                <Pressable
                  hitSlop={10}
                  onPress={toggleShuffle}
                  style={[
                    styles.subControlGlassBtn,
                    isShuffle && styles.subControlGlassBtnActive,
                  ]}>
                  <Ionicons
                    name="shuffle"
                    size={22}
                    color={isShuffle ? Colors.dark.secondary : Colors.dark.textMuted}
                  />
                  {isShuffle && <View style={styles.activeDot} />}
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={prevTrack}
                  style={styles.skipGlassBtn}>
                  <Ionicons
                    name="play-skip-back"
                    size={28}
                    color={Colors.dark.text}
                  />
                </Pressable>

                {/* Main Glowing Play Button */}
                <Pressable
                  hitSlop={8}
                  onPress={togglePlay}
                  style={styles.mainPlayContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainPlayGradient}>
                    {isBuffering && isPlaying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={35}
                        color="#FFFFFF"
                        style={{ marginLeft: isPlaying ? 0 : 3 }}
                      />
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={nextTrack}
                  style={styles.skipGlassBtn}>
                  <Ionicons
                    name="play-skip-forward"
                    size={28}
                    color={Colors.dark.text}
                  />
                </Pressable>

                <Pressable
                  hitSlop={10}
                  onPress={cycleRepeatMode}
                  style={[
                    styles.subControlGlassBtn,
                    repeatMode !== 'off' && styles.subControlGlassBtnActive,
                  ]}>
                  <Ionicons
                    name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                    size={22}
                    color={
                      repeatMode !== 'off'
                        ? Colors.dark.secondary
                        : Colors.dark.textMuted
                    }
                  />
                  {repeatMode !== 'off' && <View style={styles.activeDot} />}
                  {repeatMode === 'one' && (
                    <View style={styles.repeatBadge}>
                      <Text style={styles.repeatBadgeText}>1</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Bottom Modern Dock: Ambience Pill & Drawer */}
              <View style={styles.dockContainer}>
                <Pressable
                  hitSlop={8}
                  onPress={() => setShowAmbienceBox((prev) => !prev)}
                  style={[
                    styles.ambienceDockPill,
                    (showAmbienceBox || isAmbientPlaying) && styles.ambienceDockPillActive,
                  ]}>
                  <Ionicons
                    name={ambientTab === 'train' ? 'train' : ambientTab === 'bus' ? 'bus' : 'headset'}
                    size={17}
                    color={(showAmbienceBox || isAmbientPlaying) ? '#FFFFFF' : Colors.dark.secondary}
                  />
                  <Text
                    style={[
                      styles.ambienceDockText,
                      (showAmbienceBox || isAmbientPlaying) && styles.ambienceDockTextActive,
                    ]}>
                    Kerala Ambience {isAmbientPlaying ? `• ${getActiveSoundsCount()} Active` : ''}
                  </Text>
                  <View
                    style={[
                      styles.livePulseDot,
                      isAmbientPlaying && styles.livePulseDotActive,
                    ]}
                  />
                </Pressable>
              </View>

              {/* Compact Ambience Soundscape Capsule */}
              {showAmbienceBox && (
                <Pressable
                  onPress={() => openChayakada()}
                  style={[
                    styles.ambienceMiniBar,
                    isAmbientPlaying && styles.ambienceMiniBarActive,
                  ]}>
                  <View style={styles.ambienceMiniLeft}>
                    <View
                      style={[
                        styles.ambienceMiniIconWrap,
                        isAmbientPlaying && styles.ambienceMiniIconWrapActive,
                      ]}>
                      <Ionicons
                        name={ambientTab === 'train' ? 'train' : ambientTab === 'bus' ? 'bus' : 'cafe'}
                        size={13}
                        color={isAmbientPlaying ? '#FFFFFF' : Colors.dark.secondary}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.ambienceMiniTitle,
                        isAmbientPlaying && styles.ambienceMiniTitleActive,
                      ]}>
                      {ambientTab === 'train'
                        ? 'Train Soundscape'
                        : ambientTab === 'bus'
                        ? 'Monsoon Bus'
                        : 'Kerala Chayakada'}
                    </Text>
                    {isAmbientPlaying && (
                      <View style={styles.ambienceMiniLiveBadge}>
                        <View style={styles.ambienceMiniLiveDot} />
                        <Text style={styles.ambienceMiniLiveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.ambienceMiniRight}>
                    <Text style={styles.ambienceMiniTuneText}>Tweak</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={isAmbientPlaying ? Colors.dark.secondary : Colors.dark.textMuted}
                    />
                  </View>
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  topAmbientHalo: {
    position: 'absolute',
    top: -60,
    left: '20%',
    width: '60%',
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  headerGlassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlassBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: '#A78BFA',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.dark.secondary,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 2,
  },
  mainContentScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    position: 'relative',
  },
  artworkAuraGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.28)',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 36,
    elevation: 20,
  },
  artworkWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#12182E',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  metaText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  trackTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
    marginTop: 3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  languageTag: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  languageText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.secondary,
  },
  genreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark.textMuted,
  },
  likeGlassBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeGlassBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  scrubberContainer: {
    marginTop: Spacing.sm,
  },
  seekTouchArea: {
    height: 28,
    justifyContent: 'center',
  },
  seekBackground: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  seekProgress: {
    height: '100%',
    borderRadius: 3,
  },
  seekKnob: {
    position: 'absolute',
    top: -5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FFFFFF',
    marginLeft: -7.5,
    shadowColor: Colors.dark.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.dark.textMuted,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  subControlGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  subControlGlassBtnActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  activeDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.secondary,
  },
  repeatBadge: {
    position: 'absolute',
    top: 5,
    right: 7,
    backgroundColor: Colors.dark.secondary,
    borderRadius: 5,
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#080C18',
  },
  skipGlassBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 12,
  },
  mainPlayGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  dockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  ambienceDockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  ambienceDockPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: '#C4B5FD',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  ambienceDockText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.2,
  },
  ambienceDockTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  livePulseDotActive: {
    backgroundColor: '#34D399',
  },
  ambienceMiniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 24, 46, 0.75)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  ambienceMiniBarActive: {
    backgroundColor: 'rgba(25, 34, 64, 0.9)',
    borderColor: 'rgba(139, 92, 246, 0.55)',
  },
  ambienceMiniLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  ambienceMiniIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambienceMiniIconWrapActive: {
    backgroundColor: Colors.dark.primary,
  },
  ambienceMiniTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    flexShrink: 1,
  },
  ambienceMiniTitleActive: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  ambienceMiniLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  ambienceMiniLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
  },
  ambienceMiniLiveText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  ambienceMiniRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ambienceMiniTuneText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontWeight: '500',
  },
  queueContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  queueHeader: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  queueSubheader: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueList: {
    flex: 1,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  queueItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  queueThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  queueText: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  queueItemTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  queueItemArtist: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  nowPlayingIndicator: {
    paddingRight: 6,
  },
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  lyricsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  lyricsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  lyricsTrackName: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  lyricsLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  lyricsLoadingText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  lyricsScrollView: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lyricsScrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  lyricsBody: {
    fontSize: 17,
    lineHeight: 30,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  lyricsQuickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
  },
  lyricsPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  lyricsPlayGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
