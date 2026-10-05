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
import { MOCK_TRACKS, MOCK_ARTISTS } from '../../src/constants/mockData';
import { MusicLanguage, Track } from '../../src/types/music';
import { getDisplayFirstName } from '../../src/types/user';
import { usePlayer } from '../../src/store/PlayerContext';
import { useAuth } from '../../src/store/AuthContext';
import { useChayakada } from '../../src/store/ChayakadaContext';
import { JioSaavnService } from '../../src/services/jiosaavn';
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
  const [selectedLanguage, setSelectedLanguage] = useState<MusicLanguage>('Malayalam');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyTrendingTracks, setDailyTrendingTracks] = useState<Track[]>([]);
  const [dailyNewReleaseTracks, setDailyNewReleaseTracks] = useState<Track[]>([]);
  const [isDailyLoading, setIsDailyLoading] = useState(false);

  // Time-aware authenticated greeting (Part 12)
  const userGreeting = useMemo(() => {
    return getDisplayFirstName(user);
  }, [user]);

  const fetchDailyData = useCallback(async (lang: MusicLanguage) => {
    setIsDailyLoading(true);
    try {
      const [trendingRes, newRelRes] = await Promise.all([
        JioSaavnService.getDailyTrending(lang, 12),
        JioSaavnService.getDailyNewReleases(lang, 12),
      ]);
      if (trendingRes && trendingRes.length > 0) {
        setDailyTrendingTracks(trendingRes);
        recommendationEngine.registerTracks(trendingRes);
      }
      if (newRelRes && newRelRes.length > 0) {
        setDailyNewReleaseTracks(newRelRes);
        recommendationEngine.registerTracks(newRelRes);
      }
    } catch (e) {
      console.warn('Failed to fetch daily JioSaavn music:', e);
    } finally {
      setIsDailyLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Show language onboarding after login page finishes for first-time users
  useEffect(() => {
    if (!showAuthModal) {
      AsyncStorage.getItem('@elwo_language_onboarded')
        .then((onboarded) => {
          if (!onboarded) {
            setShowOnboarding(true);
          } else {
            AsyncStorage.getItem('@elwo_default_language').then((savedDefault) => {
              if (savedDefault) {
                setSelectedLanguage(savedDefault as MusicLanguage);
              }
            });
            refreshLanguagePreference();
          }
        })
        .catch(() => {});
    }
  }, [showAuthModal, refreshLanguagePreference]);

  // Sync default language whenever returning from Profile or other tabs
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@elwo_default_language').then((savedDefault) => {
        if (savedDefault && savedDefault !== selectedLanguage) {
          setSelectedLanguage(savedDefault as MusicLanguage);
        }
      });
      refreshLanguagePreference();
    }, [selectedLanguage, refreshLanguagePreference])
  );

  const handleOnboardingComplete = async (
    selectedLanguages: MusicLanguage[],
    defaultLang: MusicLanguage
  ) => {
    setShowOnboarding(false);
    setSelectedLanguage(defaultLang);
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
    fetchDailyData(defaultLang);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDailyData(selectedLanguage);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedLanguage, fetchDailyData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDailyData(selectedLanguage);
  }, [selectedLanguage, fetchDailyData]);

  // Filter pool based on selected language
  const availableTracks = useMemo(() => {
    const base = dailyTrendingTracks.length > 0 ? dailyTrendingTracks : MOCK_TRACKS;
    if (selectedLanguage === 'All') return base;
    return base.filter((t) => t.language === selectedLanguage);
  }, [selectedLanguage, dailyTrendingTracks]);

  // 1. "Made for you" — Personalized weighted recommendation scoring
  const madeForYouTracks = useMemo(() => {
    return recommendationEngine.getMadeForYou(availableTracks, 8);
  }, [availableTracks]);

  // 3. "Fresh drops" — Latest releases
  const freshDropTracks = useMemo(() => {
    if (dailyNewReleaseTracks.length > 0) {
      return dailyNewReleaseTracks.slice(0, 10);
    }
    return recommendationEngine.getFreshDrops(availableTracks, 10);
  }, [dailyNewReleaseTracks, availableTracks]);

  // 4. "Your vibe" — Genre and mood cluster from profile
  const yourVibeTracks = useMemo(() => {
    return recommendationEngine.getYourVibe(availableTracks, 8);
  }, [availableTracks]);

  // 5. "Artists you may like"
  const recommendedArtists = useMemo(() => {
    return MOCK_ARTISTS.slice(0, 6);
  }, []);

  if (isDailyLoading && dailyTrendingTracks.length === 0) {
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
              ? `Guest Pass: ${Math.floor(guestRemainingSeconds / 60)}:${(guestRemainingSeconds % 60) < 10 ? '0' : ''}${guestRemainingSeconds % 60} left`
              : 'Unlimited music • Zero ads'
          }
        />

        {/* Nostalgic Kerala Ambience ASMR Soundscape Banner (Shown ONLY when top Ambience button is clicked) */}
        {isBannerVisible && <ChayakadaBanner />}

        {/* 1. Recently Listened */}
        {recentlyPlayed && recentlyPlayed.length > 0 && (
          <>
            <ELWOSectionHeader
              title="Recently Listened"
              subtitle="Your recent listening"
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

        {/* 2. Made for you */}
        <ELWOSectionHeader
          title="Made for you"
          subtitle="Tuned to your taste"
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

        {/* 3. Fresh Drops */}
        <ELWOSectionHeader
          title="Fresh Drops"
          subtitle={`Latest ${selectedLanguage !== 'All' ? selectedLanguage : ''} releases`}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalRow}
          bounces={false}>
          {freshDropTracks.map((track) => (
            <MusicCard
              key={`fresh-drop-${track.id}`}
              track={track}
              badge="NEW"
              onPress={() => playTrack(track, freshDropTracks)}
            />
          ))}
        </ScrollView>

        {/* 4. Your Vibe */}
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

        {/* 5. Recommended Artists */}
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

        {/* Bottom space ensuring final row scrolls completely clear of MiniPlayer */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Welcome & Authentication Modal (Google / Guest) */}
      <AuthModal
        visible={showAuthModal}
        onLanguageSelected={(lang) => {
          setSelectedLanguage(lang);
          fetchDailyData(lang);
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
