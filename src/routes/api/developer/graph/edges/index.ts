import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { mutateDatabase, readDatabase } from '../../../../../lib/db';
import { addCustomEdge } from '../../../../../lib/graph-admin';
import { parseJsonBody, sendApiError } from '../../../../../lib/http';
import { parseGraphEdgePayload } from '../../../../../lib/validation';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const db = await readDatabase();

    event.json(200, {
      ok: true,
      data: db.graphCustomEdges
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireDeveloperAccess(event);
    const payload = parseGraphEdgePayload(await parseJsonBody(event));

    const created = await mutateDatabase(async (db) => addCustomEdge(db, payload, auth.user.id));

    event.json(201, {
      ok: true,
      data: created
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
