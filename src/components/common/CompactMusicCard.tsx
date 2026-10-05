import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Track } from '../../types/music';
import { usePlayer } from '../../store/PlayerContext';

interface CompactMusicCardProps {
  track: Track;
  onPress?: () => void;
}

export const CompactMusicCard: React.FC<CompactMusicCardProps> = ({ track, onPress }) => {
  const { state, playTrack, togglePlay } = usePlayer();
  const isCurrent = state.currentTrack?.id === track.id;
  const isPlaying = isCurrent && state.isPlaying;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isCurrent && styles.cardActive,
        pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handlePress}>
      <Image source={{ uri: track.artworkUrl }} style={styles.artwork} />

      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, isCurrent && styles.titleActive]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {track.artistName}
        </Text>
      </View>

      <View style={[styles.playBadge, isCurrent && styles.playBadgeActive]}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={12}
          color={isCurrent ? '#FFFFFF' : Colors.dark.textSecondary}
          style={!isPlaying ? { marginLeft: 1 } : undefined}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 210,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginRight: 10,
  },
  cardActive: {
    borderColor: 'rgba(139, 92, 246, 0.45)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardHighlight,
  },
  info: {
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  titleActive: {
    color: Colors.dark.primary,
  },
  artist: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  playBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadgeActive: {
    backgroundColor: Colors.dark.primary,
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
});
