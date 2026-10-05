import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MusicLanguage } from '../../types/music';

interface ELWOLanguageSelectorProps {
  selectedLanguage: MusicLanguage;
  onSelectLanguage: (language: MusicLanguage) => void;
  onOpenPreferences?: () => void;
}

const LANGUAGES: MusicLanguage[] = ['All', 'Malayalam', 'Tamil', 'Hindi', 'English'];

export const ELWOLanguageSelector: React.FC<ELWOLanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onOpenPreferences,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        bounces={false}>
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang;
          return (
            <Pressable
              key={lang}
              onPress={() => onSelectLanguage(lang)}
              style={[styles.pill, isSelected && styles.pillActive]}>
              {isSelected && <View style={styles.activeDot} />}
              <Text style={[styles.label, isSelected && styles.labelActive]}>
                {lang}
              </Text>
            </Pressable>
          );
        })}

        {onOpenPreferences && (
          <Pressable
            onPress={onOpenPreferences}
            style={styles.tuneButton}
            hitSlop={6}>
            <Ionicons name="options-outline" size={14} color={Colors.dark.primary} />
            <Text style={styles.tuneText}>Edit</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.xs,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
    gap: 8,
    alignItems: 'center',
    paddingRight: Spacing.xxl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 6,
  },
  pillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    borderColor: Colors.dark.primary,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.dark.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tuneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  tuneText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
});
