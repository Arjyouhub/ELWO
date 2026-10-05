import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Track } from '../../types/music';
import { usePlayer } from '../../store/PlayerContext';

interface MusicCardProps {
  track: Track;
  badge?: string;
  onPress?: () => void;
}

export const MusicCard: React.FC<MusicCardProps> = ({ track, badge, onPress }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width < 380 ? 132 : 144;
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
        styles.container,
        { width: cardWidth },
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
      ]}
      onPress={handlePress}>
      <View style={[styles.artworkContainer, { height: cardWidth, width: cardWidth }]}>
        <Image source={{ uri: track.artworkUrl }} style={styles.artwork} />

        {(badge || track.isNew) && (
          <View style={[styles.badge, (badge === 'NEW' || (!badge && track.isNew)) && styles.newBadge]}>
            <Text style={[styles.badgeText, (badge === 'NEW' || (!badge && track.isNew)) && styles.newBadgeText]}>
              {badge || 'NEW'}
            </Text>
          </View>
        )}

        <View style={[styles.playButton, isCurrent && styles.playButtonActive]}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={16}
            color={isCurrent ? '#060913' : '#FFFFFF'}
            style={!isPlaying ? { marginLeft: 2 } : undefined}
          />
        </View>
      </View>

      <Text numberOfLines={1} style={[styles.title, isCurrent && styles.titleActive]}>
        {track.title}
      </Text>
      <Text numberOfLines={1} style={styles.artist}>
        {track.artistName}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  artworkContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.cardHighlight,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(6, 9, 19, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.primary,
    letterSpacing: 0.4,
  },
  newBadge: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  playButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 6,
    lineHeight: 16,
  },
  titleActive: {
    color: Colors.dark.primary,
  },
  artist: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
