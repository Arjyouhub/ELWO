import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showGreeting = false }) => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showGreeting ? (
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <Ionicons name="musical-notes" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.brandTextGroup}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>ELWO</Text>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>PREMIUM</Text>
                </View>
              </View>
              <Text style={styles.greeting}>Music & Soundscapes</Text>
            </View>
          </View>
        ) : (
          <>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </>
        )}
      </View>

      <View style={styles.rightActions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push('/(tabs)/search')}
          hitSlop={8}>
          <Ionicons name="search" size={22} color={Colors.dark.text} />
        </Pressable>

        <Pressable
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/profile')}
          hitSlop={8}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#1E2337', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
              </Text>
            </View>
          )}
          <View style={styles.activeDot} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  leftContainer: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.primary,
    letterSpacing: 0.8,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  username: {
    ...Typography.hero,
    color: Colors.dark.text,
    marginTop: 2,
  },
  title: {
    ...Typography.hero,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
});
