import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onPressSeeAll?: () => void;
  seeAllText?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  onPressSeeAll,
  seeAllText = 'See all',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onPressSeeAll && (
        <Pressable
          style={({ pressed }) => [styles.seeAllButton, pressed && styles.pressed]}
          onPress={onPressSeeAll}>
          <Text style={styles.seeAllText}>{seeAllText}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.dark.primary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    ...Typography.title1,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  seeAllText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
});
