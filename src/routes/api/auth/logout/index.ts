import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, clearSession, requireAuth, logAuditEvent } from '../../../../lib/auth';
import { sendApiError } from '../../../../lib/http';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    await clearSession(event);
    await logAuditEvent(auth.user.id, 'logout', {});

    event.json(200, {
      ok: true
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
