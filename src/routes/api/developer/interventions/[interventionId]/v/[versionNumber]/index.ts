import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../../../lib/admin-auth';
import { mutateDatabase } from '../../../../../../../lib/db';
import { deleteDraftVersion, ensureInterventionVersionSeed, updateDraftVersion } from '../../../../../../../lib/developer-interventions';
import { parseJsonBody, sendApiError, ApiError } from '../../../../../../../lib/http';
import { parseInterventionVersionPayload } from '../../../../../../../lib/validation';

function parseVersionNumber(raw: string) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new ApiError(400, 'versionNumber must be a non-negative integer', 'invalid_version_number');
  }
  return value;
}

export const onPut: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const interventionId = event.params.interventionId;
    const versionNumber = parseVersionNumber(event.params.versionNumber);
    const payload = parseInterventionVersionPayload(await parseJsonBody(event));

    const updated = await mutateDatabase(async (db) => {
      db.interventionVersions = ensureInterventionVersionSeed(db.interventionVersions);
      return updateDraftVersion(db.interventionVersions, interventionId, versionNumber, payload);
    });

    event.json(200, {
      ok: true,
      data: updated
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onDelete: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const interventionId = event.params.interventionId;
    const versionNumber = parseVersionNumber(event.params.versionNumber);

    const deleted = await mutateDatabase(async (db) => {
      db.interventionVersions = ensureInterventionVersionSeed(db.interventionVersions);
      return deleteDraftVersion(db.interventionVersions, interventionId, versionNumber);
    });

    event.json(200, {
      ok: true,
      data: deleted
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
