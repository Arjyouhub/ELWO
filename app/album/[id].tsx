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
import { usePlayer } from '../../src/store/PlayerContext';
import { TrackRow } from '../../src/components/common/TrackRow';
import { MOCK_ALBUMS, MOCK_TRACKS } from '../../src/constants/mockData';

export default function AlbumDetailScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playTrack, toggleShuffle } = usePlayer();

  const album = MOCK_ALBUMS.find((a) => a.id === id) || MOCK_ALBUMS[0];
  const albumTracks = MOCK_TRACKS.filter(
    (t) => t.albumId === album.id || t.artistId === album.artistId
  );

  const tracks = albumTracks.length > 0 ? albumTracks : MOCK_TRACKS.slice(0, 4);

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
        {/* Navigation Bar */}
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

        {/* Hero Artwork & Meta */}
        <View style={styles.heroSection}>
          <Image source={{ uri: album.artworkUrl }} style={styles.coverImage} />

          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.artistName}>{album.artistName}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{album.language}</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{album.genre}</Text>
            </View>
            <Text style={styles.metaYear}>
              {album.releaseDate.split('-')[0]} • {tracks.length} tracks
            </Text>
          </View>
        </View>

        {/* Action Controls */}
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
  albumTitle: {
    ...Typography.hero,
    color: Colors.dark.text,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  artistName: {
    ...Typography.title2,
    color: Colors.dark.primary,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pillBadgeText: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
  },
  metaYear: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
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
