import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../../lib/auth';
import { readDatabase } from '../../../../lib/db';
import { getMergedGraphConfig } from '../../../../lib/graph-admin';
import { sendApiError } from '../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireAuth(event);
    const db = await readDatabase();

    event.json(200, {
      ok: true,
      data: getMergedGraphConfig(db)
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
