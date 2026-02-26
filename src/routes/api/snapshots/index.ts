import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../lib/auth';
import { mutateDatabase, readDatabase } from '../../../lib/db';
import { parseJsonBody, sendApiError } from '../../../lib/http';
import { buildLatestMetrics } from '../../../lib/metrics';
import { parseSnapshotPayload } from '../../../lib/validation';
import { createId, nowIso } from '../../../lib/utils';
import { logEvent } from '../../../lib/events';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const db = await readDatabase();

    const snapshots = db.snapshots
      .filter((entry) => entry.userId === auth.user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    event.json(200, {
      ok: true,
      data: snapshots
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const body = parseSnapshotPayload(await parseJsonBody(event));
    const db = await readDatabase();
    const latest = buildLatestMetrics(db.metrics.filter((entry) => entry.userId === auth.user.id));

    const metricValues = Object.fromEntries(latest.map((entry) => [entry.metricName, entry.value]));

    const snapshot = await mutateDatabase(async (mutating) => {
      const now = nowIso();
      const created = {
        id: createId(),
        userId: auth.user.id,
        metricValues,
        userNote: body.userNote,
        createdAt: now,
        updatedAt: now
      };
      mutating.snapshots.push(created);
      return created;
    });

    await logAuditEvent(auth.user.id, 'snapshot_saved', {
      snapshotId: snapshot.id,
      metrics: Object.keys(metricValues)
    });
    await logEvent(auth.user.id, 'snapshot_saved', {
      snapshotId: snapshot.id,
      metricCount: Object.keys(metricValues).length
    });

    event.json(201, {
      ok: true,
      data: snapshot
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
