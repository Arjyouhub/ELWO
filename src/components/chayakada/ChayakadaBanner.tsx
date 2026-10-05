import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { useChayakada } from '../../store/ChayakadaContext';
import { CHAYAKADA_PRESETS, BUS_PRESETS, TRAIN_PRESETS } from '../../constants/chayakadaData';

export const ChayakadaBanner: React.FC = () => {
  const {
    openModal,
    isAmbientPlaying,
    activePresetId,
    applyPreset,
    toggleMasterAmbient,
    getActiveSoundsCount,
    ambientTab,
    setAmbientTab,
    toggleBanner,
  } = useChayakada();

  const activeCount = getActiveSoundsCount();
  const currentPresets =
    ambientTab === 'train'
      ? TRAIN_PRESETS
      : ambientTab === 'bus'
      ? BUS_PRESETS
      : CHAYAKADA_PRESETS;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#0B1020', '#060814']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}>
        
        {/* Category Switcher Tabs: ചായക്കട, ബസ്, ട്രെയിൻ */}
        <View style={styles.categoryTabsRow}>
          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('chayakada')}
            style={[
              styles.categoryTab,
              ambientTab === 'chayakada' && styles.categoryTabActive,
            ]}>
            <Ionicons
              name="cafe"
              size={13}
              color={ambientTab === 'chayakada' ? '#FFFFFF' : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.categoryTabText,
                ambientTab === 'chayakada' && styles.categoryTabTextActive,
              ]}>
              Tea Stall
            </Text>
          </Pressable>

          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('bus')}
            style={[
              styles.categoryTab,
              ambientTab === 'bus' && styles.categoryTabActive,
            ]}>
            <Ionicons
              name="bus"
              size={13}
              color={ambientTab === 'bus' ? '#FFFFFF' : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.categoryTabText,
                ambientTab === 'bus' && styles.categoryTabTextActive,
              ]}>
              Bus Travel
            </Text>
          </Pressable>

          <Pressable
            hitSlop={6}
            onPress={() => setAmbientTab('train')}
            style={[
              styles.categoryTab,
              ambientTab === 'train' && styles.categoryTabActive,
            ]}>
            <Ionicons
              name="train"
              size={13}
              color={ambientTab === 'train' ? '#FFFFFF' : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.categoryTabText,
                ambientTab === 'train' && styles.categoryTabTextActive,
              ]}>
              Train
            </Text>
          </Pressable>
        </View>

        {/* Top Row: Title, Live Status and Play Controls */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => openModal(ambientTab)}
            style={styles.headerLeft}>
            <View style={[styles.headsetBadge, isAmbientPlaying && styles.headsetBadgeActive]}>
              <Ionicons
                name={ambientTab === 'train' ? 'train' : ambientTab === 'bus' ? 'bus' : 'headset'}
                size={18}
                color={isAmbientPlaying ? '#FFFFFF' : Colors.dark.primary}
              />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.keralaTitle}>
                  {ambientTab === 'train'
                    ? 'Train Ambience • Kerala Rail'
                    : ambientTab === 'bus'
                    ? 'Bus Ambience • Kerala Travel'
                    : 'Chayakada • Tea Stall'}
                </Text>
                {isAmbientPlaying && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>ACTIVE ({activeCount})</Text>
                  </View>
                )}
              </View>
              <Text numberOfLines={1} style={styles.subtext}>
                {isAmbientPlaying
                  ? `Only ${ambientTab === 'train' ? 'Train' : ambientTab === 'bus' ? 'Bus' : 'Chayakada'} playing`
                  : ambientTab === 'train'
                  ? 'Track rhythm, locomotive horn & rain'
                  : ambientTab === 'bus'
                  ? 'Engine, window rain, horn & highway breeze'
                  : 'Rain, stove fire, thunder & tea stall ambience'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.actionsRight}>
            <Pressable
              hitSlop={8}
              onPress={toggleMasterAmbient}
              style={[
                styles.iconBtn,
                isAmbientPlaying && styles.iconBtnActive,
              ]}>
              <Ionicons
                name={isAmbientPlaying ? 'pause' : 'play'}
                size={16}
                color={isAmbientPlaying ? '#FFFFFF' : Colors.dark.primary}
              />
            </Pressable>

            <Pressable
              hitSlop={8}
              onPress={toggleBanner}
              style={styles.closeBoxBtn}>
              <Ionicons name="close" size={16} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Presets Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsList}
          bounces={false}>
          {currentPresets.map((preset) => {
            const isSelected = activePresetId === preset.id && isAmbientPlaying;
            return (
              <Pressable
                key={preset.id}
                onPress={() => applyPreset(preset.id)}
                style={[
                  styles.presetChip,
                  isSelected && styles.presetChipActive,
                ]}>
                <Ionicons
                  name={preset.icon as any}
                  size={12}
                  color={isSelected ? '#FFFFFF' : Colors.dark.accentViolet}
                />
                <Text
                  style={[
                    styles.presetText,
                    isSelected && styles.presetTextActive,
                  ]}>
                  {preset.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Prominent "Customize All Sounds" Option Button */}
        <Pressable
          onPress={() => openModal(ambientTab)}
          style={({ pressed }) => [
            styles.customizeAllBtn,
            pressed && { opacity: 0.8 },
          ]}>
          <View style={styles.customizeAllLeft}>
            <Ionicons name="options" size={15} color={Colors.dark.primary} />
            <Text style={styles.customizeAllTitle}>
              Customize All Sounds ({ambientTab === 'train' ? 'Train' : ambientTab === 'bus' ? 'Bus' : 'Chayakada'})
            </Text>
          </View>
          <View style={styles.customizeAllRight}>
            <Text style={styles.customizeAllSub}>Mixer</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.dark.primary} />
          </View>
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardGradient: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headsetBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    flexShrink: 0,
  },
  headsetBadgeActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  keralaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.secondary,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.dark.secondary,
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  categorySwitchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  iconBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  closeBoxBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  openMixerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  openMixerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
  },
  presetsList: {
    gap: 8,
    paddingTop: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 24, 46, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  presetChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 9,
  },
  categoryTabActive: {
    backgroundColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customizeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 10,
  },
  customizeAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customizeAllTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  customizeAllRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customizeAllSub: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.accentViolet,
  },
});
