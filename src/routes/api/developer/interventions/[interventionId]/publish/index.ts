import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../../lib/admin-auth';
import { mutateDatabase } from '../../../../../../lib/db';
import { ensureInterventionVersionSeed, publishLatestDraft } from '../../../../../../lib/developer-interventions';
import { sendApiError } from '../../../../../../lib/http';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireDeveloperAccess(event);
    const interventionId = event.params.interventionId;

    const published = await mutateDatabase(async (db) => {
      db.interventionVersions = ensureInterventionVersionSeed(db.interventionVersions);
      return publishLatestDraft(db.interventionVersions, interventionId, auth.user.id);
    });

    event.json(200, {
      ok: true,
      data: published
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
