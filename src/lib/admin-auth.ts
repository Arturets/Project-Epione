import type { RequestEventBase } from '@builder.io/qwik-city';
import { mutateDatabase } from './db';
import { ApiError } from './http';
import { requireAuth } from './auth';
import { createId, nowIso } from './utils';

export async function requireAdminSession(event: RequestEventBase) {
  const auth = await requireAuth(event);
  if (auth.user.role !== 'admin') {
    throw new ApiError(403, 'Admin role required', 'admin_forbidden');
  }
  return auth;
}

export async function requireDeveloperAccess(event: RequestEventBase) {
  const auth = await requireAdminSession(event);

  const requestKey = event.request.headers.get('x-admin-key')?.trim() ?? '';
  if (!requestKey) {
    throw new ApiError(401, 'Missing X-Admin-Key header', 'admin_key_missing');
  }

  if (!auth.user.adminApiKey) {
    throw new ApiError(403, 'Admin API key not configured', 'admin_key_not_configured');
  }

  if (requestKey !== auth.user.adminApiKey) {
    throw new ApiError(403, 'Invalid admin API key', 'admin_key_invalid');
  }

  return auth;
}

export async function getOrCreateAdminApiKey(userId: string) {
  return mutateDatabase(async (db) => {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user || user.role !== 'admin') {
      throw new ApiError(403, 'Admin role required', 'admin_forbidden');
    }

    if (!user.adminApiKey) {
      user.adminApiKey = createId();
      user.updatedAt = nowIso();
    }

    return user.adminApiKey;
  });
}

export async function rotateAdminApiKey(userId: string) {
  return mutateDatabase(async (db) => {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user || user.role !== 'admin') {
      throw new ApiError(403, 'Admin role required', 'admin_forbidden');
    }

    user.adminApiKey = createId();
    user.updatedAt = nowIso();
    return user.adminApiKey;
  });
}
