import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../store/AuthContext';
import { useChayakada } from '../../store/ChayakadaContext';

interface ELWOHeaderProps {
  greeting?: string;
  subtitle?: string;
  showProfile?: boolean;
}

export const ELWOHeader: React.FC<ELWOHeaderProps> = ({
  greeting,
  subtitle,
  showProfile = true,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleBanner, isBannerVisible, isAmbientPlaying, getActiveSoundsCount } = useChayakada();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }]}>
      {/* Brand Bar */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          {/* ELWO Custom Geometric Audio Emblem */}
          <View style={styles.logoBadge}>
            <View style={styles.logoDot} />
            <Ionicons name="radio" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>ELWO</Text>
          </View>
        </View>

        {/* Header Right Actions */}
        <View style={styles.actionsRight}>
          {/* Ambience Quick Trigger (Toggles Ambience Box below!) */}
          <Pressable
            hitSlop={8}
            onPress={toggleBanner}
            style={[
              styles.ambienceBtn,
              (isBannerVisible || isAmbientPlaying) && styles.ambienceBtnActive,
            ]}>
              <Ionicons
                name="headset"
                size={14}
                color={isBannerVisible || isAmbientPlaying ? '#FFFFFF' : Colors.dark.primary}
              />
              <Text
                style={[
                  styles.ambienceBtnText,
                  (isBannerVisible || isAmbientPlaying) && styles.ambienceBtnTextActive,
                ]}>
                Ambience{isAmbientPlaying ? ` (${getActiveSoundsCount()})` : ''}
              </Text>
            </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => router.push('/(tabs)/search')}
            style={styles.iconButton}>
            <Ionicons name="search" size={18} color={Colors.dark.textSecondary} />
          </Pressable>

          {showProfile && (
            <Pressable
              hitSlop={10}
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatarButton}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Dynamic Contextual Greeting */}
      {greeting ? (
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{greeting}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.secondary,
  },
  brandTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.primary,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.dark.primary,
    letterSpacing: 0.8,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    flexShrink: 0,
  },
  ambienceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  ambienceBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  ambienceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
    letterSpacing: 0.2,
  },
  ambienceBtnTextActive: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  greetingContainer: {
    marginTop: Spacing.xs,
  },
  greetingText: {
    ...Typography.hero,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.4,
  },
  subtitleText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
});
