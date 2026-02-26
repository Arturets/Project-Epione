import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../lib/auth';
import { readDatabase } from '../../../lib/db';
import { sendApiError } from '../../../lib/http';
import { buildLatestMetrics } from '../../../lib/metrics';
import { buildSuggestions } from '../../../lib/suggestions';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const db = await readDatabase();
    const latest = buildLatestMetrics(db.metrics.filter((entry) => entry.userId === auth.user.id));
    const suggestions = buildSuggestions(latest);

    event.json(200, {
      ok: true,
      data: suggestions
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
