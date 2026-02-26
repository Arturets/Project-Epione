import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../../../lib/auth';
import { readDatabase } from '../../../../../lib/db';
import { sendApiError } from '../../../../../lib/http';
import { parseHistoryMetricName } from '../../../../../lib/validation';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const metricName = parseHistoryMetricName(event.params.metricName);
    const db = await readDatabase();

    const history = db.metrics
      .filter((entry) => entry.userId === auth.user.id && entry.metricName === metricName)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    event.json(200, {
      ok: true,
      data: {
        metricName,
        history
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
