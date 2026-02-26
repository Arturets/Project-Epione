import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../../lib/auth';
import { mutateDatabase } from '../../../../lib/db';
import { ApiError, parseJsonBody, sendApiError } from '../../../../lib/http';
import { parseMetricUpsertPayload } from '../../../../lib/validation';
import { nowIso } from '../../../../lib/utils';

export const onPut: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const metricId = event.params.metricId;
    if (!metricId) {
      throw new ApiError(400, 'metricId is required', 'invalid_metric_id');
    }

    const payload = parseMetricUpsertPayload(await parseJsonBody(event));

    const updated = await mutateDatabase(async (db) => {
      const metric = db.metrics.find((entry) => entry.id === metricId && entry.userId === auth.user.id);
      if (!metric) {
        throw new ApiError(404, 'Metric not found', 'metric_not_found');
      }

      metric.metricName = payload.metricName;
      metric.value = payload.value;
      metric.unit = payload.unit;
      metric.note = payload.note;
      metric.recordedAt = payload.recordedAt;
      metric.syncedFrom = payload.syncedFrom;
      metric.updatedAt = nowIso();

      return metric;
    });

    await logAuditEvent(auth.user.id, 'metric_updated', {
      metricId: updated.id,
      metricName: updated.metricName
    });

    event.json(200, {
      ok: true,
      data: updated
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
