import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../../lib/admin-auth';
import { mutateDatabase } from '../../../../../../lib/db';
import { removeCustomMetric } from '../../../../../../lib/graph-admin';
import { sendApiError } from '../../../../../../lib/http';

export const onDelete: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const removed = await mutateDatabase(async (db) => removeCustomMetric(db, event.params.metricId));

    event.json(200, {
      ok: true,
      data: removed
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
