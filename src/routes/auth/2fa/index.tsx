import { $, component$, useStore } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { AppShell } from '../../../components/Common/AppShell';
import { fetchApi } from '../../../lib/client';

type VerifyResponse = {
  user: {
    id: string;
    email: string;
  };
  csrfToken: string;
  expiresAt: string;
};

export default component$(() => {
  const nav = useNavigate();
  const location = useLocation();
  const state = useStore({
    code: '',
    loading: false,
    error: ''
  });

  const challengeId = location.url.searchParams.get('challenge')?.trim() ?? '';

  const onSubmit = $(async () => {
    if (!challengeId) {
      state.error = 'Missing two-factor challenge. Please sign in again.';
      return;
    }

    state.loading = true;
    state.error = '';

    const response = await fetchApi<VerifyResponse>('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        challengeId,
        code: state.code
      })
    });

    state.loading = false;

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    await nav('/dashboard');
  });

  return (
    <AppShell title="Two-Factor Verification" subtitle="Enter the code from your authenticator app or a recovery code.">
      <section class="auth-grid">
        <div class="auth-form-card">
          <h2>Complete sign in</h2>
          <p class="muted">This account requires a second factor before opening your session.</p>

          <label class="field-label" for="two-factor-code">
            2FA code
          </label>
          <input
            id="two-factor-code"
            class="input"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={state.code}
            onInput$={(event) => (state.code = (event.target as HTMLInputElement).value)}
          />

          {state.error ? <div class="inline-error">{state.error}</div> : null}

          <button class="button" type="button" disabled={state.loading} onClick$={onSubmit}>
            {state.loading ? 'Verifying...' : 'Verify and continue'}
          </button>
        </div>
      </section>
    </AppShell>
  );
});
