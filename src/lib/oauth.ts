import { createHash } from 'node:crypto';
import type { RequestEventBase } from '@builder.io/qwik-city';
import { ApiError } from './http';
import { OAuthProviderName, OAUTH_PROVIDER_NAMES } from './types';
import { createToken } from './utils';

type OAuthStatePayload = {
  provider: OAuthProviderName;
  state: string;
  verifier: string;
  createdAt: string;
};

type OAuthProviderRuntime = {
  id: OAuthProviderName;
  label: string;
  description: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
};

type OAuthProfile = {
  sub: string;
  email: string;
};

const COOKIE_NAME = 'oauth_state';
const PROVIDER_CATALOG = [
  {
    id: 'google',
    label: 'Google',
    description: 'Common personal and workspace login.',
    recommended: true
  },
  {
    id: 'apple',
    label: 'Apple',
    description: 'Strong iOS/macOS ecosystem coverage.',
    recommended: true
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    description: 'Enterprise and Microsoft 365 sign-in.',
    recommended: true
  },
  {
    id: 'samsung',
    label: 'Samsung',
    description: 'Samsung account federation.',
    recommended: true
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Recommended for developer-heavy teams.',
    recommended: true
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Recommended for B2B identity flows.',
    recommended: true
  }
] as const;

const PROVIDER_DEFAULTS: Partial<Record<OAuthProviderName, Pick<OAuthProviderRuntime, 'authorizeUrl' | 'tokenUrl' | 'userInfoUrl' | 'scopes'>>> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile']
  },
  apple: {
    authorizeUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '',
    scopes: ['openid', 'email', 'name']
  },
  microsoft: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scopes: ['openid', 'email', 'profile', 'User.Read']
  }
};

function readEnv(name: string) {
  const runtimeProcess = process as { env?: Record<string, string | undefined> };
  return runtimeProcess.env?.[name];
}

function base64UrlEncode(buffer: { toString: (encoding?: string) => string }) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function createPkcePair() {
  const verifier = createToken(32);
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest());
  return {
    verifier,
    challenge,
    method: 'S256'
  } as const;
}

export function getOAuthProviderCatalog() {
  return PROVIDER_CATALOG.map((provider) => ({
    ...provider
  }));
}

export function isOAuthProviderName(value: string): value is OAuthProviderName {
  return (OAUTH_PROVIDER_NAMES as readonly string[]).includes(value);
}

export function assertOAuthProviderName(value: string): OAuthProviderName {
  if (!isOAuthProviderName(value)) {
    throw new ApiError(404, 'OAuth provider not supported', 'oauth_provider_not_supported');
  }
  return value;
}

export function setOAuthState(event: RequestEventBase, provider: OAuthProviderName, state: string, verifier: string) {
  const payload: OAuthStatePayload = {
    provider,
    state,
    verifier,
    createdAt: new Date().toISOString()
  };

  event.cookie.set(COOKIE_NAME, JSON.stringify(payload), {
    path: '/',
    httpOnly: true,
    secure: event.url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 60 * 10
  });
}

export function consumeOAuthState(event: RequestEventBase, provider: OAuthProviderName, incomingState: string) {
  const encoded = event.cookie.get(COOKIE_NAME)?.value;
  event.cookie.delete(COOKIE_NAME, { path: '/' });

  if (!encoded) {
    throw new ApiError(400, 'Missing OAuth state cookie', 'oauth_missing_state');
  }

  let parsed: OAuthStatePayload;
  try {
    parsed = JSON.parse(encoded) as OAuthStatePayload;
  } catch {
    throw new ApiError(400, 'Invalid OAuth state cookie', 'oauth_invalid_state');
  }

  if (parsed.provider !== provider || parsed.state !== incomingState) {
    throw new ApiError(400, 'OAuth state mismatch', 'oauth_state_mismatch');
  }

  const createdAt = new Date(parsed.createdAt).getTime();
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > 10 * 60 * 1000) {
    throw new ApiError(400, 'OAuth state expired', 'oauth_state_expired');
  }

  return parsed;
}

function toProviderEnvName(provider: OAuthProviderName) {
  return provider.toUpperCase();
}

function getProviderRuntime(provider: OAuthProviderName): OAuthProviderRuntime {
  const envName = toProviderEnvName(provider);
  const defaults = PROVIDER_DEFAULTS[provider];
  const clientId = readEnv(`OAUTH_${envName}_CLIENT_ID`)?.trim() ?? '';
  const clientSecret = readEnv(`OAUTH_${envName}_CLIENT_SECRET`)?.trim() ?? '';
  const authorizeUrl = readEnv(`OAUTH_${envName}_AUTHORIZE_URL`)?.trim() ?? defaults?.authorizeUrl ?? '';
  const tokenUrl = readEnv(`OAUTH_${envName}_TOKEN_URL`)?.trim() ?? defaults?.tokenUrl ?? '';
  const userInfoUrl = readEnv(`OAUTH_${envName}_USERINFO_URL`)?.trim() ?? defaults?.userInfoUrl ?? '';
  const rawScopes = readEnv(`OAUTH_${envName}_SCOPES`)?.trim() ?? defaults?.scopes?.join(' ') ?? '';
  const scopes = rawScopes
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const catalog = PROVIDER_CATALOG.find((item) => item.id === provider);
  if (!catalog) {
    throw new ApiError(404, 'OAuth provider not supported', 'oauth_provider_not_supported');
  }

  return {
    id: provider,
    label: catalog.label,
    description: catalog.description,
    clientId,
    clientSecret,
    authorizeUrl,
    tokenUrl,
    userInfoUrl,
    scopes
  };
}

