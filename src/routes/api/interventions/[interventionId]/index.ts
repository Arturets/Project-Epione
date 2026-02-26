import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../../lib/auth';
import { readDatabase } from '../../../../lib/db';
import { getInterventionById, simulateInterventionStack } from '../../../../lib/interventions';
import { ApiError, sendApiError } from '../../../../lib/http';
import { buildLatestMetrics } from '../../../../lib/metrics';
import { logEvent } from '../../../../lib/events';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);

    const interventionId = event.params.interventionId;
    const intervention = getInterventionById(interventionId);

    if (!intervention) {
      throw new ApiError(404, 'Intervention not found', 'intervention_not_found');
    }

    const db = await readDatabase();
    const latest = buildLatestMetrics(db.metrics.filter((entry) => entry.userId === auth.user.id));
    const preferences = db.userPreferences.find((entry) => entry.userId === auth.user.id);

    const simulation = simulateInterventionStack(latest, [interventionId], preferences?.weightUnit ?? 'kg');

    await logEvent(auth.user.id, 'intervention_viewed', {
      interventionId
    });

    event.json(200, {
      ok: true,
      data: {
        intervention,
        simulation
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
