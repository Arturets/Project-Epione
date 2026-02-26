import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { readDatabase } from '../../../../../lib/db';
import { getEventBreakdown } from '../../../../../lib/developer-stats';
import { parseDateRange } from '../../../../../lib/events';
import { sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const db = await readDatabase();
    const window = parseDateRange(event.url.searchParams, { hours: 24 });
    const limitRaw = Number(event.url.searchParams.get('limit') ?? '50');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

    event.json(200, {
      ok: true,
      data: getEventBreakdown(db, window).slice(0, limit)
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
