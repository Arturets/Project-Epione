import type { RequestHandler } from '@builder.io/qwik-city';
import { createSession, ensureDefaultPreferences, logAuditEvent, sanitizeUser } from '../../../../lib/auth';
import { mutateDatabase } from '../../../../lib/db';
import { sendApiError, parseJsonBody, ApiError } from '../../../../lib/http';
import { hashPassword } from '../../../../lib/password';
import { assertRateLimit } from '../../../../lib/rate-limit';
import { parseSignupPayload } from '../../../../lib/validation';
import { createId, nowIso } from '../../../../lib/utils';
import { User } from '../../../../lib/types';

export const onPost: RequestHandler = async (event) => {
  try {
    assertRateLimit(event, 'auth_signup', 10, 15 * 60 * 1000);

    const body = parseSignupPayload(await parseJsonBody(event));

    const user = await mutateDatabase(async (db) => {
      const existing = db.users.find((entry) => entry.email === body.email);
      if (existing) {
        throw new ApiError(409, 'An account with this email already exists', 'email_exists');
      }

      const now = nowIso();
      const isFirstUser = db.users.length === 0;
      const next: User = {
        id: createId(),
        email: body.email,
        passwordHash: hashPassword(body.password),
        oauthProviders: {},
        twoFactor: {
          enabled: false,
          secret: null,
          pendingSecret: null,
          enabledAt: null,
          recoveryCodes: []
        },
        role: isFirstUser ? 'admin' : 'customer',
        adminApiKey: isFirstUser ? createId() : null,
        createdAt: now,
        updatedAt: now,
        appleHealthConsent: false,
        lastAppleHealthSyncAt: null
      };

      db.users.push(next);
      return next;
    });

    await ensureDefaultPreferences(user.id);
    const session = await createSession(event, user.id);
    await logAuditEvent(user.id, 'signup', { method: 'password' });

    event.json(201, {
      ok: true,
      data: {
        user: sanitizeUser(user),
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
