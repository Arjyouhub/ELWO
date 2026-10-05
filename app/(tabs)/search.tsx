import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { TrackRow } from '../../src/components/common/TrackRow';
import { ArtistCard } from '../../src/components/common/ArtistCard';
import { CardItem } from '../../src/components/common/CardItem';
import { ELWOSectionHeader } from '../../src/components/common/ELWOSectionHeader';
import {
  MOCK_TRACKS,
  MOCK_ARTISTS,
  MOCK_ALBUMS,
  MOCK_PLAYLISTS,
  MOCK_GENRES,
} from '../../src/constants/mockData';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePlayer } from '../../src/store/PlayerContext';
import { JioSaavnService } from '../../src/services/jiosaavn';
import { musicCatalogService } from '../../src/services/musicCatalogService';
import { recommendationEngine } from '../../src/services/recommendationEngine';
import { Track } from '../../src/types/music';

type SearchFilterTab = 'All' | 'Songs' | 'Artists' | 'Albums' | 'Playlists';

const TRENDING_SEARCHES = [
  'Aavesham',
  'Sushin Shyam',
  'Anirudh',
  'Illuminati',
  'Leo',
  'Malayalam Hits',
  'Arijit Singh',
  'Dua Lipa',
];

export default function SearchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { playTrack } = usePlayer();
  const {
    searchHistory,
    addSearchQuery,
    removeSearchQuery,
    clearSearchHistory,
  } = useLibrary();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchFilterTab>('All');
  const [onlineTracks, setOnlineTracks] = useState<Track[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const genreCardWidth = useMemo(() => {
    if (width >= 900) return '23.5%';
    if (width >= 600) return '31.5%';
    return '47.5%';
  }, [width]);

  // Debounce search input for instant, stutter-free performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      if (query.trim().length > 1) {
        addSearchQuery(query.trim());
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query, addSearchQuery]);

  // Live JioSaavn API Search for full song catalog
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      setIsSearchingOnline(true);
      Promise.allSettled([
        musicCatalogService.searchTracks(debouncedQuery, undefined, 25),
        JioSaavnService.searchSongs(debouncedQuery, 25),
      ])
        .then(([catalogRes, jioRes]) => {
          if (!isCurrent) return;
          const catalogTracks =
            catalogRes.status === 'fulfilled' ? catalogRes.value : [];
          const jioTracks =
            jioRes.status === 'fulfilled' ? jioRes.value : [];

          const seen = new Set<string>();
          const merged: Track[] = [];

          // Prioritize backend catalog tracks first
          for (const t of [...catalogTracks, ...jioTracks]) {
            const key = (t.title + '_' + t.artistName).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(t);
            }
          }

          setOnlineTracks(merged);
          recommendationEngine.registerTracks(merged);
          setIsSearchingOnline(false);
        })
        .catch(() => {
          if (isCurrent) {
            setIsSearchingOnline(false);
          }
        });
    }, 0);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [debouncedQuery]);

  // Filtered and live merged results
  const searchResults = useMemo(() => {
    if (!debouncedQuery) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const q = debouncedQuery.toLowerCase();
    const mockMatchingTracks = MOCK_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.language.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
    );

    const activeOnline = debouncedQuery.length >= 2 ? onlineTracks : [];
    const onlineIds = new Set(activeOnline.map((t) => t.id));
    const mergedTracks = [
      ...activeOnline,
      ...mockMatchingTracks.filter((mt) => !onlineIds.has(mt.id)),
    ];

    const artists = MOCK_ARTISTS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.genres.some((g) => g.toLowerCase().includes(q))
    );
    const albums = MOCK_ALBUMS.filter(
      (alb) =>
        alb.title.toLowerCase().includes(q) ||
        alb.artistName.toLowerCase().includes(q)
    );
    const playlists = MOCK_PLAYLISTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );

    return { tracks: mergedTracks, artists, albums, playlists };
  }, [debouncedQuery, onlineTracks]);

  const hasResults =
    searchResults.tracks.length > 0 ||
    searchResults.artists.length > 0 ||
    searchResults.albums.length > 0 ||
    searchResults.playlists.length > 0;

  const tabs: SearchFilterTab[] = ['All', 'Songs', 'Artists', 'Albums', 'Playlists'];

  return (
    <View style={[styles.safeArea, { paddingTop: topInset + 6 }]}>
      <View
        style={[
          styles.container,
          { maxWidth: 1080, width: '100%', alignSelf: 'center' },
        ]}>
        {/* Clean Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>ELWO SEARCH</Text>
            </View>
          </View>
        </View>

        {/* Search Input Field */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color={Colors.dark.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Songs, artists, albums, genres..."
              placeholderTextColor={Colors.dark.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {isSearchingOnline && (
              <ActivityIndicator
                size="small"
                color={Colors.dark.primary}
                style={{ marginRight: Spacing.sm }}
              />
            )}
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                style={styles.clearBtn}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={Colors.dark.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Compact Horizontal Filter Tabs (Part 19) */}
        <View style={styles.filterTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContainer}
            bounces={false}>
            {tabs.map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  onPress={() => setActiveTab(tab)}>
                  <Text
                    style={[
                      styles.tabPillText,
                      isSelected && styles.tabPillTextActive,
                    ]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {debouncedQuery.length === 0 ? (
            /* Default Search State: History, Trending, Categories */
            <>
              {searchHistory.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <Pressable onPress={clearSearchHistory} hitSlop={8}>
                      <Text style={styles.clearHistoryText}>Clear</Text>
                    </Pressable>
                  </View>

                  <View style={styles.historyChips}>
                    {searchHistory.map((item, idx) => (
                      <View key={`${item}-${idx}`} style={styles.historyChip}>
                        <Pressable
                          style={styles.historyChipMain}
                          onPress={() => setQuery(item)}>
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color={Colors.dark.textSecondary}
                          />
                          <Text style={styles.historyChipText}>{item}</Text>
                        </Pressable>
                        <Pressable
                          hitSlop={6}
                          onPress={() => removeSearchQuery(item)}
                          style={styles.historyChipRemove}>
                          <Ionicons
                            name="close"
                            size={13}
                            color={Colors.dark.textMuted}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Searches */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Trending Searches</Text>
                  <Ionicons name="flame" size={16} color={Colors.dark.primary} />
                </View>

                <View style={styles.trendingChips}>
                  {TRENDING_SEARCHES.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.trendingChip}
                      onPress={() => setQuery(item)}>
                      <Text style={styles.trendingChipText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Browse Categories */}
              <ELWOSectionHeader
                title="Browse Categories"
                subtitle="Genres, languages & moodscapes"
              />
              <View style={styles.genresGrid}>
                {MOCK_GENRES.map((genre) => (
                  <Pressable
                    key={genre.id}
                    style={[styles.genreCardWrapper, { width: genreCardWidth }]}
                    onPress={() => setQuery(genre.name.split(' ')[0])}>
                    <View style={styles.genreCard}>
                      <Text style={styles.genreTitle}>{genre.name}</Text>
                      <Ionicons
                        name={(genre.iconName as any) || 'disc'}
                        size={22}
                        color={Colors.dark.primary}
                        style={styles.genreIcon}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : !hasResults ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={Colors.dark.textMuted}
              />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try checking for typos or searching for a different artist, track or genre.
              </Text>
            </View>
          ) : (
            /* Results View */
            <View style={styles.resultsContainer}>
              {/* Songs List */}
              {(activeTab === 'All' || activeTab === 'Songs') &&
                searchResults.tracks.length > 0 && (
                  <View style={styles.resultSection}>
                    <ELWOSectionHeader
                      title={`Songs (${searchResults.tracks.length})`}
                    />
                    {searchResults.tracks.map((track, idx) => (
                      <TrackRow
                        key={`search-track-${track.id}-${idx}`}
                        track={track}
                        index={idx}
                        onPress={() => playTrack(track)}
                      />
                    ))}
                  </View>
                )}

              {/* Artists */}
              {(activeTab === 'All' || activeTab === 'Artists') &&
                searchResults.artists.length > 0 && (
                  <View style={styles.resultSection}>
                    <ELWOSectionHeader title="Artists" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalArtists}
                      bounces={false}>
                      {searchResults.artists.map((artist) => (
                        <ArtistCard key={`search-artist-${artist.id}`} artist={artist} />
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* Albums */}
              {(activeTab === 'All' || activeTab === 'Albums') &&
                searchResults.albums.length > 0 && (
                  <View style={styles.resultSection}>
                    <ELWOSectionHeader title="Albums" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalCards}
                      bounces={false}>
                      {searchResults.albums.map((album) => (
                        <CardItem
                          key={`search-album-${album.id}`}
                          title={album.title}
                          subtitle={album.artistName}
                          imageUrl={album.artworkUrl}
                          badge={album.language}
                          onPress={() => router.push(`/album/${album.id}`)}
                          onPressPlay={() => {
                            if (album.tracks.length > 0) {
                              playTrack(album.tracks[0], album.tracks);
                            }
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* Playlists */}
              {(activeTab === 'All' || activeTab === 'Playlists') &&
                searchResults.playlists.length > 0 && (
                  <View style={styles.resultSection}>
                    <ELWOSectionHeader title="Playlists" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalCards}
                      bounces={false}>
                      {searchResults.playlists.map((playlist) => (
                        <CardItem
                          key={`search-pl-${playlist.id}`}
                          title={playlist.title}
                          subtitle={`${playlist.trackCount} songs`}
                          imageUrl={playlist.coverUrl}
                          onPress={() => router.push(`/playlist/${playlist.id}`)}
                          onPressPlay={() => {
                            if (playlist.tracks.length > 0) {
                              playTrack(playlist.tracks[0], playlist.tracks);
                            }
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
            </View>
          )}

          <View style={{ height: 160 }} />
        </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.4,
  },
  brandTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  brandTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 1,
  },
  searchBarWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterTabsWrapper: {
    height: 44,
    marginVertical: 4,
  },
  filterTabsContainer: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.2,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.xs,
  },
  sectionBlock: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  clearHistoryText: {
    fontSize: 11,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  historyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyChipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyChipText: {
    fontSize: 11,
    color: Colors.dark.text,
  },
  historyChipRemove: {
    padding: 3,
    marginLeft: 3,
  },
  trendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trendingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  trendingChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  genreCardWrapper: {
    height: 72,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  genreCard: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
  },
  genreTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  genreIcon: {
    alignSelf: 'flex-end',
  },
  resultsContainer: {
    paddingTop: 2,
  },
  resultSection: {
    marginBottom: Spacing.md,
  },
  horizontalArtists: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    paddingVertical: 4,
  },
  horizontalCards: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    paddingVertical: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
