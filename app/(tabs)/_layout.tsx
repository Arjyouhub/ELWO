import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';
import { MiniPlayer } from '../../src/components/player/MiniPlayer';
import { FullScreenPlayerModal } from '../../src/components/player/FullScreenPlayerModal';
import { ChayakadaModal } from '../../src/components/chayakada/ChayakadaModal';

const TabIcon = ({
  focused,
  name,
  focusedName,
  color,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
  color: any;
}) => (
  <View style={styles.tabIconWrapper}>
    <Ionicons name={focused ? focusedName : name} size={22} color={color} />
    {focused && <View style={styles.activeTabGlowDot} />}
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Android safe-area insets calculation
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 10);
  const tabBarHeight = 58 + bottomInset;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: Colors.dark.tabIconDefault,
          tabBarStyle: {
            backgroundColor: '#080D1A',
            borderTopColor: 'rgba(139, 92, 246, 0.25)',
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            height: 48,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
            includeFontPadding: false,
            letterSpacing: 0.2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                name="radio-outline"
                focusedName="radio"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                name="search-outline"
                focusedName="search"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                name="albums-outline"
                focusedName="albums"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                name="person-outline"
                focusedName="person"
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* Docked Mini Player cleanly elevated above bottom tab navigation */}
      <View style={[styles.miniPlayerWrapper, { bottom: tabBarHeight + 5 }]}>
        <MiniPlayer />
      </View>

      {/* Immersive full screen player modal */}
      <FullScreenPlayerModal />

      {/* Nostalgic Kerala Chayakada ASMR Soundscape Modal */}
      <ChayakadaModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 26,
  },
  activeTabGlowDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.primary,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
