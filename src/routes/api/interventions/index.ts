import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../lib/auth';
import { getInterventions } from '../../../lib/interventions';
import { sendApiError } from '../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireAuth(event);

    event.json(200, {
      ok: true,
      data: getInterventions()
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
