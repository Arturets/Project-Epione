import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, requireAuth } from '../../../../lib/auth';
import { logEvent } from '../../../../lib/events';
import { parseJsonBody, sendApiError } from '../../../../lib/http';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const body = (await parseJsonBody(event)) as Record<string, unknown>;
    const suggestionId = typeof body.suggestionId === 'string' ? body.suggestionId.trim() : '';

    if (!suggestionId) {
      event.json(400, {
        ok: false,
        error: {
          code: 'invalid_suggestion_id',
          message: 'suggestionId is required'
        }
      });
      return;
    }

    await logEvent(auth.user.id, 'suggestion_clicked', {
      suggestionId,
      route: typeof body.route === 'string' ? body.route : null
    });

    event.json(200, {
      ok: true,
      data: { suggestionId }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
