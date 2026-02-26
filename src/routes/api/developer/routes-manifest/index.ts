import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../lib/admin-auth';
import { getRoutesManifestPayload } from '../../../../lib/developer-routes';
import { sendApiError } from '../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    event.json(200, {
      ok: true,
      data: getRoutesManifestPayload()
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
