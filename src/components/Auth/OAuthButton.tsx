import { component$ } from '@builder.io/qwik';
import type { OAuthProviderName } from '../../lib/types';
import { OAUTH_PROVIDER_UI } from '../../config/oauth-providers';

type Props = {
  provider: OAuthProviderName;
};

export const OAuthButton = component$<Props>(({ provider }) => {
  const config = OAUTH_PROVIDER_UI.find((item) => item.id === provider);
  const label = config ? `Continue with ${config.label}` : `Continue with ${provider}`;

  return (
    <a class="button oauth-button" href={`/api/auth/oauth/${provider}/authorize`}>
      {label}
    </a>
  );
});
