import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { buildRoutesSvg } from '../../../../../lib/developer-routes';
import { sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const svg = buildRoutesSvg();
    event.headers.set('Content-Type', 'image/svg+xml; charset=utf-8');
    event.headers.set('Content-Disposition', 'attachment; filename="routes-manifest.svg"');
    event.send(200, svg);
  } catch (error) {
    sendApiError(event, error);
  }
};
