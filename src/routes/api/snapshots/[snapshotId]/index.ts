import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../../lib/auth';
import { mutateDatabase, readDatabase } from '../../../../lib/db';
import { ApiError, sendApiError } from '../../../../lib/http';
import { logEvent } from '../../../../lib/events';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const snapshotId = event.params.snapshotId;

    const db = await readDatabase();
    const snapshot = db.snapshots.find((entry) => entry.id === snapshotId && entry.userId === auth.user.id);

    if (!snapshot) {
      throw new ApiError(404, 'Snapshot not found', 'snapshot_not_found');
    }

    event.json(200, {
      ok: true,
      data: snapshot
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onDelete: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const snapshotId = event.params.snapshotId;
    const deleted = await mutateDatabase(async (db) => {
      const index = db.snapshots.findIndex((entry) => entry.id === snapshotId && entry.userId === auth.user.id);
      if (index < 0) {
        throw new ApiError(404, 'Snapshot not found', 'snapshot_not_found');
      }

      const removed = db.snapshots[index];
      db.snapshots.splice(index, 1);
      return removed;
    });

    await logAuditEvent(auth.user.id, 'snapshot_deleted', {
      snapshotId: deleted.id
    });
    await logEvent(auth.user.id, 'snapshot_deleted', {
      snapshotId: deleted.id
    });

    event.json(200, {
      ok: true,
      data: deleted
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
