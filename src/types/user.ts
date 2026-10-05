export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'GRACE_PERIOD'
  | 'ACCOUNT_HOLD'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'NONE';

export interface User {
  _id: string;
  googleId?: string;
  email?: string;
  name: string;
  profileImage?: string;
  preferredLanguages: string[];
  onboardingCompleted: boolean;
  role: UserRole;
  status: UserStatus;
  subscriptionStatus: SubscriptionStatus;
  subscriptionProductId?: string;
  subscriptionExpiry?: string | number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
}

export interface GuestSession {
  guestSessionId: string;
  guestStartedAt: number; // ms timestamp
  guestExpiresAt: number; // startedAt + 10 * 60 * 1000
}

/**
 * Helper to display appropriate contextual greeting based on user and time of day.
 * Returns: "Good morning, Arjun", "Good afternoon, Arjun", "Good evening, Arjun",
 * or "Welcome back" for guests or when name is unavailable.
 * Never displays "User", "Guest", "Unknown" or hardcoded fallback.
 */
export function getDisplayFirstName(user: { name?: string; isGuest?: boolean } | null | undefined): string {
  if (!user || user.isGuest) {
    return 'Welcome back';
  }

  const rawName = user.name?.trim();
  if (!rawName) {
    return 'Welcome back';
  }

  // Filter out unwanted generic placeholders
  const lower = rawName.toLowerCase();
  if (lower === 'user' || lower === 'guest' || lower === 'unknown' || lower === 'audiophile' || lower === 'guest listener') {
    return 'Welcome back';
  }

  const firstName = rawName.split(' ')[0];
  const hour = new Date().getHours();

  let timeGreeting: string;
  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeGreeting = 'Good evening';
  } else {
    timeGreeting = 'Good night';
  }

  return `${timeGreeting}, ${firstName}`;
}
