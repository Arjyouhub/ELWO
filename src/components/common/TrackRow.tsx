import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Track } from '../../types/music';
import { usePlayer } from '../../store/PlayerContext';
import { useLibrary } from '../../store/LibraryContext';

interface TrackRowProps {
  track: Track;
  index?: number;
  showIndex?: boolean;
  onPressMore?: () => void;
  onPress?: () => void;
}

const TrackRowComponent: React.FC<TrackRowProps> = ({
  track,
  index,
  showIndex = false,
  onPressMore,
  onPress,
}) => {
  const { state, playTrack, togglePlay } = usePlayer();
  const { isLiked, toggleLike, openAddToPlaylist } = useLibrary();

  const isCurrent = state.currentTrack?.id === track.id;
  const isPlaying = isCurrent && state.isPlaying;
  const liked = isLiked(track.id);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handlePress = () => {
    if (isCurrent) {
      togglePlay();
    } else if (onPress) {
      onPress();
    } else {
      playTrack(track);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isCurrent && styles.activeContainer,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}>
      {showIndex && (
        <Text style={[styles.indexText, isCurrent && styles.activeIndexText]}>
          {index !== undefined ? index + 1 : ''}
        </Text>
      )}

      <View style={styles.imageContainer}>
        <Image source={{ uri: track.artworkUrl }} style={styles.artwork} />
        {isCurrent && (
          <View style={styles.playingOverlay}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color={Colors.dark.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          style={[styles.title, isCurrent && styles.activeTitle]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {track.artistName}
          {track.language ? ` • ${track.language}` : ''}
        </Text>
      </View>

      <View style={styles.rightActions}>
        <Pressable
          hitSlop={8}
          onPress={() => toggleLike(track)}
          style={styles.actionBtn}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? Colors.dark.accentRose : Colors.dark.textSecondary}
          />
        </Pressable>

        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>

        <Pressable
          hitSlop={8}
          onPress={onPressMore || (() => openAddToPlaylist(track))}
          style={styles.actionBtn}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={Colors.dark.textSecondary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginHorizontal: Spacing.sm,
    borderRadius: 12,
  },
  activeContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  indexText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textMuted,
    width: 22,
    textAlign: 'center',
    marginRight: Spacing.xs,
    fontSize: 13,
  },
  activeIndexText: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
  },
  activeTitle: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  artist: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  actionBtn: {
    padding: 4,
  },
  duration: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    fontSize: 11,
    minWidth: 32,
    textAlign: 'right',
  },
});

export const TrackRow = React.memo(TrackRowComponent);
