import type { RequestHandler } from '@builder.io/qwik-city';
import { createSession, ensureDefaultPreferences, logAuditEvent, upsertOAuthUser } from '../../../../../../lib/auth';
import { sendApiError, ApiError } from '../../../../../../lib/http';
import { consumeOAuthState } from '../../../../../../lib/oauth';

export const onGet: RequestHandler = async (event) => {
  try {
    const state = event.url.searchParams.get('state');
    const code = event.url.searchParams.get('code');

    if (!state || !code) {
      throw new ApiError(400, 'Missing OAuth callback parameters', 'oauth_callback_invalid');
    }

    consumeOAuthState(event, 'apple', state);

    const email = event.url.searchParams.get('email')?.trim().toLowerCase() || 'demo.apple.user@health.local';
    const sub = `apple-${code}`;

    const user = await upsertOAuthUser('apple', email, sub);
    await ensureDefaultPreferences(user.id);
    await createSession(event, user.id);
    await logAuditEvent(user.id, 'login', { method: 'oauth_apple' });

    throw event.redirect(302, '/dashboard?auth=apple_success');
  } catch (error) {
    sendApiError(event, error);
  }
};
