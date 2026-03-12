import type { RequestHandler } from '@builder.io/qwik-city';
import { createPkcePair, setOAuthState } from '../../../../../../lib/oauth';
import { assertRateLimit } from '../../../../../../lib/rate-limit';
import { sendApiError } from '../../../../../../lib/http';
import { createToken } from '../../../../../../lib/utils';

export const onGet: RequestHandler = async (event) => {
  try {
    assertRateLimit(event, 'oauth_google_authorize', 30, 15 * 60 * 1000);

    const state = createToken(16);
    const pkce = createPkcePair();
    setOAuthState(event, 'google', state, pkce.verifier);

    const callbackUrl = `/api/auth/oauth/google/callback?code=local-google-${Date.now()}&state=${encodeURIComponent(state)}`;
    throw event.redirect(302, callbackUrl);
  } catch (error) {
    sendApiError(event, error);
  }
};
