import type { RequestHandler } from '@builder.io/qwik-city';
import {
  createSession,
  createTwoFactorChallenge,
  ensureDefaultPreferences,
  logAuditEvent,
  upsertOAuthUser
} from '../../../../../../lib/auth';
import { sendApiError, ApiError } from '../../../../../../lib/http';
import { assertOAuthProviderName, consumeOAuthState, resolveOAuthProfile } from '../../../../../../lib/oauth';

export const onGet: RequestHandler = async (event) => {
  try {
    const provider = assertOAuthProviderName(event.params.provider);
    const state = event.url.searchParams.get('state');
    const code = event.url.searchParams.get('code');

    if (!state || !code) {
      throw new ApiError(400, 'Missing OAuth callback parameters', 'oauth_callback_invalid');
    }

    const oauthState = consumeOAuthState(event, provider, state);
    const profile = await resolveOAuthProfile(event, provider, code, oauthState.verifier);
    const user = await upsertOAuthUser(provider, profile.email, profile.sub);
    await ensureDefaultPreferences(user.id);

    if (user.twoFactor.enabled && user.twoFactor.secret) {
      const challenge = await createTwoFactorChallenge(event, user.id, 'oauth', provider);
      await logAuditEvent(user.id, 'login', {
        method: `oauth_${provider}`,
        status: 'two_factor_required'
      });
      throw event.redirect(302, `/auth/2fa?challenge=${encodeURIComponent(challenge.id)}&provider=${provider}`);
    }

    await createSession(event, user.id);
    await logAuditEvent(user.id, 'login', { method: `oauth_${provider}` });

    throw event.redirect(302, `/dashboard?auth=${provider}_success`);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;
      if (typeof status === 'number' && status >= 300 && status < 400) {
        throw error;
      }
    }
    sendApiError(event, error);
  }
};
