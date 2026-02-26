import type { RequestHandler } from '@builder.io/qwik-city';
import { assertOAuthProviderName, buildOAuthAuthorizeUrl, createPkcePair, setOAuthState } from '../../../../../../lib/oauth';
import { assertRateLimit } from '../../../../../../lib/rate-limit';
import { sendApiError } from '../../../../../../lib/http';
import { createToken } from '../../../../../../lib/utils';

export const onGet: RequestHandler = async (event) => {
  try {
    const provider = assertOAuthProviderName(event.params.provider);
    assertRateLimit(event, `oauth_${provider}_authorize`, 30, 15 * 60 * 1000);

    const state = createToken(16);
    const pkce = createPkcePair();
    setOAuthState(event, provider, state, pkce.verifier);

    const authorizeUrl = buildOAuthAuthorizeUrl(event, provider, state, pkce.challenge);
    throw event.redirect(302, authorizeUrl);
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
