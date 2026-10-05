import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { usePlayer } from '../../src/store/PlayerContext';
import { TrackRow } from '../../src/components/common/TrackRow';
import { CardItem } from '../../src/components/common/CardItem';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { MOCK_ARTISTS, MOCK_TRACKS, MOCK_ALBUMS } from '../../src/constants/mockData';

export default function ArtistDetailScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playTrack, toggleShuffle } = usePlayer();
  const [isFollowing, setIsFollowing] = useState(false);

  const artist = MOCK_ARTISTS.find((a) => a.id === id) || MOCK_ARTISTS[0];
  const artistTracks = MOCK_TRACKS.filter((t) => t.artistId === artist.id);
  const artistAlbums = MOCK_ALBUMS.filter((a) => a.artistId === artist.id);

  const popularTracks =
    artistTracks.length > 0 ? artistTracks : MOCK_TRACKS.slice(0, 5);

  const formatListeners = (num?: number) => {
    if (!num) return '1.2M';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return `${num}`;
  };

  const handlePlayAll = () => {
    if (popularTracks.length > 0) {
      playTrack(popularTracks[0], popularTracks);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: 900, width: '100%', alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Banner with Artist Image */}
        <View style={[styles.bannerContainer, { height: 280 + topInset }]}>
          <Image source={{ uri: artist.avatarUrl }} style={styles.bannerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(8, 12, 20, 0.8)', '#080C14']}
            style={styles.bannerGradient}
          />

          {/* Navigation Bar overlay */}
          <View style={[styles.navBar, { paddingTop: topInset + Spacing.sm }]}>
            <Pressable
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.navBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable hitSlop={10} style={styles.navBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Artist Header Info */}
          <View style={styles.artistInfo}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.dark.primary} />
              <Text style={styles.verifiedText}>Verified Artist</Text>
            </View>
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.listenersText}>
              {formatListeners(artist.monthlyListeners)} monthly listeners
            </Text>
          </View>
        </View>

        {/* Action Controls: Follow, Shuffle, Play */}
        <View style={styles.actionCluster}>
          <Pressable
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={() => setIsFollowing(!isFollowing)}>
            <Text
              style={[
                styles.followBtnText,
                isFollowing && styles.followBtnTextActive,
              ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>

          <View style={styles.playbackBtns}>
            <Pressable
              style={styles.shuffleBtn}
              onPress={() => {
                toggleShuffle();
                handlePlayAll();
              }}>
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
        </View>

        {/* Popular Tracks */}
        <SectionHeader title="Popular" subtitle="Top streamed tracks" />
        <View style={styles.trackList}>
          {popularTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              showIndex
            />
          ))}
        </View>

        {/* Discography / Albums */}
        {artistAlbums.length > 0 && (
          <>
            <SectionHeader title="Discography" subtitle="Albums & EPs" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalAlbums}>
              {artistAlbums.map((album) => (
                <CardItem
                  key={album.id}
                  title={album.title}
                  subtitle={`${album.releaseDate.split('-')[0]} • Album`}
                  imageUrl={album.artworkUrl}
                  badge={album.language}
                  onPress={() => router.push(`/album/${album.id}`)}
                  onPressPlay={() => {
                    if (album.tracks.length > 0)
                      playTrack(album.tracks[0], album.tracks);
                  }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Artist Bio */}
        {artist.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>About the Artist</Text>
            <Text style={styles.bioText}>{artist.bio}</Text>
          </View>
        )}

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
  bannerContainer: {
    height: 280,
    position: 'relative',
    justifyContent: 'space-between',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  verifiedText: {
    ...Typography.micro,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
  },
  artistName: {
    ...Typography.hero,
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listenersText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    backgroundColor: 'transparent',
  },
  followBtnActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  followBtnText: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  followBtnTextActive: {
    color: Colors.dark.primary,
  },
  playbackBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  trackList: {
    paddingTop: Spacing.xs,
  },
  horizontalAlbums: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  bioSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bioTitle: {
    ...Typography.title3,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  bioText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});
