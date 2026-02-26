import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { readDatabase } from '../../../../../lib/db';
import { getInterventionsBreakdown } from '../../../../../lib/developer-stats';
import { parseDateRange } from '../../../../../lib/events';
import { sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const db = await readDatabase();
    const window = parseDateRange(event.url.searchParams, { days: 7 });

    event.json(200, {
      ok: true,
      data: getInterventionsBreakdown(db, window)
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
