import type { OAuthProviderName } from '../lib/types';

export type OAuthProviderUi = {
  id: OAuthProviderName;
  label: string;
  description: string;
  recommended: boolean;
  defaultVisible: boolean;
};

export const OAUTH_PROVIDER_UI: OAuthProviderUi[] = [
  {
    id: 'google',
    label: 'Google',
    description: 'Personal and workspace login.',
    recommended: true,
    defaultVisible: true
  },
  {
    id: 'apple',
    label: 'Apple',
    description: 'Strong iOS/macOS identity support.',
    recommended: true,
    defaultVisible: true
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    description: 'Microsoft 365 and enterprise identity.',
    recommended: true,
    defaultVisible: true
  },
  {
    id: 'samsung',
    label: 'Samsung',
    description: 'Samsung account federation.',
    recommended: true,
    defaultVisible: true
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Suggested for developer-heavy organizations.',
    recommended: true,
    defaultVisible: false
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Suggested for B2B and partner-facing onboarding.',
    recommended: true,
    defaultVisible: false
  }
];

export const PRIMARY_OAUTH_PROVIDERS = OAUTH_PROVIDER_UI.filter((provider) => provider.defaultVisible);
export const SUGGESTED_OAUTH_PROVIDERS = OAUTH_PROVIDER_UI.filter((provider) => !provider.defaultVisible);
