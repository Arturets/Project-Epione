import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, requireAuth } from '../../../../../lib/auth';
import { readDatabase } from '../../../../../lib/db';
import { getInterventionById, simulateInterventionStack } from '../../../../../lib/interventions';
import { ApiError, parseJsonBody, sendApiError } from '../../../../../lib/http';
import { buildLatestMetrics } from '../../../../../lib/metrics';
import { parseSimulatePayload } from '../../../../../lib/validation';
import { logEvent } from '../../../../../lib/events';

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const interventionId = event.params.interventionId;
    const baseIntervention = getInterventionById(interventionId);

    if (!baseIntervention) {
      throw new ApiError(404, 'Intervention not found', 'intervention_not_found');
    }

    const payload = parseSimulatePayload(await parseJsonBody(event));

    const selected = Array.from(new Set([interventionId, ...payload.selectedInterventionIds]));
    const db = await readDatabase();
    const latest = buildLatestMetrics(db.metrics.filter((entry) => entry.userId === auth.user.id));
    const preferences = db.userPreferences.find((entry) => entry.userId === auth.user.id);

    const simulation = simulateInterventionStack(latest, selected, preferences?.weightUnit ?? 'kg');

    await logEvent(auth.user.id, 'intervention_selected', {
      interventionId,
      selectedInterventions: selected,
      durationWeeks: baseIntervention.durationWeeks
    });

    if (selected.length > 1) {
      await logEvent(auth.user.id, 'intervention_stacked', {
        interventions: selected
      });
    }

    event.json(200, {
      ok: true,
      data: {
        interventionId,
        selectedInterventions: selected,
        simulation
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
