import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../lib/admin-auth';
import { mutateDatabase } from '../../../../lib/db';
import { createDraftVersion, ensureInterventionVersionSeed } from '../../../../lib/developer-interventions';
import { readInterventionVersions } from '../../../../lib/developer-store';
import { parseJsonBody, sendApiError } from '../../../../lib/http';
import { parseInterventionVersionPayload } from '../../../../lib/validation';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const versions = await readInterventionVersions();

    const ordered = [...versions].sort(
      (a, b) =>
        a.interventionId.localeCompare(b.interventionId) ||
        b.versionNumber - a.versionNumber ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    event.json(200, {
      ok: true,
      data: ordered
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireDeveloperAccess(event);
    const payload = parseInterventionVersionPayload(await parseJsonBody(event));

    const created = await mutateDatabase(async (db) => {
      db.interventionVersions = ensureInterventionVersionSeed(db.interventionVersions);
      const draft = createDraftVersion(db.interventionVersions, payload, auth.user.id);
      db.interventionVersions.push(draft);
      return draft;
    });

    event.json(201, {
      ok: true,
      data: created
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
