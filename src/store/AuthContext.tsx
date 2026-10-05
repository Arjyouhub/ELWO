import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, GUEST_DURATION_MS } from '../services/authService';
import { User, GuestSession } from '../types/user';

export type AuthState =
  | 'LOADING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'GUEST'
  | 'GUEST_EXPIRED';

interface AuthContextType {
  authState: AuthState;
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  isGuestExpired: boolean;
  isBlocked: boolean;
  guestSession: GuestSession | null;
  guestRemainingSeconds: number;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  loginWithGoogle: () => Promise<{ onboardingCompleted: boolean; user: User | null }>;
  sendRegistrationOtp: (email: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyRegistrationAndLogin: (name: string, email: string, password: string, otp: string) => Promise<{ onboardingCompleted: boolean; user: User | null }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ onboardingCompleted: boolean; user: User | null }>;
  continueAsGuest: () => Promise<void>;
  completeOnboarding: (languages: string[]) => Promise<void>;
  logout: () => Promise<void>;
  resetDevAuth: () => Promise<void>;
  updateProfile: (name: string, profileImage?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = '@elwo_auth_user';
const AUTH_COMPLETED_KEY = '@elwo_auth_completed';
const GUEST_SESSION_KEY = '@elwo_guest_session';
const ACCESS_TOKEN_KEY = '@elwo_access_token';
const REFRESH_TOKEN_KEY = '@elwo_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [user, setUser] = useState<User | null>(null);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [guestRemainingSeconds, setGuestRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleGuestExpired = useCallback(async () => {
    setAuthState('GUEST_EXPIRED');
    setUser(null);
    setGuestSession(null);
    setGuestRemainingSeconds(0);

    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_USER_KEY),
        AsyncStorage.removeItem(GUEST_SESSION_KEY),
      ]);
    } catch {}

    setShowAuthModal(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setGuestSession(null);
      setGuestRemainingSeconds(0);
      setAuthState('UNAUTHENTICATED');

      await Promise.all([
        AsyncStorage.removeItem(AUTH_USER_KEY),
        AsyncStorage.removeItem(AUTH_COMPLETED_KEY),
        AsyncStorage.removeItem(GUEST_SESSION_KEY),
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem('@elwo_recently_played'),
        AsyncStorage.removeItem('@elwo_liked_tracks_list'),
        AsyncStorage.removeItem('@elwo_user_listening_profile'),
      ]);

      setShowAuthModal(true);
    } catch (e) {
      console.warn('Error during logout:', e);
    }
  }, []);

  // Initialize auth session: restore stored user session immediately across restarts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedUserJson, storedSessionJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(GUEST_SESSION_KEY),
        ]);

        if (storedUserJson) {
          const parsedUser: User = JSON.parse(storedUserJson);

          // Check if blocked by admin
          if (parsedUser.status === 'BLOCKED') {
            await logout();
            return;
          }

          const isRegisteredUser = Boolean(
            parsedUser &&
            (parsedUser.email ||
             parsedUser.googleId ||
             (parsedUser._id && !parsedUser._id.startsWith('guest_')))
          );

          if (isRegisteredUser) {
            // Persistent Authenticated User session — stays logged in across restarts!
            setUser(parsedUser);
            setGuestSession(null);
            setGuestRemainingSeconds(0);
            setAuthState('AUTHENTICATED');
            setShowAuthModal(false);
            return;
          } else {
            // Guest User: Verify 10-minute expiration with calibrated server time
            try {
              await authService.calibrateServerTime();
            } catch (timeErr) {
              console.warn('Server time calibration skipped for guest:', timeErr);
            }

            const parsedSession: GuestSession | null = storedSessionJson
              ? JSON.parse(storedSessionJson)
              : null;

            const check = await authService.verifyGuestSession(parsedSession);

            if (check.valid && parsedSession) {
              // Valid guest session with time remaining preserved across restarts
              setUser(parsedUser);
              setGuestSession(parsedSession);
              setGuestRemainingSeconds(check.remainingSeconds);
              setAuthState('GUEST');
              setShowAuthModal(false);
            } else {
              // Guest session expired
              await handleGuestExpired();
            }
            return;
          }
        }

        // No session: fresh app state -> Login screen
        setAuthState('UNAUTHENTICATED');
        setUser(null);
        setGuestSession(null);
        setShowAuthModal(true);
      } catch (e) {
        console.warn('Error initializing authentication:', e);
        setAuthState('UNAUTHENTICATED');
        setShowAuthModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [handleGuestExpired, logout]);

  // Guest 10-minute countdown loop (stops when <= 0, triggers expiration)
  useEffect(() => {
    if (authState === 'GUEST' && guestSession) {
      const updateCountdown = () => {
        const now = authService.getServerTimeSync();
        const diffMs = guestSession.guestExpiresAt - now;
        const remaining = Math.max(0, Math.floor(diffMs / 1000));

        setGuestRemainingSeconds(remaining);

        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          handleGuestExpired();
        }
      };

      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [authState, guestSession, handleGuestExpired]);

  const loginWithGoogle = async (): Promise<{ onboardingCompleted: boolean; user: User | null }> => {
    try {
      setIsLoading(true);
      const res = await authService.verifyGoogleIdToken();

      if (res.user.status === 'BLOCKED') {
        alert('Your account has been blocked. Please contact support.');
        await logout();
        return { onboardingCompleted: false, user: null };
      }

      setUser(res.user);
      setGuestSession(null);
      setGuestRemainingSeconds(0);
      setAuthState('AUTHENTICATED');

      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)),
        AsyncStorage.setItem(AUTH_COMPLETED_KEY, 'true'),
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken),
        AsyncStorage.removeItem(GUEST_SESSION_KEY),
      ]);

      return {
        onboardingCompleted: res.onboardingCompleted,
        user: res.user,
      };
    } catch (e) {
      console.warn('Error during Google login:', e);
      return { onboardingCompleted: false, user: null };
    } finally {
      setIsLoading(false);
    }
  };

  const sendRegistrationOtp = async (email: string) => {
    return await authService.sendRegistrationOtp(email);
  };

  const verifyRegistrationAndLogin = async (
    name: string,
    email: string,
    password: string,
    otp: string
  ): Promise<{ onboardingCompleted: boolean; user: User | null }> => {
    try {
      setIsLoading(true);
      const res = await authService.verifyRegistrationOtp(name, email, password, otp);

      if (!res.user) {
        throw new Error(res.message || 'Registration failed');
      }

      setUser(res.user);
      setGuestSession(null);
      setGuestRemainingSeconds(0);
      setAuthState('AUTHENTICATED');

      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)),
        AsyncStorage.setItem(AUTH_COMPLETED_KEY, 'true'),
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken || ''),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken || ''),
        AsyncStorage.removeItem(GUEST_SESSION_KEY),
      ]);

      return {
        onboardingCompleted: !!res.onboardingCompleted,
        user: res.user,
      };
    } catch (e) {
      console.warn('Error during registration verification:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmailPassword = async (
    email: string,
    password: string
  ): Promise<{ onboardingCompleted: boolean; user: User | null }> => {
    try {
      setIsLoading(true);
      const res = await authService.loginWithEmail(email, password);

      if (!res.user) {
        throw new Error(res.message || 'Login failed');
      }

      if (res.user.status === 'BLOCKED') {
        alert('Your account has been blocked. Please contact support.');
        await logout();
        return { onboardingCompleted: false, user: null };
      }

      setUser(res.user);
      setGuestSession(null);
      setGuestRemainingSeconds(0);
      setAuthState('AUTHENTICATED');

      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user)),
        AsyncStorage.setItem(AUTH_COMPLETED_KEY, 'true'),
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken || ''),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken || ''),
        AsyncStorage.removeItem(GUEST_SESSION_KEY),
      ]);

      return {
        onboardingCompleted: !!res.onboardingCompleted,
        user: res.user,
      };
    } catch (e) {
      console.warn('Error during email login:', e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = async () => {
    try {
      setIsLoading(true);
      const session = await authService.createGuestSession();

      const nowIso = new Date().toISOString();
      const guestUser: User = {
        _id: session.guestSessionId,
        name: 'Guest Listener',
        preferredLanguages: [],
        onboardingCompleted: true,
        role: 'USER',
        status: 'ACTIVE',
        subscriptionStatus: 'NONE',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
      };

      setUser(guestUser);
      setGuestSession(session);
      setGuestRemainingSeconds(Math.floor(GUEST_DURATION_MS / 1000));
      setAuthState('GUEST');

      await Promise.all([
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(guestUser)),
        AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session)),
        AsyncStorage.setItem(AUTH_COMPLETED_KEY, 'true'),
      ]);
    } catch (e) {
      console.warn('Error starting guest session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (languages: string[]) => {
    if (!user) return;
    const updated: User = {
      ...user,
      preferredLanguages: languages,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setUser(updated);

    await authService.updateLanguagePreferences(languages);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  };


  // PART 1 — DEVELOPMENT AUTH RESET
  const resetDevAuth = async () => {
    setUser(null);
    setGuestSession(null);
    setGuestRemainingSeconds(0);
    setAuthState('UNAUTHENTICATED');
    await authService.resetLocalAuthState();
    await AsyncStorage.multiRemove([
      '@elwo_recently_played',
      '@elwo_liked_tracks_list',
      '@elwo_user_listening_profile',
    ]);
    setShowAuthModal(true);
  };

  const updateProfile = async (name: string, profileImage?: string) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      name: name.trim() || user.name,
      profileImage: profileImage !== undefined ? profileImage : user.profileImage,
      updatedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Error updating profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        isLoading,
        isLoggedIn: authState === 'AUTHENTICATED',
        isGuest: authState === 'GUEST',
        isGuestExpired: authState === 'GUEST_EXPIRED',
        isBlocked: user?.status === 'BLOCKED',
        guestSession,
        guestRemainingSeconds,
        showAuthModal,
        setShowAuthModal,
        loginWithGoogle,
        sendRegistrationOtp,
        verifyRegistrationAndLogin,
        loginWithEmailPassword,
        continueAsGuest,
        completeOnboarding,
        logout,
        resetDevAuth,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