function isSimulationMode() {
  return (readEnv('OAUTH_SIMULATION_MODE')?.trim() ?? 'true').toLowerCase() !== 'false';
}

export function isOAuthProviderConfigured(provider: OAuthProviderName) {
  const runtime = getProviderRuntime(provider);
  return Boolean(runtime.clientId && runtime.authorizeUrl);
}

function resolveCallbackUrl(event: RequestEventBase, provider: OAuthProviderName) {
  const forcedBaseUrl = readEnv('APP_BASE_URL')?.trim();
  const baseUrl = forcedBaseUrl && /^https?:\/\//i.test(forcedBaseUrl) ? forcedBaseUrl.replace(/\/+$/, '') : event.url.origin;
  return `${baseUrl}/api/auth/oauth/${provider}/callback`;
}

export function buildOAuthAuthorizeUrl(event: RequestEventBase, provider: OAuthProviderName, state: string, codeChallenge: string) {
  const runtime = getProviderRuntime(provider);
  const callbackUrl = resolveCallbackUrl(event, provider);
  const simulationEnabled = isSimulationMode();
  if (!simulationEnabled && !isOAuthProviderConfigured(provider)) {
    throw new ApiError(400, `Provider ${provider} is missing OAuth configuration`, 'oauth_provider_not_configured');
  }

  if (simulationEnabled) {
    const callbackQuery = new URLSearchParams({
      state,
      code: `local-${provider}-${Date.now()}`
    });
    return `/api/auth/oauth/${provider}/callback?${callbackQuery.toString()}`;
  }

  const query = new URLSearchParams({
    response_type: 'code',
    client_id: runtime.clientId,
    redirect_uri: callbackUrl,
    scope: runtime.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return `${runtime.authorizeUrl}?${query.toString()}`;
}

function parseJwtPayload(token: string) {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) {
    throw new ApiError(400, 'Invalid ID token payload', 'oauth_invalid_id_token');
  }

  const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = Buffer.from(padded, 'base64').toString('utf-8');

  return JSON.parse(decoded) as Record<string, unknown>;
}

function normalizeOAuthProfile(raw: Record<string, unknown>, provider: OAuthProviderName) {
  const subRaw = raw.sub ?? raw.id ?? raw.user_id;
  const emailRaw = raw.email ?? raw.preferred_username ?? raw.upn;
  const sub = typeof subRaw === 'string' && subRaw.trim() ? subRaw.trim() : `${provider}-${createToken(8)}`;
  const email =
    typeof emailRaw === 'string' && emailRaw.trim()
      ? emailRaw.trim().toLowerCase()
      : `demo.${provider}.user@health.local`;

  return {
    sub,
    email
  };
}

async function exchangeCodeForProfile(event: RequestEventBase, provider: OAuthProviderName, code: string, verifier: string): Promise<OAuthProfile> {
  const runtime = getProviderRuntime(provider);
  if (!runtime.clientId || !runtime.tokenUrl) {
    throw new ApiError(400, `Provider ${provider} is missing OAuth token configuration`, 'oauth_provider_not_configured');
  }

  const callbackUrl = resolveCallbackUrl(event, provider);
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: runtime.clientId,
    redirect_uri: callbackUrl,
    code_verifier: verifier
  });

  if (runtime.clientSecret) {
    tokenBody.set('client_secret', runtime.clientSecret);
  }

  const tokenResponse = await fetch(runtime.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenBody.toString()
  });

  if (!tokenResponse.ok) {
    throw new ApiError(502, `OAuth token exchange failed for ${provider}`, 'oauth_token_exchange_failed');
  }

  const tokenData = (await tokenResponse.json()) as Record<string, unknown>;
  const accessToken = typeof tokenData.access_token === 'string' ? tokenData.access_token : '';
  const idToken = typeof tokenData.id_token === 'string' ? tokenData.id_token : '';

  if (runtime.userInfoUrl && accessToken) {
    const userInfoResponse = await fetch(runtime.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (userInfoResponse.ok) {
      const userInfo = (await userInfoResponse.json()) as Record<string, unknown>;
      return normalizeOAuthProfile(userInfo, provider);
    }
  }

  if (idToken) {
    const idTokenPayload = parseJwtPayload(idToken);
    return normalizeOAuthProfile(idTokenPayload, provider);
  }

  throw new ApiError(502, `OAuth profile lookup failed for ${provider}`, 'oauth_profile_lookup_failed');
}

export async function resolveOAuthProfile(
  event: RequestEventBase,
  provider: OAuthProviderName,
  code: string,
  verifier: string
): Promise<OAuthProfile> {
  const simulationEnabled = isSimulationMode();
  if (!simulationEnabled && !isOAuthProviderConfigured(provider)) {
    throw new ApiError(400, `Provider ${provider} is missing OAuth configuration`, 'oauth_provider_not_configured');
  }

  if (simulationEnabled) {
    const email =
      event.url.searchParams.get('email')?.trim().toLowerCase() ??
      `demo.${provider}.user@health.local`;
    return {
      email,
      sub: `${provider}-${code}`
    };
  }

  return exchangeCodeForProfile(event, provider, code, verifier);
}
