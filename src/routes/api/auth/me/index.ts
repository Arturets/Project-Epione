import type { RequestHandler } from '@builder.io/qwik-city';
import { getSession, sanitizeUser } from '../../../../lib/auth';
import { readDatabase } from '../../../../lib/db';
import { sendApiError } from '../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await getSession(event);
    if (!auth) {
      event.json(401, {
        ok: false,
        error: {
          code: 'unauthorized',
          message: 'Unauthorized'
        }
      });
      return;
    }

    const db = await readDatabase();
    const preferences = db.userPreferences.find((entry) => entry.userId === auth.user.id) ?? null;

    event.json(200, {
      ok: true,
      data: {
        user: sanitizeUser(auth.user),
        csrfToken: auth.csrfToken,
        expiresAt: auth.expiresAt,
        preferences
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
