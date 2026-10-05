import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Artist } from '../../types/music';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const router = useRouter();

  const formatListeners = (num?: number) => {
    if (!num) return '1.2M';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return `${num}`;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
      onPress={() => router.push(`/artist/${artist.id}`)}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: artist.avatarUrl }} style={styles.avatar} />
      </View>
      <Text numberOfLines={1} style={styles.name}>
        {artist.name}
      </Text>
      <Text numberOfLines={1} style={styles.listeners}>
        {formatListeners(artist.monthlyListeners)} listeners
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 96,
    marginRight: 14,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: Colors.dark.surfaceElevated,
    marginBottom: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    width: '100%',
  },
  listeners: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
