import { fetchApi } from './client';
import type { OAuthProviders } from './types';

type SessionResponse = {
  user: {
    id: string;
    email: string;
    role: 'customer' | 'coach' | 'admin';
    hasAdminApiKey: boolean;
    oauthProviders: OAuthProviders;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    appleHealthConsent: boolean;
    lastAppleHealthSyncAt: string | null;
  };
  csrfToken: string;
  expiresAt: string;
  preferences: {
    id: string;
    weightUnit: 'kg' | 'lbs';
    distanceUnit: 'km' | 'mi';
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type SessionData = SessionResponse;

export async function fetchSession() {
  return fetchApi<SessionResponse>('/api/auth/me');
}
