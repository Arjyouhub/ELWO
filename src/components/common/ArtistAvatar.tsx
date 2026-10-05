import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Colors, Spacing, Typography, Shadows } from '../../constants/theme';
import { Artist } from '../../types/music';

interface ArtistAvatarProps {
  artist: Artist;
  onPress: () => void;
}

const ArtistAvatarComponent: React.FC<ArtistAvatarProps> = ({ artist, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {artist.name}
      </Text>
      <Text style={styles.role}>Artist</Text>
    </Pressable>
  );
};

export const ArtistAvatar = React.memo(ArtistAvatarComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 96,
    marginRight: Spacing.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    ...Shadows.subtle,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
    width: '100%',
  },
  role: {
    ...Typography.micro,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
});
