import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePlayer } from '../../src/store/PlayerContext';
import { TrackRow } from '../../src/components/common/TrackRow';
import { MOCK_TRACKS } from '../../src/constants/mockData';

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playlists, likedTracks } = useLibrary();
  const { playTrack, toggleShuffle } = usePlayer();

  // Find playlist from user/mock playlists or Liked Songs
  let playlist = playlists.find((p) => p.id === id);
  let tracks = playlist ? playlist.tracks : [];

  if (id === 'pl-liked') {
    playlist = {
      id: 'pl-liked',
      title: 'Liked Songs',
      description: 'Your favorite saved songs in one place',
      coverUrl:
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
      tracks: likedTracks,
      trackCount: likedTracks.length,
      creatorName: 'You',
      isUserCreated: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-10-01',
    };
    tracks = likedTracks;
  } else if (!playlist) {
    // Fallback playlist
    tracks = MOCK_TRACKS;
    playlist = {
      id: 'default',
      title: 'Featured Collection',
      description: 'Top selected tracks',
      coverUrl: MOCK_TRACKS[0].artworkUrl,
      tracks: MOCK_TRACKS,
      trackCount: MOCK_TRACKS.length,
      creatorName: 'Elwo Music',
      isUserCreated: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-10-01',
    };
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      toggleShuffle();
      playTrack(tracks[randomIdx], tracks);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: 900, width: '100%', alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Back and options bar */}
        <View style={styles.navBar}>
          <Pressable
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </Pressable>
          <Pressable hitSlop={10} style={styles.navBtn}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={Colors.dark.text}
            />
          </Pressable>
        </View>

        {/* Hero Artwork & Playlist Meta */}
        <View style={styles.heroSection}>
          <Image source={{ uri: playlist.coverUrl }} style={styles.coverImage} />

          <Text style={styles.playlistTitle}>{playlist.title}</Text>
          {playlist.description ? (
            <Text style={styles.playlistDesc}>{playlist.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              By <Text style={styles.creatorHighlight}>{playlist.creatorName}</Text> •{' '}
              {tracks.length} songs
            </Text>
          </View>
        </View>

        {/* Action Controls: Play & Shuffle */}
        <View style={styles.actionCluster}>
          <Pressable style={styles.shuffleBtn} onPress={handleShuffle}>
            <Ionicons name="shuffle" size={20} color={Colors.dark.text} />
          </Pressable>

          <Pressable style={styles.playAllBtn} onPress={handlePlayAll}>
            <Ionicons
              name="play"
              size={26}
              color="#FFFFFF"
              style={{ marginLeft: 2 }}
            />
          </Pressable>
        </View>

        {/* Track List */}
        <View style={styles.trackList}>
          {tracks.map((track, idx) => (
            <TrackRow
              key={`${track.id}-${idx}`}
              track={track}
              index={idx}
              showIndex
            />
          ))}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  coverImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.cardHighlight,
    ...Shadows.card,
  },
  playlistTitle: {
    ...Typography.hero,
    color: Colors.dark.text,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  playlistDesc: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  creatorHighlight: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    marginVertical: Spacing.md,
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  playAllBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  trackList: {
    paddingTop: Spacing.sm,
  },
});
