import type { RequestEventBase } from '@builder.io/qwik-city';
import { mutateDatabase, readDatabase } from './db';
import { ApiError } from './http';
import { AuthChallenge, OAuthProviderName, User, UserPreference } from './types';
import { createId, createToken, nowIso, toDateOrNull } from './utils';

const SESSION_COOKIE_NAME = 'health_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const THIRTY_DAYS_MS = SESSION_MAX_AGE_SECONDS * 1000;
const TWO_FACTOR_CHALLENGE_COOKIE = 'health_2fa_challenge';
const TWO_FACTOR_CHALLENGE_MAX_AGE_SECONDS = 60 * 10;
const TWO_FACTOR_CHALLENGE_MAX_AGE_MS = TWO_FACTOR_CHALLENGE_MAX_AGE_SECONDS * 1000;

function getCookieSecure(event: RequestEventBase) {
  return event.url.protocol === 'https:';
}

export async function createSession(event: RequestEventBase, userId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS).toISOString();
  const session = {
    id: createId(),
    userId,
    csrfToken: createToken(24),
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt
  };

  await mutateDatabase(async (db) => {
    db.sessions = db.sessions.filter((entry) => entry.userId !== userId);
    db.sessions.push(session);
  });

  event.cookie.set(SESSION_COOKIE_NAME, session.id, {
    path: '/',
    httpOnly: true,
    secure: getCookieSecure(event),
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return session;
}

export async function clearSession(event: RequestEventBase) {
  const sessionId = event.cookie.get(SESSION_COOKIE_NAME)?.value;

  await mutateDatabase(async (db) => {
    if (!sessionId) return;
    db.sessions = db.sessions.filter((entry) => entry.id !== sessionId);
  });

  event.cookie.delete(SESSION_COOKIE_NAME, {
    path: '/'
  });
}

export async function getSession(event: RequestEventBase) {
  const sessionId = event.cookie.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return null;
  }

  const now = new Date();
  const db = await readDatabase();
  const session = db.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    event.cookie.delete(SESSION_COOKIE_NAME, { path: '/' });
    return null;
  }

  const expiresAt = toDateOrNull(session.expiresAt);
  const lastSeenAt = toDateOrNull(session.lastSeenAt);

  if (!expiresAt || !lastSeenAt || expiresAt.getTime() <= now.getTime()) {
    await clearSession(event);
    return null;
  }

  if (now.getTime() - lastSeenAt.getTime() > THIRTY_DAYS_MS) {
    await clearSession(event);
    return null;
  }

  const user = db.users.find((entry) => entry.id === session.userId);
  if (!user) {
    await clearSession(event);
    return null;
  }

  const nextLastSeenAt = nowIso();
  const nextExpiresAt = new Date(now.getTime() + THIRTY_DAYS_MS).toISOString();

  await mutateDatabase(async (mutating) => {
    const target = mutating.sessions.find((entry) => entry.id === session.id);
    if (target) {
      target.lastSeenAt = nextLastSeenAt;
      target.expiresAt = nextExpiresAt;
    }
  });

  return {
    ...session,
    lastSeenAt: nextLastSeenAt,
    expiresAt: nextExpiresAt,
    user
  };
}

export async function requireAuth(event: RequestEventBase) {
  const auth = await getSession(event);
  if (!auth) {
    throw new ApiError(401, 'Unauthorized', 'unauthorized');
  }
  return auth;
}

export function assertCsrf(event: RequestEventBase, csrfToken: string) {
  const method = event.request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  const requestToken = event.request.headers.get('x-csrf-token');
  if (!requestToken || requestToken !== csrfToken) {
    throw new ApiError(403, 'CSRF token mismatch', 'csrf_mismatch');
  }
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    hasAdminApiKey: Boolean(user.adminApiKey),
    oauthProviders: user.oauthProviders,
    twoFactorEnabled: Boolean(user.twoFactor?.enabled),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    appleHealthConsent: user.appleHealthConsent,
    lastAppleHealthSyncAt: user.lastAppleHealthSyncAt
  };
}

