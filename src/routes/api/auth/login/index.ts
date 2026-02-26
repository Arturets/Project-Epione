import type { RequestHandler } from '@builder.io/qwik-city';
import { createSession, createTwoFactorChallenge, ensureDefaultPreferences, logAuditEvent, sanitizeUser } from '../../../../lib/auth';
import { readDatabase } from '../../../../lib/db';
import { sendApiError, parseJsonBody, ApiError } from '../../../../lib/http';
import { verifyPassword } from '../../../../lib/password';
import { assertRateLimit } from '../../../../lib/rate-limit';
import { parseLoginPayload } from '../../../../lib/validation';

export const onPost: RequestHandler = async (event) => {
  try {
    assertRateLimit(event, 'auth_login', 15, 15 * 60 * 1000);

    const body = parseLoginPayload(await parseJsonBody(event));
    const db = await readDatabase();
    const user = db.users.find((entry) => entry.email === body.email);

    if (!user || !user.passwordHash || !verifyPassword(body.password, user.passwordHash)) {
      throw new ApiError(401, 'Invalid email or password', 'invalid_credentials');
    }

    await ensureDefaultPreferences(user.id);
    if (user.twoFactor.enabled && user.twoFactor.secret) {
      const challenge = await createTwoFactorChallenge(event, user.id, 'password', null);
      await logAuditEvent(user.id, 'login', { method: 'password', status: 'two_factor_required' });

      event.json(200, {
        ok: true,
        data: {
          requiresTwoFactor: true,
          challengeId: challenge.id,
          expiresAt: challenge.expiresAt
        }
      });
      return;
    }

    const session = await createSession(event, user.id);
    await logAuditEvent(user.id, 'login', { method: 'password' });

    event.json(200, {
      ok: true,
      data: {
        requiresTwoFactor: false,
        user: sanitizeUser(user),
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
