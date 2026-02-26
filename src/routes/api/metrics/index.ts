import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth, assertCsrf, logAuditEvent } from '../../../lib/auth';
import { readDatabase, mutateDatabase } from '../../../lib/db';
import { sendApiError, parseJsonBody, ApiError } from '../../../lib/http';
import { buildLatestMetrics } from '../../../lib/metrics';
import { parseMetricUpsertPayload } from '../../../lib/validation';
import { createId, nowIso } from '../../../lib/utils';
import { logEvent } from '../../../lib/events';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const db = await readDatabase();

    const userMetrics = db.metrics.filter((entry) => entry.userId === auth.user.id);
    const latest = buildLatestMetrics(userMetrics);

    event.json(200, {
      ok: true,
      data: {
        latest,
        records: userMetrics.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const payload = parseMetricUpsertPayload(await parseJsonBody(event));

    const created = await mutateDatabase(async (db) => {
      const now = nowIso();
      const row = {
        id: createId(),
        userId: auth.user.id,
        metricName: payload.metricName,
        value: payload.value,
        unit: payload.unit,
        note: payload.note,
        recordedAt: payload.recordedAt,
        syncedFrom: payload.syncedFrom,
        createdAt: now,
        updatedAt: now
      };
      db.metrics.push(row);
      return row;
    });

    await logAuditEvent(auth.user.id, 'metric_logged', {
      metricName: created.metricName,
      value: created.value,
      syncedFrom: created.syncedFrom
    });
    await logEvent(auth.user.id, 'metric_logged', {
      metricName: created.metricName,
      value: created.value,
      unit: created.unit,
      syncedFrom: created.syncedFrom
    });

    event.json(201, {
      ok: true,
      data: created
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPut: RequestHandler = async (event) => {
  try {
    throw new ApiError(405, 'Use PUT /api/metrics/:metricId', 'method_not_allowed');
  } catch (error) {
    sendApiError(event, error);
  }
};
