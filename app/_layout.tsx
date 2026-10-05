import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PlayerProvider } from '../src/store/PlayerContext';
import { ChayakadaProvider } from '../src/store/ChayakadaContext';
import { LibraryProvider } from '../src/store/LibraryContext';
import { PreferencesProvider } from '../src/store/PreferencesContext';
import { AuthProvider } from '../src/store/AuthContext';
import { LogBox } from 'react-native';
import { Colors } from '../src/constants/theme';

import { AddToPlaylistModal } from '../src/components/common/AddToPlaylistModal';

LogBox.ignoreLogs([
  'Failed to activate lock screen controls',
  'Cannot update lock screen metadata',
  'expo-audio playback service',
]);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.primary,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <LibraryProvider>
            <PlayerProvider>
              <ChayakadaProvider>
                <ThemeProvider value={CustomDarkTheme}>
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: Colors.dark.background },
                      animation: 'slide_from_right',
                    }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="playlist/[id]"
                      options={{ headerShown: false, animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen
                      name="album/[id]"
                      options={{ headerShown: false, animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen
                      name="artist/[id]"
                      options={{ headerShown: false, animation: 'slide_from_bottom' }}
                    />
                  </Stack>
                  <AddToPlaylistModal />
                </ThemeProvider>
              </ChayakadaProvider>
            </PlayerProvider>
          </LibraryProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
