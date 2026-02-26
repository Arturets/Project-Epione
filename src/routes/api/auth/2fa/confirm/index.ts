import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../../../lib/auth';
import { mutateDatabase } from '../../../../../lib/db';
import { ApiError, parseJsonBody, sendApiError } from '../../../../../lib/http';
import { verifyTotpCode } from '../../../../../lib/totp';
import { createToken } from '../../../../../lib/utils';
import { parseTwoFactorCodePayload } from '../../../../../lib/validation';

function createRecoveryCode() {
  return createToken(4).toUpperCase();
}

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);
    const payload = parseTwoFactorCodePayload(await parseJsonBody(event));

    const result = await mutateDatabase(async (db) => {
      const user = db.users.find((entry) => entry.id === auth.user.id);
      if (!user) {
        throw new ApiError(404, 'User not found', 'user_not_found');
      }

      const pendingSecret = user.twoFactor.pendingSecret;
      if (!pendingSecret) {
        throw new ApiError(400, 'No 2FA setup in progress', 'two_factor_not_initialized');
      }

      if (!(await verifyTotpCode(pendingSecret, payload.code))) {
        throw new ApiError(400, 'Invalid 2FA code', 'two_factor_invalid_code');
      }

      const recoveryCodes = Array.from({ length: 8 }, () => createRecoveryCode());
      user.twoFactor = {
        enabled: true,
        secret: pendingSecret,
        pendingSecret: null,
        enabledAt: new Date().toISOString(),
        recoveryCodes
      };
      user.updatedAt = new Date().toISOString();

      return {
        recoveryCodes
      };
    });

    await logAuditEvent(auth.user.id, 'two_factor_enabled', { recoveryCodesGenerated: result.recoveryCodes.length });

    event.json(200, {
      ok: true,
      data: {
        enabled: true,
        recoveryCodes: result.recoveryCodes
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
