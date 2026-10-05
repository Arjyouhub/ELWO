import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { MusicLanguage } from '../../types/music';

interface LanguageOnboardingModalProps {
  visible: boolean;
  onComplete: (selectedLanguages: MusicLanguage[], defaultLanguage: MusicLanguage) => void;
}

interface LanguageOption {
  id: MusicLanguage;
  name: string;
  nativeName: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { id: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം', subtitle: 'Aavesham, Sushin, Vineeth...', icon: 'musical-note' },
  { id: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்', subtitle: 'Anirudh, Rahman, Yuvan...', icon: 'flame' },
  { id: 'Hindi', name: 'Hindi', nativeName: 'हिन्दी', subtitle: 'Arijit, Pritam, Bollywood...', icon: 'heart' },
  { id: 'English', name: 'English', nativeName: 'Global', subtitle: 'The Weeknd, Dua Lipa, Pop...', icon: 'globe' },
];

export const LanguageOnboardingModal: React.FC<LanguageOnboardingModalProps> = ({
  visible,
  onComplete,
}) => {
  // Store ordered list of selected languages; the first selected is the default
  const [selectedList, setSelectedList] = useState<MusicLanguage[]>([]);

  const toggleLanguage = (lang: MusicLanguage) => {
    if (selectedList.includes(lang)) {
      setSelectedList((prev) => prev.filter((l) => l !== lang));
    } else {
      setSelectedList((prev) => [...prev, lang]);
    }
  };

  const handleConfirm = () => {
    if (selectedList.length === 0) return;
    const defaultLang = selectedList[0];
    onComplete(selectedList, defaultLang);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="radio" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>What music moves you?</Text>
            <Text style={styles.subtitle}>
              Select your languages. The first one you pick will be your default home language.
            </Text>
          </View>

          {/* Languages Grid */}
          <ScrollView
            style={styles.optionsList}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}>
            {AVAILABLE_LANGUAGES.map((item) => {
              const selectedIndex = selectedList.indexOf(item.id);
              const isSelected = selectedIndex !== -1;
              const isDefault = selectedIndex === 0;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardSelected,
                    isDefault && styles.langCardDefault,
                  ]}
                  onPress={() => toggleLanguage(item.id)}>
                  <View style={styles.langLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        isSelected && styles.iconCircleSelected,
                      ]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? '#FFFFFF' : Colors.dark.textSecondary}
                      />
                    </View>
                    <View>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.langName,
                            isSelected && styles.langNameSelected,
                          ]}>
                          {item.name}
                        </Text>
                        <Text style={styles.nativeName}>• {item.nativeName}</Text>
                      </View>
                      <Text style={styles.langSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>

                  {/* Indicator Badge */}
                  <View style={styles.badgeWrapper}>
                    {isDefault ? (
                      <View style={styles.defaultPill}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.defaultPillText}>DEFAULT</Text>
                      </View>
                    ) : isSelected ? (
                      <View style={styles.orderCircle}>
                        <Text style={styles.orderText}>#{selectedIndex + 1}</Text>
                      </View>
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              style={[
                styles.confirmBtn,
                selectedList.length === 0 && { opacity: 0.45 },
              ]}
              disabled={selectedList.length === 0}
              onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>
                {selectedList.length === 0
                  ? 'Choose your primary language'
                  : `Set Default to ${selectedList[0]} & Continue`}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0E1428',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    ...Shadows.player,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionsContent: {
    gap: 10,
    paddingVertical: 4,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  langCardSelected: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  langCardDefault: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: Colors.dark.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  langNameSelected: {
    color: '#FFFFFF',
  },
  nativeName: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  langSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  badgeWrapper: {
    marginLeft: 8,
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orderCircle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 0.5,
    borderColor: Colors.dark.primary,
  },
  orderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  footer: {
    marginTop: Spacing.lg,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.glow(Colors.dark.primaryGlow),
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
