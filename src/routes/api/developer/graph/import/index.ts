import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { mutateDatabase } from '../../../../../lib/db';
import { importCustomGraph } from '../../../../../lib/graph-admin';
import { parseJsonBody, sendApiError } from '../../../../../lib/http';
import { parseGraphImportPayload } from '../../../../../lib/validation';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireDeveloperAccess(event);
    const payload = parseGraphImportPayload(await parseJsonBody(event));

    const result = await mutateDatabase(async (db) => importCustomGraph(db, payload, auth.user.id));

    event.json(200, {
      ok: true,
      data: result
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
