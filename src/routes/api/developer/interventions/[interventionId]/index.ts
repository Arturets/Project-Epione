import type { RequestHandler } from '@builder.io/qwik-city';
import { requireDeveloperAccess } from '../../../../../lib/admin-auth';
import { listByIntervention } from '../../../../../lib/developer-interventions';
import { readInterventionVersions } from '../../../../../lib/developer-store';
import { ApiError, sendApiError } from '../../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    await requireDeveloperAccess(event);
    const interventionId = event.params.interventionId;
    const versions = await readInterventionVersions();
    const history = listByIntervention(versions, interventionId);

    if (!history.length) {
      throw new ApiError(404, 'Intervention not found', 'intervention_not_found');
    }

    event.json(200, {
      ok: true,
      data: {
        interventionId,
        versions: history
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
