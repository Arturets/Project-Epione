import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, requireAuth } from '../../../../lib/auth';
import { logEvent } from '../../../../lib/events';
import { parseJsonBody, sendApiError } from '../../../../lib/http';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const body = (await parseJsonBody(event)) as Record<string, unknown>;
    const route = typeof body.route === 'string' ? body.route.trim() : '';
    const referrer = typeof body.referrer === 'string' ? body.referrer.trim() : null;

    if (!route) {
      event.json(400, {
        ok: false,
        error: {
          code: 'invalid_route',
          message: 'route is required'
        }
      });
      return;
    }

    await logEvent(auth.user.id, 'page_visited', {
      route,
      referrer
    });

    event.json(200, {
      ok: true,
      data: { route }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
