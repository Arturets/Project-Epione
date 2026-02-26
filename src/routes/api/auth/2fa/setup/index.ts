import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../../../lib/auth';
import { mutateDatabase } from '../../../../../lib/db';
import { ApiError, sendApiError } from '../../../../../lib/http';
import { buildTotpOtpAuthUri, generateTotpSecret } from '../../../../../lib/totp';

function readEnv(name: string) {
  const runtimeProcess = process as { env?: Record<string, string | undefined> };
  return runtimeProcess.env?.[name];
}

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const issuer = readEnv('TWO_FACTOR_ISSUER')?.trim() || 'Health Intelligence';
    const secret = generateTotpSecret();
    const otpAuthUri = buildTotpOtpAuthUri(secret, auth.user.email, issuer);

    await mutateDatabase(async (db) => {
      const user = db.users.find((entry) => entry.id === auth.user.id);
      if (!user) {
        throw new ApiError(404, 'User not found', 'user_not_found');
      }
      user.twoFactor.pendingSecret = secret;
      user.updatedAt = new Date().toISOString();
    });

    await logAuditEvent(auth.user.id, 'two_factor_setup_started', { issuer });

    event.json(200, {
      ok: true,
      data: {
        secret,
        otpAuthUri,
        issuer,
        accountName: auth.user.email
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
