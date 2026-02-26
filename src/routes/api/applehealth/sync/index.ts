import type { RequestHandler } from '@builder.io/qwik-city';
import { assertCsrf, requireAuth, logAuditEvent } from '../../../../lib/auth';
import { mutateDatabase } from '../../../../lib/db';
import { ApiError, parseJsonBody, sendApiError } from '../../../../lib/http';
import { createId, nowIso } from '../../../../lib/utils';
import { logEvent } from '../../../../lib/events';

const SAMPLE_SYNC = [
  { metricName: 'weight', value: 80.8, unit: 'kg' },
  { metricName: 'body_fat', value: 20.9, unit: '%' },
  { metricName: 'rhr', value: 58, unit: 'bpm' },
  { metricName: 'hrv', value: 56, unit: 'ms' },
  { metricName: 'sleep', value: 7.1, unit: 'hours' }
] as const;

export const onPost: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    assertCsrf(event, auth.csrfToken);

    const body = (await parseJsonBody(event)) as Record<string, unknown>;
    const consentGranted = body?.consent === true || body?.consentGranted === true;

    if (!auth.user.appleHealthConsent && !consentGranted) {
      throw new ApiError(
        400,
        'Apple Health consent is required before first sync. Send consent=true in request body.',
        'apple_health_consent_required'
      );
    }

    const syncTimestamp = nowIso();

    await mutateDatabase(async (db) => {
      const user = db.users.find((entry) => entry.id === auth.user.id);
      if (!user) {
        throw new ApiError(404, 'User not found', 'user_not_found');
      }

      if (!user.appleHealthConsent) {
        user.appleHealthConsent = true;
        user.updatedAt = nowIso();
      }

      user.lastAppleHealthSyncAt = syncTimestamp;

      for (const sample of SAMPLE_SYNC) {
        db.metrics.push({
          id: createId(),
          userId: user.id,
          metricName: sample.metricName,
          value: sample.value,
          unit: sample.unit,
          note: 'Imported from Apple Health',
          recordedAt: syncTimestamp,
          syncedFrom: 'apple_health',
          createdAt: syncTimestamp,
          updatedAt: syncTimestamp
        });
      }
    });

    if (consentGranted && !auth.user.appleHealthConsent) {
      await logAuditEvent(auth.user.id, 'apple_sync_consent', {
        consentGrantedAt: syncTimestamp
      });
    }

    await logAuditEvent(auth.user.id, 'apple_sync', {
      metricsImported: SAMPLE_SYNC.length,
      syncedAt: syncTimestamp
    });
    await logEvent(auth.user.id, 'applehealth_sync', {
      status: 'success',
      count: SAMPLE_SYNC.length,
      syncedMetrics: SAMPLE_SYNC.map((item) => item.metricName)
    });

    event.json(200, {
      ok: true,
      data: {
        syncedAt: syncTimestamp,
        importedMetrics: SAMPLE_SYNC.length,
        source: 'apple_health'
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
