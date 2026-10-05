import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '../../src/constants/theme';
import { ELWOHeader } from '../../src/components/common/ELWOHeader';
import { ELWOSectionHeader } from '../../src/components/common/ELWOSectionHeader';
import { CompactMusicCard } from '../../src/components/common/CompactMusicCard';
import { MusicCard } from '../../src/components/common/MusicCard';
import { ArtistCard } from '../../src/components/common/ArtistCard';
import { LanguageOnboardingModal } from '../../src/components/common/LanguageOnboardingModal';
import { AuthModal } from '../../src/components/common/AuthModal';
import { HomeSkeleton } from '../../src/components/common/SkeletonLoader';
import { ChayakadaBanner } from '../../src/components/chayakada/ChayakadaBanner';
import { MOCK_ARTISTS } from '../../src/constants/mockData';
import { MusicLanguage, Track } from '../../src/types/music';
import { getDisplayFirstName } from '../../src/types/user';
import { usePlayer } from '../../src/store/PlayerContext';
import { useAuth } from '../../src/store/AuthContext';
import { useChayakada } from '../../src/store/ChayakadaContext';
import {
  musicCatalogService,
  HomeCatalogResponse,
} from '../../src/services/musicCatalogService';
import { recommendationEngine } from '../../src/services/recommendationEngine';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const { playTrack, recentlyPlayed } = usePlayer();
  const { user, isGuest, showAuthModal, guestRemainingSeconds } = useAuth();
  const { refreshLanguagePreference, isBannerVisible } = useChayakada();

  const [preferredLanguages, setPreferredLanguages] = useState<MusicLanguage[]>([
    'Malayalam',
  ]);
  const [homeCatalog, setHomeCatalog] = useState<HomeCatalogResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Time-aware authenticated greeting
  const userGreeting = useMemo(() => {
    return getDisplayFirstName(user);
  }, [user]);

  // Fetch live home catalog from backend MongoDB single source of truth
  const fetchCatalogData = useCallback(
    async (langs: MusicLanguage[], forceRefresh: boolean = false) => {
      try {
        const catalog = await musicCatalogService.getHomeCatalog(langs, forceRefresh);
        setHomeCatalog(catalog);

        // Register all freshly discovered tracks with recommendation engine
        const allFetchedTracks: Track[] = [
          ...(catalog.newReleases || []),
          ...(catalog.newlyAdded || []),
          ...(catalog.trending || []),
          ...(catalog.popular || []),
          ...(catalog.classics || []),
          ...(catalog.recommended || []),
        ];
        recommendationEngine.registerTracks(allFetchedTracks);
      } catch (e) {
        console.warn('Failed to fetch music catalog:', e);
      } finally {
        setIsLoadingCatalog(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Load saved language preferences from storage
  const loadPreferencesAndCatalog = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        const [savedLangsJson, defaultLang] = await Promise.all([
          AsyncStorage.getItem('@elwo_languages'),
          AsyncStorage.getItem('@elwo_default_language'),
        ]);

        let langs: MusicLanguage[] = ['Malayalam'];
        if (savedLangsJson) {
          try {
            const parsed = JSON.parse(savedLangsJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              langs = parsed;
            }
          } catch {}
        } else if (defaultLang) {
          langs = [defaultLang as MusicLanguage];
        }

        setPreferredLanguages(langs);
        recommendationEngine.setLanguagePreference(langs);
        await fetchCatalogData(langs, forceRefresh);
      } catch {
        fetchCatalogData(['Malayalam'], forceRefresh);
      }
    },
    [fetchCatalogData]
  );

  // Check onboarding status on mount or when auth modal closes
  useEffect(() => {
    if (!showAuthModal) {
      AsyncStorage.getItem('@elwo_language_onboarded')
        .then((onboarded) => {
          if (!onboarded) {
            setShowOnboarding(true);
          } else {
            loadPreferencesAndCatalog(false);
            refreshLanguagePreference();
          }
        })
        .catch(() => {
          loadPreferencesAndCatalog(false);
        });
    }
  }, [showAuthModal, refreshLanguagePreference, loadPreferencesAndCatalog]);

  // Re-check catalog when user navigates back to Home screen
  useFocusEffect(
    useCallback(() => {
      loadPreferencesAndCatalog(false);
      refreshLanguagePreference();
    }, [loadPreferencesAndCatalog, refreshLanguagePreference])
  );

  const handleOnboardingComplete = async (
    selectedLanguages: MusicLanguage[],
    defaultLang: MusicLanguage
  ) => {
    setShowOnboarding(false);
    setPreferredLanguages(selectedLanguages);
    recommendationEngine.setLanguagePreference(selectedLanguages);

    try {
      await AsyncStorage.setItem('@elwo_language_onboarded', 'true');
      await AsyncStorage.setItem('@elwo_default_language', defaultLang);
      await AsyncStorage.setItem(
        '@elwo_languages',
        JSON.stringify(selectedLanguages)
      );
    } catch {}

    await refreshLanguagePreference();
    musicCatalogService.invalidateCache();
    fetchCatalogData(selectedLanguages, true);
  };

  // Pull-to-refresh: Force live re-fetch from MongoDB catalog
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    musicCatalogService.invalidateCache();
    fetchCatalogData(preferredLanguages, true);
  }, [preferredLanguages, fetchCatalogData]);

  // Track pools from live catalog
  const newReleasesTracks = useMemo(
    () => homeCatalog?.newReleases || [],
    [homeCatalog]
  );
  const newlyAddedTracks = useMemo(
    () => homeCatalog?.newlyAdded || [],
    [homeCatalog]
  );
  const trendingTracks = useMemo(
    () => homeCatalog?.trending || [],
    [homeCatalog]
  );
  const popularTracks = useMemo(
    () => homeCatalog?.popular || [],
    [homeCatalog]
  );

  // 1. "Made for you" — Personalized weighted recommendation scoring
  const madeForYouTracks = useMemo(() => {
    const base = [
      ...(homeCatalog?.recommended || []),
      ...newlyAddedTracks,
      ...trendingTracks,
    ];
    return recommendationEngine.getMadeForYou(base.length > 0 ? base : undefined, 8);
  }, [homeCatalog, newlyAddedTracks, trendingTracks]);

  // 2. "Your vibe" — Genre and mood cluster from profile
  const yourVibeTracks = useMemo(() => {
    const base = [
      ...(homeCatalog?.recommended || []),
      ...trendingTracks,
      ...popularTracks,
    ];
    return recommendationEngine.getYourVibe(base.length > 0 ? base : undefined, 8);
  }, [homeCatalog, trendingTracks, popularTracks]);

  // 3. Recommended Artists
  const recommendedArtists = useMemo(() => {
    if (homeCatalog?.artists && homeCatalog.artists.length > 0) {
      return homeCatalog.artists.slice(0, 8);
    }
    return MOCK_ARTISTS.slice(0, 8);
  }, [homeCatalog]);

  const languagesLabel = preferredLanguages.join(' & ');

  if (isLoadingCatalog && !homeCatalog) {
    return (
      <View style={[styles.safeArea, { paddingTop: topInset }]}>
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: 1080, width: '100%', alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }>
        {/* ELWO Top Header & Contextual Greeting */}
        <ELWOHeader
          greeting={userGreeting}
          subtitle={
            isGuest
              ? `Guest Pass: ${Math.floor(guestRemainingSeconds / 60)}:${
                  guestRemainingSeconds % 60 < 10 ? '0' : ''
                }${guestRemainingSeconds % 60} left`
              : `${languagesLabel} • Unlimited live music`
          }
        />

        {/* Nostalgic Kerala Ambience ASMR Soundscape Banner */}
        {isBannerVisible && <ChayakadaBanner />}

        {/* 1. Recently Listened */}
        {recentlyPlayed && recentlyPlayed.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Recently Listened"
              subtitle="Continue where you left off"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {recentlyPlayed.map((track) => (
                <CompactMusicCard
                  key={`recent-${track.id}`}
                  track={track}
                  onPress={() => playTrack(track, recentlyPlayed)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 2. New Releases (Sorted by releaseDate DESC with [NEW] Badge) */}
        {newReleasesTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="New Releases"
              subtitle={`Fresh tracks released in ${languagesLabel}`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {newReleasesTracks.map((track) => (
                <MusicCard
                  key={`new-rel-${track.id}`}
                  track={track}
                  badge="NEW"
                  onPress={() => playTrack(track, newReleasesTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 3. Newly Added (Sorted by addedAt DESC - Latest additions to ELWO) */}
        {newlyAddedTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Newly Added"
              subtitle="Latest additions to the ELWO catalog"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {newlyAddedTracks.map((track) => (
                <MusicCard
                  key={`new-add-${track.id}`}
                  track={track}
                  badge={track.isNew ? 'NEW' : track.language}
                  onPress={() => playTrack(track, newlyAddedTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 4. Trending Now */}
        {trendingTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Trending Now"
              subtitle={`Most played ${languagesLabel} hits`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {trendingTracks.map((track) => (
                <MusicCard
                  key={`trend-${track.id}`}
                  track={track}
                  badge={track.language}
                  onPress={() => playTrack(track, trendingTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 5. Community Favorites / Popular */}
        {popularTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Popular Hits"
              subtitle="Most loved by ELWO listeners"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {popularTracks.map((track) => (
                <MusicCard
                  key={`pop-${track.id}`}
                  track={track}
                  badge={track.genre}
                  onPress={() => playTrack(track, popularTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 6. Made for you (Recommendation Engine) */}
        {madeForYouTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Made for you"
              subtitle="Personalized recommendations tuned to your taste"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {madeForYouTracks.map((track) => (
                <MusicCard
                  key={`mfy-${track.id}`}
                  track={track}
                  badge={track.language}
                  onPress={() => playTrack(track, madeForYouTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 8. Your Vibe */}
        {yourVibeTracks.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Your Vibe"
              subtitle="Custom mix aligned with your listening style"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {yourVibeTracks.map((track) => (
                <MusicCard
                  key={`vibe-${track.id}`}
                  track={track}
                  badge={track.genre}
                  onPress={() => playTrack(track, yourVibeTracks)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 9. Recommended Artists */}
        {recommendedArtists.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Recommended Artists"
              subtitle="Expand your musical horizons"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
              bounces={false}>
              {recommendedArtists.map((artist) => (
                <ArtistCard key={`artist-${artist.id}`} artist={artist} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Bottom space ensuring final row scrolls completely clear of MiniPlayer */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Welcome & Authentication Modal */}
      <AuthModal
        visible={showAuthModal}
        onLanguageSelected={(lang) => {
          const langs = [lang];
          setPreferredLanguages(langs);
          fetchCatalogData(langs, true);
        }}
      />

      {/* Language Onboarding Modal */}
      <LanguageOnboardingModal
        visible={!showAuthModal && showOnboarding}
        onComplete={handleOnboardingComplete}
      />
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
  horizontalRow: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    paddingVertical: 4,
  },
});
