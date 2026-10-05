import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePlayer } from '../../src/store/PlayerContext';
import { CardItem } from '../../src/components/common/CardItem';
import { ArtistAvatar } from '../../src/components/common/ArtistAvatar';
import { TrackRow } from '../../src/components/common/TrackRow';

type LibraryFilter = 'All' | 'Playlists' | 'Liked' | 'Artists' | 'Albums';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { playTrack } = usePlayer();
  const {
    likedTracks,
    playlists,
    followedArtists,
    savedAlbums,
    createPlaylist,
  } = useLibrary();

  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const filterOptions: LibraryFilter[] = ['All', 'Playlists', 'Liked', 'Artists', 'Albums'];

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a name for your playlist.');
      return;
    }
    const created = createPlaylist(newPlaylistTitle.trim(), newPlaylistDesc.trim());
    setNewPlaylistTitle('');
    setNewPlaylistDesc('');
    setCreateModalOpen(false);
    router.push(`/playlist/${created.id}`);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <View
        style={[
          styles.container,
          { maxWidth: 1080, width: '100%', alignSelf: 'center' },
        ]}>
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Your Library</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>ELWO</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              hitSlop={8}
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              style={styles.iconBtn}>
              <Ionicons
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                size={18}
                color={Colors.dark.text}
              />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => setCreateModalOpen(true)}
              style={styles.createBtn}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Compact Filter Tabs */}
        <View style={styles.filterBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}>
            {filterOptions.map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setActiveFilter(filter)}>
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.pillTextSelected,
                    ]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* When Liked tab is selected: show Liked Songs tracks & playlist link */}
          {activeFilter === 'Liked' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Liked Songs ({likedTracks.length})</Text>
                {likedTracks.length > 0 && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => playTrack(likedTracks[0], likedTracks)}>
                    <Text style={styles.addPlaylistText}>Play All</Text>
                  </Pressable>
                )}
              </View>

              {/* Compact Liked Songs Item Row */}
              <Pressable
                style={styles.playlistRow}
                onPress={() => router.push('/playlist/pl-liked')}>
                <LinearGradient
                  colors={['#8B5CF6', '#4F46E5']}
                  style={[styles.playlistThumb, styles.likedThumb]}>
                  <Ionicons name="heart" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.playlistMeta}>
                  <Text numberOfLines={1} style={styles.playlistTitle}>
                    Liked Songs Collection
                  </Text>
                  <Text numberOfLines={1} style={styles.playlistSubtitle}>
                    Auto-saved • {likedTracks.length} tracks
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.dark.textMuted}
                />
              </Pressable>

              {/* Liked Tracks list */}
              {likedTracks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={38} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyTitle}>No liked songs yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the heart icon on any playing song to save it here.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 4 }}>
                  {likedTracks.map((track, idx) => (
                    <TrackRow
                      key={`liked-${track.id}-${idx}`}
                      track={track}
                      index={idx}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Playlists: Shown when activeFilter is 'All' or 'Playlists' */}
          {(activeFilter === 'All' || activeFilter === 'Playlists') && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Playlists</Text>
                <Pressable hitSlop={8} onPress={() => setCreateModalOpen(true)}>
                  <Text style={styles.addPlaylistText}>+ New Playlist</Text>
                </Pressable>
              </View>

              {viewMode === 'list' ? (
                <>
                  {/* Pinned Liked Songs compact row */}
                  <Pressable
                    style={styles.playlistRow}
                    onPress={() => router.push('/playlist/pl-liked')}>
                    <LinearGradient
                      colors={['#8B5CF6', '#4F46E5']}
                      style={[styles.playlistThumb, styles.likedThumb]}>
                      <Ionicons name="heart" size={20} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.playlistMeta}>
                      <Text numberOfLines={1} style={styles.playlistTitle}>
                        Liked Songs
                      </Text>
                      <Text numberOfLines={1} style={styles.playlistSubtitle}>
                        Auto playlist • {likedTracks.length} songs
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.dark.textMuted}
                    />
                  </Pressable>

                  {/* Other Playlists */}
                  {playlists.map((pl) => (
                    <Pressable
                      key={pl.id}
                      style={styles.playlistRow}
                      onPress={() => router.push(`/playlist/${pl.id}`)}>
                      <Image source={{ uri: pl.coverUrl }} style={styles.playlistThumb} />
                      <View style={styles.playlistMeta}>
                        <Text numberOfLines={1} style={styles.playlistTitle}>
                          {pl.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.playlistSubtitle}>
                          Playlist • {pl.creatorName} • {pl.trackCount} songs
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.dark.textMuted}
                      />
                    </Pressable>
                  ))}
                </>
              ) : (
                <View style={styles.gridContainer}>
                  <CardItem
                    title="Liked Songs"
                    subtitle={`${likedTracks.length} songs`}
                    imageUrl="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80"
                    onPress={() => router.push('/playlist/pl-liked')}
                    onPressPlay={() => {
                      if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
                    }}
                  />
                  {playlists.map((pl) => (
                    <CardItem
                      key={pl.id}
                      title={pl.title}
                      subtitle={`${pl.trackCount} songs`}
                      imageUrl={pl.coverUrl}
                      onPress={() => router.push(`/playlist/${pl.id}`)}
                      onPressPlay={() => {
                        if (pl.tracks.length > 0) playTrack(pl.tracks[0], pl.tracks);
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Followed Artists: Shown when activeFilter is 'All' or 'Artists' */}
          {(activeFilter === 'All' || activeFilter === 'Artists') && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Followed Artists</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {followedArtists.map((artist) => (
                  <ArtistAvatar
                    key={artist.id}
                    artist={artist}
                    onPress={() => router.push(`/artist/${artist.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Saved Albums: Shown when activeFilter is 'All' or 'Albums' */}
          {(activeFilter === 'All' || activeFilter === 'Albums') && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Saved Albums</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}>
                {savedAlbums.map((album) => (
                  <CardItem
                    key={album.id}
                    title={album.title}
                    subtitle={album.artistName}
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
            </View>
          )}

          {/* Compact Offline Info Banner */}
          <View style={styles.offlineCard}>
            <Ionicons
              name="cloud-done-outline"
              size={18}
              color={Colors.dark.primary}
            />
            <View style={styles.offlineText}>
              <Text style={styles.offlineTitle}>Offline Mode Supported</Text>
              <Text style={styles.offlineSubtitle}>
                Tracks are cached locally for smooth instant playback.
              </Text>
            </View>
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Create Playlist Modal */}
        <Modal
          visible={isCreateModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setCreateModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <Text style={styles.modalSubtitle}>Give your custom playlist a name</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Playlist name (e.g. Chill Malayalam)"
                placeholderTextColor={Colors.dark.textMuted}
                value={newPlaylistTitle}
                onChangeText={setNewPlaylistTitle}
                autoFocus
              />

              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Description (optional)"
                placeholderTextColor={Colors.dark.textMuted}
                value={newPlaylistDesc}
                onChangeText={setNewPlaylistDesc}
                multiline
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setCreateModalOpen(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.confirmBtn}
                  onPress={handleCreatePlaylist}>
                  <Text style={styles.confirmBtnText}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  brandTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  brandTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  createBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  filterBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  pillSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  pillText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  addPlaylistText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
  },
  playlistThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardHighlight,
  },
  likedThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
    marginLeft: 12,
  },
  playlistTitle: {
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  playlistSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  horizontalRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  offlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 10,
    marginTop: 4,
  },
  offlineText: {
    flex: 1,
  },
  offlineTitle: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 12,
  },
  offlineSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#131A29',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    ...Typography.title1,
    color: Colors.dark.text,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: '#0A0E17',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  cancelBtnText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
  },
  confirmBtn: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
  },
  confirmBtnText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
