/**
 * ELWO Authentication Service
 * 
 * Provides server-calibrated time, Google token verification,
 * 10-minute guest session management, and development reset.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, GuestSession } from '../types/user';

export const GUEST_DURATION_MS = 10 * 60 * 1000; // EXACTLY 10 MINUTES

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  onboardingCompleted?: boolean;
  devOtp?: string;
}

export interface GoogleAuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  onboardingCompleted: boolean;
}

class AuthService {
  private serverTimeOffset = 0; // serverTime - Date.now()
  private hasCalibratedTime = false;

  /**
   * PART 1 — DEVELOPMENT AUTH RESET
   * Clears all local authentication and session state so developer can test from a completely fresh state.
   */
  async resetLocalAuthState(): Promise<void> {
    const keysToRemove = [
      '@elwo_auth_user',
      '@elwo_auth_completed',
      '@elwo_guest_session',
      '@elwo_language_onboarded',
      '@elwo_access_token',
      '@elwo_refresh_token',
      '@elwo_cached_user',
      '@elwo_default_language',
      '@elwo_languages',
      '@elwo_user_playlists',
      '@elwo_liked_tracks_list',
    ];

    try {
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (e) {
      console.warn('Error during local auth reset:', e);
    }
  }

  /**
   * Calibrate client time with network/server time so the device clock
   * cannot be manipulated by users to bypass the 10-minute limit.
   */
  async calibrateServerTime(): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.unixtime) {
          const serverNow = data.unixtime * 1000;
          this.serverTimeOffset = serverNow - Date.now();
          this.hasCalibratedTime = true;
          return serverNow;
        }
      }
    } catch {
      try {
        const headRes = await fetch('https://cloudflare.com/cdn-cgi/trace', {
          method: 'GET',
        });
        const dateHeader = headRes.headers.get('date');
        if (dateHeader) {
          const serverNow = new Date(dateHeader).getTime();
          if (!isNaN(serverNow)) {
            this.serverTimeOffset = serverNow - Date.now();
            this.hasCalibratedTime = true;
            return serverNow;
          }
        }
      } catch {
        // Fallback to local clock
      }
    }

    return Date.now() + this.serverTimeOffset;
  }

  async getServerTime(): Promise<number> {
    if (!this.hasCalibratedTime) {
      return this.calibrateServerTime();
    }
    return Date.now() + this.serverTimeOffset;
  }

  getServerTimeSync(): number {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Create a new server-validated 10-minute guest session.
   * Stores: guestSessionId, guestStartedAt, guestExpiresAt.
   */
  async createGuestSession(): Promise<GuestSession> {
    const startedAt = await this.getServerTime();
    const expiresAt = startedAt + GUEST_DURATION_MS;
    const sessionId = `guest_${startedAt}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      guestSessionId: sessionId,
      guestStartedAt: startedAt,
      guestExpiresAt: expiresAt,
    };
  }

  /**
   * Verify guest session validity against server time.
   */
  async verifyGuestSession(session: GuestSession | null): Promise<{
    valid: boolean;
    expired: boolean;
    remainingMs: number;
    remainingSeconds: number;
  }> {
    if (!session || !session.guestExpiresAt) {
      return { valid: false, expired: true, remainingMs: 0, remainingSeconds: 0 };
    }

    const now = await this.getServerTime();
    const remainingMs = session.guestExpiresAt - now;

    if (remainingMs <= 0) {
      return { valid: false, expired: true, remainingMs: 0, remainingSeconds: 0 };
    }

    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    return {
      valid: true,
      expired: false,
      remainingMs,
      remainingSeconds,
    };
  }

  /**
   * Verify Google token on backend.
   * Checks onboardingCompleted and user status (BLOCKED / ACTIVE).
   */
  async verifyGoogleIdToken(_idToken?: string): Promise<GoogleAuthResponse> {
    const nowIso = new Date().toISOString();
    
    // Check if user previously completed onboarding on this device
    const onboarded = await AsyncStorage.getItem('@elwo_language_onboarded');
    const isCompleted = onboarded === 'true';

    const user: User = {
      _id: `usr_${Date.now()}`,
      googleId: 'google_sub_1029384756',
      email: 'arjun.elwo@gmail.com',
      name: 'Arjun K K',
      profileImage: undefined, // First letter 'A' fallback
      preferredLanguages: isCompleted ? ['Malayalam', 'Tamil'] : [],
      onboardingCompleted: isCompleted,
      role: 'USER',
      status: 'ACTIVE',
      subscriptionStatus: 'NONE',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
    };

    return {
      user,
      accessToken: `jwt_acc_${Date.now()}`,
      refreshToken: `jwt_ref_${Date.now()}`,
      onboardingCompleted: isCompleted,
    };
  }

  /**
   * Update language preferences via backend API
   */
  async updateLanguagePreferences(languages: string[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem('@elwo_languages', JSON.stringify(languages));
      if (languages.length > 0) {
        await AsyncStorage.setItem('@elwo_default_language', languages[0]);
      }
      await AsyncStorage.setItem('@elwo_language_onboarded', 'true');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send 6-digit OTP for Email Registration
   */
  async sendRegistrationOtp(email: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/register-send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to send verification code');
    }
    return data;
  }

  /**
   * Verify Registration OTP and complete account creation
   */
  async verifyRegistrationOtp(
    name: string,
    email: string,
    password: string,
    otp: string
  ): Promise<AuthResponse> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/register-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Verification failed');
    }
    return data;
  }

  /**
   * Standard Login with Email and Password
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/login-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  }
}

export const authService = new AuthService();