export async function ensureDefaultPreferences(userId: string): Promise<UserPreference> {
  return mutateDatabase(async (db) => {
    const existing = db.userPreferences.find((entry) => entry.userId === userId);
    if (existing) {
      return existing;
    }

    const preference: UserPreference = {
      id: createId(),
      userId,
      weightUnit: 'kg',
      distanceUnit: 'km',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    db.userPreferences.push(preference);
    return preference;
  });
}

export async function logAuditEvent(userId: string, eventType: import('./types').AuditLogEvent, metadata: Record<string, unknown> = {}) {
  await mutateDatabase(async (db) => {
    db.auditLogs.push({
      id: createId(),
      userId,
      eventType,
      metadata,
      createdAt: nowIso()
    });
  });
}

export async function upsertOAuthUser(provider: OAuthProviderName, email: string, sub: string): Promise<User> {
  return mutateDatabase(async (db) => {
    const normalizedEmail = email.trim().toLowerCase();
    let user = db.users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      const isFirstUser = db.users.length === 0;
      user = {
        id: createId(),
        email: normalizedEmail,
        passwordHash: null,
        oauthProviders: {
          [provider]: { sub, email: normalizedEmail }
        },
        twoFactor: {
          enabled: false,
          secret: null,
          pendingSecret: null,
          enabledAt: null,
          recoveryCodes: []
        },
        role: isFirstUser ? 'admin' : 'customer',
        adminApiKey: isFirstUser ? createId() : null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        appleHealthConsent: false,
        lastAppleHealthSyncAt: null
      };
      db.users.push(user);
    } else {
      user.oauthProviders[provider] = { sub, email: normalizedEmail };
      user.updatedAt = nowIso();
    }

    return user;
  });
}

export async function createTwoFactorChallenge(event: RequestEventBase, userId: string, method: AuthChallenge['method'], provider: OAuthProviderName | null) {
  const now = new Date();
  const challenge: AuthChallenge = {
    id: createId(),
    userId,
    method,
    provider,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TWO_FACTOR_CHALLENGE_MAX_AGE_MS).toISOString()
  };

  await mutateDatabase(async (db) => {
    const nowMs = Date.now();
    db.authChallenges = db.authChallenges.filter((entry) => {
      const expiresAt = toDateOrNull(entry.expiresAt);
      return Boolean(expiresAt && expiresAt.getTime() > nowMs && entry.userId !== userId);
    });
    db.authChallenges.push(challenge);
  });

  event.cookie.set(TWO_FACTOR_CHALLENGE_COOKIE, challenge.id, {
    path: '/',
    httpOnly: true,
    secure: getCookieSecure(event),
    sameSite: 'lax',
    maxAge: TWO_FACTOR_CHALLENGE_MAX_AGE_SECONDS
  });

  return challenge;
}

export async function consumeTwoFactorChallenge(event: RequestEventBase, challengeId: string) {
  const cookieChallengeId = event.cookie.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  if (!cookieChallengeId || cookieChallengeId !== challengeId) {
    throw new ApiError(401, 'Two-factor challenge mismatch', 'two_factor_challenge_mismatch');
  }

  const db = await readDatabase();
  const challenge = db.authChallenges.find((entry) => entry.id === challengeId);
  if (!challenge) {
    throw new ApiError(401, 'Two-factor challenge not found', 'two_factor_challenge_missing');
  }

  const expiresAt = toDateOrNull(challenge.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    await clearTwoFactorChallenge(event, challengeId);
    throw new ApiError(401, 'Two-factor challenge expired', 'two_factor_challenge_expired');
  }

  const user = db.users.find((entry) => entry.id === challenge.userId);
  if (!user) {
    await clearTwoFactorChallenge(event, challengeId);
    throw new ApiError(401, 'User not found for two-factor challenge', 'two_factor_user_missing');
  }

  return {
    challenge,
    user
  };
}

export async function clearTwoFactorChallenge(event: RequestEventBase, challengeId: string) {
  await mutateDatabase(async (db) => {
    db.authChallenges = db.authChallenges.filter((entry) => entry.id !== challengeId);
  });

  event.cookie.delete(TWO_FACTOR_CHALLENGE_COOKIE, {
    path: '/'
  });
}

export function sessionCookieName() {
  return SESSION_COOKIE_NAME;
}
