import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { fetchSession } from '../../lib/session-client';
import { applyThemeToDocument, readStoredTheme, ThemeMode } from '../../lib/theme';
import { fetchApi } from '../../lib/client';
import { PRIMARY_OAUTH_PROVIDERS, SUGGESTED_OAUTH_PROVIDERS } from '../../config/oauth-providers';

type AccountTab = 'security' | 'privacy' | 'settings';
type AppearanceMode = ThemeMode;

function makeShareLink() {
  const token = Math.random().toString(36).slice(2, 10);
  return `https://project-epione.local/invite/${token}`;
}

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    activeTab: 'security' as AccountTab,
    recoveryEmail: '',
    shareLink: makeShareLink(),
    whereYouAppear: {
      profileSearch: true,
      providerDirectory: true,
      recommendationPanels: false
    },
    dataRegion: 'US-East (HIPAA-ready)',
    whoCanMessage: 'Care team only',
    measurementUnit: 'Metric',
    appearanceMode: 'Light' as AppearanceMode,
    pushNotifications: true,
    emailNotifications: true,
    connectedProviders: [] as string[],
    twoFactorEnabled: false,
    twoFactorSetupSecret: '',
    twoFactorOtpAuthUri: '',
    twoFactorCode: '',
    twoFactorRecoveryCodes: [] as string[],
    notice: '',
    error: ''
  });

  const setNotice = $((message: string) => {
    state.notice = message;
    state.error = '';
  });

  const applyAppearance = $((mode: AppearanceMode) => {
    state.appearanceMode = mode;
    applyThemeToDocument(mode);
  });

  const load = $(async () => {
    state.loading = true;
    const session = await fetchSession();

    if (!session.ok) {
      state.authenticated = false;
      state.loading = false;
      return;
    }

    state.authenticated = true;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;
    state.recoveryEmail = session.data.user.email;
    state.connectedProviders = Object.keys(session.data.user.oauthProviders ?? {});
    state.twoFactorEnabled = session.data.user.twoFactorEnabled;
    state.loading = false;
  });

  const copyShareLink = $(async () => {
    try {
      await navigator.clipboard.writeText(state.shareLink);
      await setNotice('Share link copied to clipboard.');
    } catch {
      state.error = 'Clipboard is unavailable in this browser context.';
    }
  });

  const regenerateShareLink = $(async () => {
    state.shareLink = makeShareLink();
    await setNotice('Generated a new account sharing link.');
  });

  const startTwoFactorSetup = $(async () => {
    if (!state.csrfToken) return;

    const response = await fetchApi<{
      secret: string;
      otpAuthUri: string;
      issuer: string;
      accountName: string;
    }>('/api/auth/2fa/setup', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      state.error = response.error.message;
      state.notice = '';
      return;
    }

    state.twoFactorSetupSecret = response.data.secret;
    state.twoFactorOtpAuthUri = response.data.otpAuthUri;
    state.twoFactorRecoveryCodes = [];
    await setNotice('2FA setup initialized. Scan the URI in your authenticator app and confirm with a code.');
  });

  const confirmTwoFactorSetup = $(async () => {
    if (!state.csrfToken) return;

    const response = await fetchApi<{ enabled: boolean; recoveryCodes: string[] }>('/api/auth/2fa/confirm', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        code: state.twoFactorCode
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      state.notice = '';
      return;
    }

    state.twoFactorEnabled = true;
    state.twoFactorSetupSecret = '';
    state.twoFactorOtpAuthUri = '';
    state.twoFactorCode = '';
    state.twoFactorRecoveryCodes = response.data.recoveryCodes;
    await setNotice('2FA enabled. Store your recovery codes securely.');
  });

  const disableTwoFactor = $(async () => {
    if (!state.csrfToken) return;

    const response = await fetchApi<{ enabled: boolean }>('/api/auth/2fa/disable', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        code: state.twoFactorCode
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      state.notice = '';
      return;
    }

    state.twoFactorEnabled = response.data.enabled;
    state.twoFactorCode = '';
    state.twoFactorSetupSecret = '';
    state.twoFactorOtpAuthUri = '';
    state.twoFactorRecoveryCodes = [];
    await setNotice('2FA disabled for this account.');
  });

  useVisibleTask$(async () => {
    await applyAppearance(readStoredTheme());
    await load();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Account" subtitle="Sign in to manage security, privacy, and settings.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <p class="muted">Login first to access your account controls.</p>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Account Center"
      subtitle="Manage security, privacy, integrations, and personal preferences."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading account details...</div> : null}
      {state.notice ? <div class="banner banner-success">{state.notice}</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}

      <section class="card">
        <div class="account-tabs" role="tablist" aria-label="Account sections">
          <button
            class={`account-tab ${state.activeTab === 'security' ? 'account-tab-active' : ''}`}
            type="button"
            onClick$={() => (state.activeTab = 'security')}
          >
            Security
          </button>
          <button
            class={`account-tab ${state.activeTab === 'privacy' ? 'account-tab-active' : ''}`}
            type="button"
            onClick$={() => (state.activeTab = 'privacy')}
          >
            Privacy
          </button>
          <button
            class={`account-tab ${state.activeTab === 'settings' ? 'account-tab-active' : ''}`}
            type="button"
            onClick$={() => (state.activeTab = 'settings')}
          >
            Settings
          </button>
        </div>
      </section>

      {state.activeTab === 'security' ? (
        <section class="grid two-col">
          <div class="card">
            <h3>Identity & Password</h3>

            <label class="field-label">Current email</label>
            <input class="input" value={state.userEmail} disabled />

            <label class="field-label">Recovery email</label>
            <input
              class="input"
              value={state.recoveryEmail}
              onInput$={(event) => (state.recoveryEmail = (event.target as HTMLInputElement).value)}
              placeholder="recovery@yourmail.com"
            />

            <div class="actions-row">
              <button class="button button-ghost" type="button" onClick$={() => setNotice('Password reset link sent.')}>Send password reset link</button>
              <button class="button button-ghost" type="button" onClick$={() => setNotice('One-time recovery code generated.')}>Generate recovery code</button>
              <button class="button" type="button" onClick$={() => setNotice('Recovery email updated (placeholder).')}>Save recovery email</button>
            </div>
          </div>

          <div class="card">
            <h3>2FA & OAuth Integrations</h3>
            <p class="muted">Google, Apple, Samsung, and Microsoft are login-ready; optional providers are listed below.</p>

            <div class="actions-row">
              <button class="button" type="button" onClick$={startTwoFactorSetup}>
                {state.twoFactorEnabled ? 'Rotate 2FA secret' : 'Set up 2FA'}
              </button>
            </div>

            <div class="metric-grid">
              <div class="metric-tile">
                <div class="metric-name">2FA status</div>
                <div class="metric-value">{state.twoFactorEnabled ? 'Enabled' : 'Disabled'}</div>
                <div class="metric-meta">Authenticator app (TOTP)</div>
              </div>
              <div class="metric-tile">
                <div class="metric-name">Connected OAuth providers</div>
                <div class="metric-value">{state.connectedProviders.length || 0}</div>
                <div class="metric-meta">{state.connectedProviders.length ? state.connectedProviders.join(', ') : 'None connected yet'}</div>
              </div>
            </div>

            {state.twoFactorOtpAuthUri ? (
              <>
                <label class="field-label">Authenticator URI</label>
                <textarea class="input" value={state.twoFactorOtpAuthUri} readOnly />
                <label class="field-label">Manual secret</label>
                <input class="input" value={state.twoFactorSetupSecret} readOnly />
              </>
            ) : null}

            <label class="field-label">2FA code</label>
            <input
              class="input"
              placeholder="123456"
              value={state.twoFactorCode}
              onInput$={(event) => (state.twoFactorCode = (event.target as HTMLInputElement).value)}
            />

            <div class="actions-row">
              <button class="button button-ghost" type="button" onClick$={confirmTwoFactorSetup}>
                Confirm 2FA setup
              </button>
              <button class="button button-ghost" type="button" onClick$={disableTwoFactor}>
                Disable 2FA
              </button>
            </div>

            {state.twoFactorRecoveryCodes.length ? (
              <>
                <h4>Recovery Codes</h4>
                <div class="integration-grid">
                  {state.twoFactorRecoveryCodes.map((code) => (
                    <span key={code} class="mini-chip">
                      {code}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            <h4>Primary OAuth providers</h4>
            <div class="integration-grid">
              {PRIMARY_OAUTH_PROVIDERS.map((provider) => (
                <a key={provider.id} class="button button-ghost" href={`/api/auth/oauth/${provider.id}/authorize`}>
                  {provider.label}
                </a>
              ))}
            </div>

            <h4>Suggested additional providers</h4>
            <div class="integration-grid">
              {SUGGESTED_OAUTH_PROVIDERS.map((provider) => (
                <a key={provider.id} class="button button-ghost" href={`/api/auth/oauth/${provider.id}/authorize`}>
                  {provider.label}
                </a>
              ))}
            </div>
          </div>

          <div class="card">
            <h3>Device Connections</h3>
            <div class="account-list">
              <div class="account-list-item">
                <div>
                  <strong>iPhone 15 Pro • iOS 18</strong>
                  <div class="muted small">Last active: today, 09:14</div>
                </div>
                <button class="button button-ghost" type="button" onClick$={() => setNotice('iPhone connection refreshed.')}>Refresh</button>
              </div>
              <div class="account-list-item">
                <div>
                  <strong>MacBook Pro • Safari</strong>
                  <div class="muted small">Last active: today, 08:55</div>
                </div>
                <button class="button button-ghost" type="button" onClick$={() => setNotice('MacBook session revoked (placeholder).')}>Revoke</button>
              </div>
              <div class="account-list-item">
                <div>
                  <strong>Apple Health Connector</strong>
                  <div class="muted small">Read-only sync active</div>
                </div>
                <button class="button button-ghost" type="button" onClick$={() => setNotice('Connector settings opened (placeholder).')}>Manage</button>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Account Sharing & App Integrations</h3>

            <label class="field-label">Account sharing link</label>
            <input class="input" value={state.shareLink} readOnly />

            <div class="actions-row">
              <button class="button button-ghost" type="button" onClick$={copyShareLink}>Copy link</button>
              <button class="button button-ghost" type="button" onClick$={regenerateShareLink}>Regenerate link</button>
            </div>

            <div class="qr-placeholder" aria-label="QR code field placeholder">
              <div class="qr-meta">QR code field</div>
              <div class="muted small">Share this with collaborators to join your workspace.</div>
            </div>

            <h4>App integrations</h4>
            <div class="integration-grid">
              <button class="button button-ghost" type="button" onClick$={() => setNotice('Slack integration connected (placeholder).')}>Slack</button>
              <button class="button button-ghost" type="button" onClick$={() => setNotice('Notion integration connected (placeholder).')}>Notion</button>
              <button class="button button-ghost" type="button" onClick$={() => setNotice('Zapier integration connected (placeholder).')}>Zapier</button>
              <button class="button button-ghost" type="button" onClick$={() => setNotice('Google Fit integration connected (placeholder).')}>Google Fit</button>
            </div>
          </div>
        </section>
      ) : null}

      {state.activeTab === 'privacy' ? (
        <section class="grid two-col">
          <div class="card">
            <h3>Where You Appear</h3>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={state.whereYouAppear.profileSearch}
                onChange$={(event) => (state.whereYouAppear.profileSearch = (event.target as HTMLInputElement).checked)}
              />
              <span>Profile search visibility</span>
            </label>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={state.whereYouAppear.providerDirectory}
                onChange$={(event) => (state.whereYouAppear.providerDirectory = (event.target as HTMLInputElement).checked)}
              />
              <span>Provider directory listing</span>
            </label>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={state.whereYouAppear.recommendationPanels}
                onChange$={(event) => (state.whereYouAppear.recommendationPanels = (event.target as HTMLInputElement).checked)}
              />
              <span>Recommendation and discovery panels</span>
            </label>
            <button class="button" type="button" onClick$={() => setNotice('Visibility preferences saved (placeholder).')}>Save visibility</button>
          </div>

          <div class="card">
            <h3>Data Residency & Compliance</h3>
            <label class="field-label">Where your data is stored</label>
            <select class="input" value={state.dataRegion} onChange$={(event) => (state.dataRegion = (event.target as HTMLSelectElement).value)}>
              <option>US-East (HIPAA-ready)</option>
              <option>US-West</option>
              <option>EU-Central (GDPR region)</option>
            </select>

            <div class="actions-row">
              <button class="button button-ghost" type="button" onClick$={() => setNotice('HIPAA compliance center opened (placeholder).')}>HIPAA</button>
              <button class="button button-ghost" type="button" onClick$={() => setNotice('GDPR data controls opened (placeholder).')}>GDPR</button>
            </div>

            <label class="field-label">Who can message you</label>
            <select class="input" value={state.whoCanMessage} onChange$={(event) => (state.whoCanMessage = (event.target as HTMLSelectElement).value)}>
              <option>Care team only</option>
              <option>Approved contacts only</option>
              <option>Anyone in the workspace</option>
              <option>Nobody</option>
            </select>

            <button class="button button-ghost" type="button" onClick$={() => setNotice('Messaging policy updated (placeholder).')}>Save messaging policy</button>
          </div>

          <div class="card">
            <h3>Danger Zone</h3>
            <p class="muted">Deleting data is irreversible. This button currently triggers a placeholder flow.</p>
            <button class="button button-danger" type="button" onClick$={() => setNotice('Data deletion confirmation flow opened (placeholder).')}>Delete your data</button>
          </div>
        </section>
      ) : null}

      {state.activeTab === 'settings' ? (
        <section class="grid two-col">
          <div class="card">
            <h3>Units of Measurement</h3>
            <div class="segmented-row">
              <button
                class={`button button-ghost ${state.measurementUnit === 'Metric' ? 'button-active' : ''}`}
                type="button"
                onClick$={() => (state.measurementUnit = 'Metric')}
              >
                Metric
              </button>
              <button
                class={`button button-ghost ${state.measurementUnit === 'Imperial' ? 'button-active' : ''}`}
                type="button"
                onClick$={() => (state.measurementUnit = 'Imperial')}
              >
                Imperial
              </button>
            </div>
            <button class="button" type="button" onClick$={() => setNotice(`Measurement updated to ${state.measurementUnit} (placeholder).`)}>Save measurement unit</button>
          </div>

          <div class="card">
            <h3>Appearance</h3>
            <div class="segmented-row">
              <button
                class={`button button-ghost ${state.appearanceMode === 'Light' ? 'button-active' : ''}`}
                type="button"
                onClick$={() => applyAppearance('Light')}
              >
                Light
              </button>
              <button
                class={`button button-ghost ${state.appearanceMode === 'Dark' ? 'button-active' : ''}`}
                type="button"
                onClick$={() => applyAppearance('Dark')}
              >
                Dark
              </button>
              <button
                class={`button button-ghost ${state.appearanceMode === 'Blackout' ? 'button-active' : ''}`}
                type="button"
                onClick$={() => applyAppearance('Blackout')}
              >
                Blackout mode
              </button>
            </div>
            <button class="button" type="button" onClick$={() => setNotice(`Appearance set to ${state.appearanceMode}.`)}>
              Save appearance
            </button>
          </div>

          <div class="card">
            <h3>Notifications</h3>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={state.pushNotifications}
                onChange$={(event) => (state.pushNotifications = (event.target as HTMLInputElement).checked)}
              />
              <span>Push notifications</span>
            </label>
            <label class="checkbox-row">
              <input
                type="checkbox"
                checked={state.emailNotifications}
                onChange$={(event) => (state.emailNotifications = (event.target as HTMLInputElement).checked)}
              />
              <span>Email notifications</span>
            </label>
            <button class="button" type="button" onClick$={() => setNotice('Notification settings updated (placeholder).')}>Save notification settings</button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
});
