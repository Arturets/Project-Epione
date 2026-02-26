import type { RequestHandler } from '@builder.io/qwik-city';
import {
  clearTwoFactorChallenge,
  consumeTwoFactorChallenge,
  createSession,
  ensureDefaultPreferences,
  logAuditEvent,
  sanitizeUser
} from '../../../../../lib/auth';
import { mutateDatabase } from '../../../../../lib/db';
import { parseJsonBody, sendApiError, ApiError } from '../../../../../lib/http';
import { assertRateLimit } from '../../../../../lib/rate-limit';
import { verifyTotpCode } from '../../../../../lib/totp';
import { parseTwoFactorVerifyPayload } from '../../../../../lib/validation';

export const onPost: RequestHandler = async (event) => {
  try {
    assertRateLimit(event, 'auth_2fa_verify', 30, 10 * 60 * 1000);
    const payload = parseTwoFactorVerifyPayload(await parseJsonBody(event));
    const { challenge, user } = await consumeTwoFactorChallenge(event, payload.challengeId);

    if (!user.twoFactor.enabled || !user.twoFactor.secret) {
      throw new ApiError(400, '2FA is not enabled for this account', 'two_factor_not_enabled');
    }

    const normalizedCode = payload.code.trim().toUpperCase();
    const isTotpCode = /^\d{6}$/.test(normalizedCode);
    let isValid = false;
    let usedRecoveryCode = false;

    if (isTotpCode) {
      isValid = await verifyTotpCode(user.twoFactor.secret, normalizedCode);
    } else {
      isValid = user.twoFactor.recoveryCodes.includes(normalizedCode);
      usedRecoveryCode = isValid;
    }

    if (!isValid) {
      throw new ApiError(401, 'Invalid two-factor code', 'two_factor_invalid_code');
    }

    if (usedRecoveryCode) {
      await mutateDatabase(async (db) => {
        const target = db.users.find((entry) => entry.id === user.id);
        if (!target) return;
        target.twoFactor.recoveryCodes = target.twoFactor.recoveryCodes.filter((entry) => entry !== normalizedCode);
        target.updatedAt = new Date().toISOString();
      });
    }

    await clearTwoFactorChallenge(event, payload.challengeId);
    await ensureDefaultPreferences(user.id);
    const session = await createSession(event, user.id);
    await logAuditEvent(user.id, 'two_factor_verified', {
      method: challenge.method,
      provider: challenge.provider,
      usedRecoveryCode
    });
    await logAuditEvent(user.id, 'login', {
      method: challenge.method === 'oauth' ? `oauth_${challenge.provider}` : 'password',
      status: 'two_factor_passed'
    });

    event.json(200, {
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
