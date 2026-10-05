import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../store/AuthContext';
import { MusicLanguage } from '../../types/music';
import { recommendationEngine } from '../../services/recommendationEngine';

interface AuthModalProps {
  visible: boolean;
  onDismiss?: () => void;
  onLanguageSelected?: (lang: MusicLanguage) => void;
}

const LANGUAGE_OPTIONS: {
  id: MusicLanguage;
  name: string;
  nativeName: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം', subtitle: 'Aavesham, Sushin, Vineeth, Dabzee...', icon: 'musical-note' },
  { id: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்', subtitle: 'Anirudh, Rahman, Yuvan, Harris...', icon: 'flame' },
  { id: 'Hindi', name: 'Hindi', nativeName: 'हिन्दी', subtitle: 'Arijit, Pritam, Bollywood, Coke Studio...', icon: 'heart' },
  { id: 'English', name: 'English', nativeName: 'Global', subtitle: 'The Weeknd, Dua Lipa, Pop, Hip-Hop...', icon: 'globe' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onDismiss, onLanguageSelected }) => {
  const { loginWithGoogle, continueAsGuest, completeOnboarding, setShowAuthModal, isGuestExpired } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'auth' | 'language'>('auth');
  const [selectedLanguages, setSelectedLanguages] = useState<MusicLanguage[]>([]);

  // Equalizer visualizer animation values
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [wave1] = useState(() => new Animated.Value(0.4));
  const [wave2] = useState(() => new Animated.Value(0.9));
  const [wave3] = useState(() => new Animated.Value(0.6));
  const [wave4] = useState(() => new Animated.Value(0.8));
  const [wave5] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    // Breathing aura
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const makeWave = (anim: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: dur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: dur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    const waves = Animated.parallel([
      breathing,
      makeWave(wave1, 550),
      makeWave(wave2, 750),
      makeWave(wave3, 620),
      makeWave(wave4, 800),
      makeWave(wave5, 680),
    ]);

    waves.start();

    return () => {
      waves.stop();
    };
  }, [pulseAnim, wave1, wave2, wave3, wave4, wave5]);

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16
  );
  const bottomPadding = Math.max(insets.bottom, 20);

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    const onboarded = await AsyncStorage.getItem('@elwo_language_onboarded');
    if (!onboarded) {
      setStep('language');
    } else {
      if (onDismiss) onDismiss();
      setShowAuthModal(false);
    }
  };

  const handleGuest = async () => {
    await continueAsGuest();
    const onboarded = await AsyncStorage.getItem('@elwo_language_onboarded');
    if (!onboarded) {
      setStep('language');
    } else {
      if (onDismiss) onDismiss();
      setShowAuthModal(false);
    }
  };

  const toggleLanguage = (lang: MusicLanguage) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.filter((l) => l !== lang);
      }
      if (prev.length >= 3) {
        return [prev[0], prev[1], lang];
      }
      return [...prev, lang];
    });
  };

  const handleFinishLanguage = async () => {
    if (selectedLanguages.length === 0) return;
    const defaultLang = selectedLanguages[0];

    try {
      await completeOnboarding(selectedLanguages);
      await AsyncStorage.setItem('@elwo_default_language', defaultLang);
      await AsyncStorage.setItem('@elwo_languages', JSON.stringify(selectedLanguages));
      await AsyncStorage.setItem('@elwo_language_onboarded', 'true');
    } catch {}

    recommendationEngine.setLanguagePreference(selectedLanguages);

    if (onLanguageSelected) {
      onLanguageSelected(defaultLang);
    }
    if (onDismiss) {
      onDismiss();
    }
    setShowAuthModal(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#050711" />

        {/* Ambient Atmospheric Glow Orbs */}
        <Animated.View
          style={[
            styles.glowOrbPrimary,
            { transform: [{ scale: pulseAnim }] },
          ]}
          pointerEvents="none"
        />
        <View style={styles.glowOrbSecondary} pointerEvents="none" />
        <View style={styles.glowOrbEmerald} pointerEvents="none" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topPadding + 12,
              paddingBottom: bottomPadding + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}>

          {step === 'auth' ? (
            <>
              {/* Top Brand Header */}
              <View style={styles.heroSection}>
                {/* Glowing Logo Container */}
                <View style={styles.logoWrapper}>
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoGradientBox}>
                    <Ionicons name="musical-notes" size={32} color="#FFFFFF" />
                  </LinearGradient>

                  {/* Animated Equalizer Waveform indicator */}
                  <View style={styles.waveformContainer}>
                    {[wave1, wave2, wave3, wave4, wave5].map((w, idx) => (
                      <Animated.View
                        key={idx}
                        style={[
                          styles.waveBar,
                          { transform: [{ scaleY: w }] },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.appName}>ELWO</Text>
                <Text style={styles.appTagline}>Listen your way.</Text>

                {/* Pill Highlights */}
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroPill}>
                    <View style={styles.liveGreenDot} />
                    <Text style={styles.heroPillText}>STUDIO MASTER</Text>
                  </View>
                  <View style={[styles.heroPill, styles.heroPillAccent]}>
                    <Ionicons name="sparkles" size={10} color="#A78BFA" />
                    <Text style={styles.heroPillTextAccent}>KERALA AMBIENCE</Text>
                  </View>
                </View>
              </View>

              {/* Ambience Showcase Grid (Chayakada, Bus, Train) */}
              <View style={styles.showcaseSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>IMMERSIVE SOUNDSCAPES</Text>
                  <Text style={styles.sectionHeaderHint}>Blended with music</Text>
                </View>

                <View style={styles.ambienceCardsRow}>
                  {/* Card 1: Chayakada */}
                  <LinearGradient
                    colors={['rgba(30, 27, 75, 0.7)', 'rgba(15, 23, 42, 0.9)']}
                    style={styles.ambientCard}>
                    <View style={[styles.ambientCardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                      <Ionicons name="cafe" size={16} color="#A78BFA" />
                    </View>
                    <Text style={styles.ambientCardName}>ചായക്കട</Text>
                    <Text style={styles.ambientCardDesc}>Rain & stove fire</Text>
                  </LinearGradient>

                  {/* Card 2: Bus */}
                  <LinearGradient
                    colors={['rgba(24, 34, 69, 0.7)', 'rgba(15, 23, 42, 0.9)']}
                    style={styles.ambientCard}>
                    <View style={[styles.ambientCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                      <Ionicons name="bus" size={16} color="#60A5FA" />
                    </View>
                    <Text style={styles.ambientCardName}>ബസ് യാത്ര</Text>
                    <Text style={styles.ambientCardDesc}>KSRTC window rain</Text>
                  </LinearGradient>

                  {/* Card 3: Train */}
                  <LinearGradient
                    colors={['rgba(20, 50, 45, 0.7)', 'rgba(15, 23, 42, 0.9)']}
                    style={styles.ambientCard}>
                    <View style={[styles.ambientCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Ionicons name="train" size={16} color="#34D399" />
                    </View>
                    <Text style={styles.ambientCardName}>ട്രെയിൻ</Text>
                    <Text style={styles.ambientCardDesc}>Rail rhythm & wind</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Action Login Section: ONLY Google + Guest */}
              <View style={styles.actionSection}>
                {/* Guest Expired Alert Banner */}
                {isGuestExpired && (
                  <View style={styles.expiredBanner}>
                    <View style={styles.expiredHeaderRow}>
                      <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                      <Text style={styles.expiredTitle}>Your guest session has expired.</Text>
                    </View>
                    <Text style={styles.expiredDesc}>
                      10 minutes completed. Sign in with Google to keep listening without limits, or start a new 10-minute guest session.
                    </Text>
                  </View>
                )}

                {/* 1. Continue with Google */}
                <Pressable
                  style={({ pressed }) => [
                    styles.googleBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleGoogleLogin}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.googleBtnGradient}>
                    <View style={styles.googleIconCircle}>
                      <Ionicons name="logo-google" size={18} color="#EA4335" />
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                    <Ionicons name="arrow-forward" size={16} color="#1E293B" />
                  </LinearGradient>
                </Pressable>

                {/* ──────── OR ──────── */}
                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* 2. Continue as Guest */}
                <Pressable
                  style={({ pressed }) => [
                    styles.guestBtn,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleGuest}>
                  <Ionicons name="headset-outline" size={16} color="#A78BFA" />
                  <Text style={styles.guestBtnText}>Continue as Guest</Text>
                  <View style={styles.guestLimitBadge}>
                    <Text style={styles.guestLimitText}>10 min</Text>
                  </View>
                </Pressable>

                {/* Trust Badges */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadge}>
                    <Ionicons name="flash" size={11} color="#A78BFA" />
                    <Text style={styles.trustBadgeText}>Instant Play</Text>
                  </View>
                  <View style={styles.trustBadgeDot} />
                  <View style={styles.trustBadge}>
                    <Ionicons name="checkmark-circle" size={11} color="#34D399" />
                    <Text style={styles.trustBadgeText}>No Credit Card</Text>
                  </View>
                  <View style={styles.trustBadgeDot} />
                  <View style={styles.trustBadge}>
                    <Ionicons name="infinite" size={11} color="#60A5FA" />
                    <Text style={styles.trustBadgeText}>Zero Ads</Text>
                  </View>
                </View>

                {/* Terms and Privacy notice */}
                <Text style={styles.termsText}>
                  By joining, you agree to ELWO&apos;s Terms & Privacy Policy
                </Text>

                {/* Developer Tag */}
                <View style={styles.developerBadge}>
                  <Ionicons name="code-slash" size={11} color="#A78BFA" />
                  <Text style={styles.developerText}>Developed by arjyouhub</Text>
                </View>
              </View>
            </>
          ) : (
            /* Language Selection Step */
            <View style={styles.langStepContainer}>
              <View style={styles.langHeaderSection}>
                <View style={styles.langIconBox}>
                  <Ionicons name="globe-outline" size={28} color="#A78BFA" />
                </View>
                <Text style={styles.langTitle}>What do you want to listen to?</Text>
                <Text style={styles.langSubtitleMalayalam}>നിങ്ങളുടെ സംഗീത ഭാഷകൾ തിരഞ്ഞെടുക്കുക</Text>
                <Text style={styles.langDescription}>
                  Select your languages. The <Text style={{ color: '#F59E0B', fontWeight: '800' }}>1st selected language</Text> will load automatically on your Home feed!
                </Text>
              </View>

              {/* Language Cards */}
              <View style={styles.langCardsList}>
                {LANGUAGE_OPTIONS.map((opt) => {
                  const selectedIndex = selectedLanguages.indexOf(opt.id);
                  const isSelected = selectedIndex !== -1;
                  const isPrimary = selectedIndex === 0;

                  return (
                    <Pressable
                      key={opt.id}
                      style={({ pressed }) => [
                        styles.langCard,
                        isSelected && styles.langCardSelected,
                        isPrimary && styles.langCardPrimary,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                      ]}
                      onPress={() => toggleLanguage(opt.id)}>
                      <View style={styles.langCardLeft}>
                        <View
                          style={[
                            styles.langCardIconBox,
                            isSelected && { backgroundColor: isPrimary ? 'rgba(245, 158, 11, 0.2)' : 'rgba(139, 92, 246, 0.2)' },
                          ]}>
                          <Ionicons
                            name={opt.icon}
                            size={20}
                            color={isPrimary ? '#F59E0B' : isSelected ? '#A78BFA' : '#94A3B8'}
                          />
                        </View>
                        <View style={styles.langCardInfo}>
                          <View style={styles.langNameRow}>
                            <Text style={styles.langNameText}>{opt.name}</Text>
                            <Text style={styles.langNativeText}>{opt.nativeName}</Text>
                          </View>
                          <Text style={styles.langSubtitleText} numberOfLines={1}>
                            {opt.subtitle}
                          </Text>
                        </View>
                      </View>

                      {/* Rank Indicator / Checkbox */}
                      <View style={styles.langBadgeContainer}>
                        {isSelected ? (
                          isPrimary ? (
                            <View style={styles.primaryBadge}>
                              <Ionicons name="star" size={11} color="#1E1B4B" />
                              <Text style={styles.primaryBadgeText}>#1 HOME</Text>
                            </View>
                          ) : (
                            <View style={styles.rankBadge}>
                              <Text style={styles.rankBadgeText}>#{selectedIndex + 1}</Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.unselectedCircle}>
                            <Ionicons name="add" size={14} color="#64748B" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selection Counter */}
              <View style={styles.counterRow}>
                <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                <Text style={styles.counterText}>
                  {selectedLanguages.length === 0
                    ? 'Tap on a language to choose your preference (max 3)'
                    : `${selectedLanguages.length}/3 selected • First chosen is Home default`}
                </Text>
              </View>

              {/* Finish Continue Button */}
              <Pressable
                disabled={selectedLanguages.length === 0}
                style={({ pressed }) => [
                  styles.continueBtn,
                  selectedLanguages.length === 0 && styles.continueBtnDisabled,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleFinishLanguage}>
                <LinearGradient
                  colors={
                    selectedLanguages.length > 0
                      ? ['#8B5CF6', '#6366F1', '#4F46E5']
                      : ['#334155', '#1E293B']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueBtnGradient}>
                  <Text
                    style={[
                      styles.continueBtnText,
                      selectedLanguages.length === 0 && { color: '#94A3B8' },
                    ]}>
                    {selectedLanguages.length > 0
                      ? `Start Listening with ${selectedLanguages[0]}`
                      : 'Select at least 1 language'}
                  </Text>
                  {selectedLanguages.length > 0 && (
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </Pressable>

              {/* Switch back to Auth option */}
              <Pressable
                style={styles.backToAuthBtn}
                onPress={() => setStep('auth')}>
                <Text style={styles.backToAuthText}>Change login method</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050711',
  },
  glowOrbPrimary: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
  },
  glowOrbSecondary: {
    position: 'absolute',
    top: 240,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  glowOrbEmerald: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoGradientBox: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 8,
  },
  waveBar: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.dark.accentViolet,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 2,
  },
  appTagline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 4,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroPillAccent: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  heroPillTextAccent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 0.5,
  },
  showcaseSection: {
    marginTop: 10,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  sectionHeaderHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  ambienceCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ambientCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ambientCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ambientCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ambientCardDesc: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 8,
    gap: 10,
  },
  expiredBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginBottom: 4,
  },
  expiredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FBBF24',
  },
  expiredDesc: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  googleBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  googleBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  guestBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  guestLimitBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  guestLimitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  trustBadgeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  termsText: {
    fontSize: 10,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
  developerBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  developerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
    letterSpacing: 0.3,
  },
  // Language Selection Step Styles
  langStepContainer: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  langHeaderSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  langIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  langTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  langSubtitleMalayalam: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A78BFA',
    textAlign: 'center',
    marginBottom: 8,
  },
  langDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  langCardsList: {
    gap: 12,
    marginBottom: 20,
  },
  langCard: {
    backgroundColor: 'rgba(30, 27, 75, 0.45)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  langCardSelected: {
    backgroundColor: 'rgba(76, 29, 149, 0.35)',
    borderColor: '#8B5CF6',
  },
  langCardPrimary: {
    backgroundColor: 'rgba(120, 53, 15, 0.35)',
    borderColor: '#F59E0B',
  },
  langCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  langCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCardInfo: {
    flex: 1,
  },
  langNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  langNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  langNativeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  langSubtitleText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  langBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: 0.5,
  },
  rankBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unselectedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  counterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToAuthBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backToAuthText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});
