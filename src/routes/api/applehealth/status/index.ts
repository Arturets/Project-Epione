import type { RequestHandler } from '@builder.io/qwik-city';
import { requireAuth } from '../../../../lib/auth';
import { readDatabase } from '../../../../lib/db';
import { sendApiError } from '../../../../lib/http';

export const onGet: RequestHandler = async (event) => {
  try {
    const auth = await requireAuth(event);
    const db = await readDatabase();

    const syncEvents = db.auditLogs
      .filter((entry) => entry.userId === auth.user.id && entry.eventType === 'apple_sync')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    event.json(200, {
      ok: true,
      data: {
        consentGranted: auth.user.appleHealthConsent,
        lastSyncAt: auth.user.lastAppleHealthSyncAt,
        status: 'ready',
        syncEvents: syncEvents.slice(0, 20)
      }
    });
  } catch (error) {
    sendApiError(event, error);
  }
};
