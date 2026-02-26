import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../../../lib/auth';
import { mutateDatabase } from '../../../../../lib/db';
import { ApiError, parseJsonBody, sendApiError } from '../../../../../lib/http';
import { verifyTotpCode } from '../../../../../lib/totp';
import { parseTwoFactorCodePayload } from '../../../../../lib/validation';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);
    const payload = parseTwoFactorCodePayload(await parseJsonBody(event));

    await mutateDatabase(async (db) => {
      const user = db.users.find((entry) => entry.id === auth.user.id);
      if (!user) {
        throw new ApiError(404, 'User not found', 'user_not_found');
      }

      if (!user.twoFactor.enabled || !user.twoFactor.secret) {
        throw new ApiError(400, '2FA is not enabled', 'two_factor_not_enabled');
      }

      if (!(await verifyTotpCode(user.twoFactor.secret, payload.code))) {
        throw new ApiError(400, 'Invalid 2FA code', 'two_factor_invalid_code');
      }

      user.twoFactor = {
        enabled: false,
        secret: null,
        pendingSecret: null,
        enabledAt: null,
        recoveryCodes: []
      };
      user.updatedAt = new Date().toISOString();
    });

    await logAuditEvent(auth.user.id, 'two_factor_disabled', {});

    event.json(200, {
      ok: true,
      data: {
        enabled: false
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
