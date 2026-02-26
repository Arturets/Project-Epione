import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../../../lib/admin-auth';
import { findVersion } from '../../../../../../../lib/developer-interventions';
import { readInterventionVersions } from '../../../../../../../lib/developer-store';
import { ApiError, sendApiError } from '../../../../../../../lib/http';

function parseVersionNumber(raw: string) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new ApiError(400, 'versionNumber must be a non-negative integer', 'invalid_version_number');
  }
  return value;
}

export const onPost: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);

    const interventionId = event.params.interventionId;
    const versionNumber = parseVersionNumber(event.params.versionNumber);
    const versions = await readInterventionVersions();
    const target = findVersion(versions, interventionId, versionNumber);

    if (!target) {
      throw new ApiError(404, 'Intervention version not found', 'intervention_version_not_found');
    }

    event.json(200, {
      ok: true,
      data: {
        interventionId,
        versionNumber,
        version: target
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
