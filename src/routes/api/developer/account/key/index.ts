import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAdminSession, getOrCreateAdminApiKey, rotateAdminApiKey } from '../../../../../lib/admin-auth';
import { sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAdminSession(event);
    const apiKey = await getOrCreateAdminApiKey(auth.user.id);

    event.json(200, {
      ok: true,
      data: {
        apiKey,
        masked: `••••••••-${apiKey.slice(-8)}`
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAdminSession(event);
    const apiKey = await rotateAdminApiKey(auth.user.id);

    event.json(200, {
      ok: true,
      data: {
        apiKey,
        masked: `••••••••-${apiKey.slice(-8)}`
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
