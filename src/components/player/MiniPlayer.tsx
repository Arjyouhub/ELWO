import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { usePlayer } from '../../store/PlayerContext';
import { useLibrary } from '../../store/LibraryContext';

export const MiniPlayer: React.FC = () => {
  const { state, togglePlay, nextTrack, setFullPlayerVisible } = usePlayer();
  const { isLiked, toggleLike } = useLibrary();

  const { currentTrack, isPlaying, position, duration } = state;

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const liked = isLiked(currentTrack.id);

  return (
    <Pressable
      style={styles.container}
      onPress={() => setFullPlayerVisible(true)}>
      {/* Top 2px Progress Line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        {/* Track Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} />
          {isPlaying && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
            </View>
          )}
        </View>

        {/* Title & Artist */}
        <View style={styles.metaContainer}>
          <Text numberOfLines={1} style={styles.title}>
            {currentTrack.title}
          </Text>
          <View style={styles.artistRow}>
            <Text numberOfLines={1} style={styles.artist}>
              {currentTrack.artistName}
            </Text>
            <View style={styles.hqBadge}>
              <Text style={styles.hqText}>HQ</Text>
            </View>
          </View>
        </View>

        {/* Controls Cluster */}
        <View style={styles.controlsCluster}>
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(currentTrack);
            }}
            style={styles.iconBtn}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? Colors.dark.accentRose : Colors.dark.textSecondary}
            />
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            style={styles.playBtn}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 1.5 } : undefined}
            />
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              nextTrack();
            }}
            style={styles.iconBtn}>
            <Ionicons name="play-skip-forward" size={17} color={Colors.dark.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1222',
    width: '94%',
    maxWidth: 620,
    alignSelf: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    overflow: 'hidden',
    ...Shadows.player,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  artworkContainer: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.dark.cardHighlight,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(6, 8, 20, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.primary,
  },
  metaContainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  artist: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    flexShrink: 1,
  },
  hqBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  hqText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  controlsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
});
