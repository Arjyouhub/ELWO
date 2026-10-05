import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

interface CardItemProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
  onPressPlay?: () => void;
  isCurrentlyPlaying?: boolean;
}

const CardItemComponent: React.FC<CardItemProps> = ({
  title,
  subtitle,
  imageUrl,
  badge,
  size = 'medium',
  onPress,
  onPressPlay,
  isCurrentlyPlaying = false,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  const getCardDimensions = () => {
    const isSmallPhone = windowWidth < 380;
    switch (size) {
      case 'small':
        return { width: isSmallPhone ? 110 : 120, height: isSmallPhone ? 110 : 120 };
      case 'large':
        return { width: isSmallPhone ? 165 : 180, height: isSmallPhone ? 165 : 180 };
      case 'medium':
      default:
        return { width: isSmallPhone ? 138 : 150, height: isSmallPhone ? 138 : 150 };
    }
  };

  const dims = getCardDimensions();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width: dims.width },
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      <View style={[styles.imageContainer, { width: dims.width, height: dims.height }]}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {onPressPlay && (
          <Pressable
            style={[styles.playButton, isCurrentlyPlaying && styles.playingButton]}
            onPress={(e) => {
              e.stopPropagation();
              onPressPlay();
            }}
            hitSlop={6}>
            <Ionicons
              name={isCurrentlyPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: isCurrentlyPlaying ? 0 : 2 }}
            />
          </Pressable>
        )}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {subtitle}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    position: 'relative',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    ...Typography.micro,
    color: Colors.dark.primary,
  },
  playButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  playingButton: {
    backgroundColor: Colors.dark.secondary,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});

export const CardItem = React.memo(CardItemComponent);
