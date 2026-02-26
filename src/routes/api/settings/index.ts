import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, logAuditEvent, requireAuth } from '../../../lib/auth';
import { mutateDatabase, readDatabase } from '../../../lib/db';
import { sendApiError, parseJsonBody } from '../../../lib/http';
import { parseSettingsPayload } from '../../../lib/validation';
import { nowIso } from '../../../lib/utils';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const db = await readDatabase();

    const settings = db.userPreferences.find((entry) => entry.userId === auth.user.id);

    event.json(200, {
      ok: true,
      data: settings
    });
  } catch (error) {
    sendApiError(event, error);
  }
};

export const onPut: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const payload = parseSettingsPayload(await parseJsonBody(event));

    const updated = await mutateDatabase(async (db) => {
      const settings = db.userPreferences.find((entry) => entry.userId === auth.user.id);
      if (!settings) {
        throw new Error('Missing user preferences');
      }

      if (payload.weightUnit) settings.weightUnit = payload.weightUnit;
      if (payload.distanceUnit) settings.distanceUnit = payload.distanceUnit;
      settings.updatedAt = nowIso();

      return settings;
    });

    await logAuditEvent(auth.user.id, 'settings_updated', payload);

    event.json(200, {
      ok: true,
      data: updated
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
