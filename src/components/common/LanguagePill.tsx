import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { MusicLanguage } from '../../types/music';

interface LanguagePillProps {
  selectedLanguage: MusicLanguage;
  onSelectLanguage: (lang: MusicLanguage) => void;
}

const LANGUAGES: MusicLanguage[] = ['All', 'Malayalam', 'Tamil', 'Hindi', 'English'];

export const LanguagePills: React.FC<LanguagePillProps> = ({
  selectedLanguage,
  onSelectLanguage,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={styles.container}>
      {LANGUAGES.map((lang) => {
        const isSelected = selectedLanguage === lang;
        return (
          <Pressable
            key={lang}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelectLanguage(lang)}>
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {lang}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  pillSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  pillText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
