import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { usePreferences } from '../../src/store/PreferencesContext';
import { useAuth } from '../../src/store/AuthContext';
import { usePlayer } from '../../src/store/PlayerContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { EditProfileModal } from '../../src/components/common/EditProfileModal';
import { AuthModal } from '../../src/components/common/AuthModal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  
  const { user, isGuest, logout, showAuthModal, setShowAuthModal, guestRemainingSeconds } = useAuth();
  const { resetPlayerState } = usePlayer();
  const { clearLibrary } = useLibrary();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const {
    gaplessPlayback,
    setGaplessPlayback,
    crossfadeSeconds,
    setCrossfadeSeconds,
    dataSaver,
    setDataSaver,
    offlineCacheSizeMb,
    clearCache,
  } = usePreferences();

  const handleClearCache = () => {
    Alert.alert(
      'Clear Audio Cache',
      'This will remove cached offline audio files to free up disk space.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCache },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of ELWO?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            resetPlayerState();
            clearLibrary();
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset + 6 }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: 840, width: '100%', alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.editAvatarBadge}
              onPress={() => setIsEditModalVisible(true)}
              hitSlop={8}>
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.userName}>
            {isGuest ? (user?.name === 'Guest Listener' ? 'Music Lover' : user?.name) : (user?.name || 'Music Lover')}
          </Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}

          {/* Edit Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.editProfileBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setIsEditModalVisible(true)}>
              <Ionicons name="create-outline" size={16} color={Colors.dark.primary} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </Pressable>

          {/* Guest Sign-in Promotion & Session Countdown */}
          {isGuest && (
            <View style={{ width: '100%', marginTop: Spacing.md }}>
              <View style={styles.guestTimerPill}>
                <Ionicons name="time" size={13} color="#F59E0B" />
                <Text style={styles.guestTimerText}>
                  Guest Session: {formatTimer(guestRemainingSeconds)} left (10 min preview)
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.guestPromoCard,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => setShowAuthModal(true)}>
                <View style={styles.guestPromoIcon}>
                  <Ionicons name="person-add" size={18} color={Colors.dark.primary} />
                </View>
                <View style={styles.guestPromoTextGroup}>
                  <Text style={styles.guestPromoTitle}>Sign In / Create Account</Text>
                  <Text style={styles.guestPromoSubtitle}>
                    Unlock unlimited listening & sync across devices
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Ultra HD</Text>
              <Text style={styles.statLabel}>Studio Lossless</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Zero Ads</Text>
              <Text style={styles.statLabel}>Ad-Free Stream</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '2026'}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>

        {/* Playback Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback Experience</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Gapless Playback</Text>
                <Text style={styles.settingSubtitle}>
                  Seamless transition between album tracks without pauses
                </Text>
              </View>
              <Switch
                value={gaplessPlayback}
                onValueChange={setGaplessPlayback}
                trackColor={{ false: '#1E293B', true: Colors.dark.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Crossfade ({crossfadeSeconds}s)</Text>
                <Text style={styles.settingSubtitle}>
                  Fade out ending tracks smoothly into next tracks
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  setCrossfadeSeconds(crossfadeSeconds >= 6 ? 0 : crossfadeSeconds + 2)
                }
                style={styles.cycleBadge}>
                <Text style={styles.cycleBadgeText}>
                  {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds}s`}
                </Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Data Saver</Text>
                <Text style={styles.settingSubtitle}>
                  Optimize streaming bitrate when on cellular data
                </Text>
              </View>
              <Switch
                value={dataSaver}
                onValueChange={setDataSaver}
                trackColor={{ false: '#1E293B', true: Colors.dark.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Storage & Cache Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Storage</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Audio Cache</Text>
                <Text style={styles.settingSubtitle}>
                  {offlineCacheSizeMb} MB currently utilized on device
                </Text>
              </View>
              <Pressable onPress={handleClearCache} style={styles.clearCacheBtn}>
                <Text style={styles.clearCacheBtnText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Account & Logout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [
                styles.logoutRow,
                pressed && { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
              ]}
              onPress={handleLogout}>
              <View style={styles.logoutIconBox}>
                <Ionicons name="log-out-outline" size={20} color={Colors.dark.danger} />
              </View>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutTitle}>Log Out</Text>
                <Text style={styles.logoutSubtitle}>Sign out of your session</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* ELWO Branding & Version */}
        <View style={styles.aboutContainer}>
          <View style={styles.aboutLogoEmblem}>
            <Ionicons name="radio" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.aboutAppName}>ELWO MUSIC</Text>
          <Text style={styles.aboutVersion}>Unlimited background with zero ads premium</Text>
          <View style={styles.devBadge}>
            <Ionicons name="code-slash" size={13} color={Colors.dark.primary} />
            <Text style={styles.devBadgeText}>Developed by arjyouhub</Text>
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
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
    paddingTop: Spacing.xs,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: Colors.dark.primary,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 2.5,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.primary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#060814',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.dark.primary,
  },
  userRole: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginTop: 10,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  guestTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 8,
    alignSelf: 'center',
  },
  guestTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 0.2,
  },
  guestPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: 2,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    gap: 12,
  },
  guestPromoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPromoTextGroup: {
    flex: 1,
  },
  guestPromoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guestPromoSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.dark.border,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  settingSubtitle: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: Spacing.md,
  },
  cycleBadge: {
    backgroundColor: Colors.dark.cardHighlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cycleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  clearCacheBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearCacheBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.danger,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 12,
  },
  logoutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.danger,
  },
  logoutSubtitle: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  aboutLogoEmblem: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aboutAppName: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.dark.text,
    letterSpacing: 1.5,
  },
  aboutVersion: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginTop: 12,
  },
  devBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
    letterSpacing: 0.5,
  },
});
