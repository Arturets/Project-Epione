import { $, component$, useStore } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { fetchApi } from '../../lib/client';

type LoginResponse = {
  requiresTwoFactor?: boolean;
  challengeId?: string;
  user?: {
    id: string;
    email: string;
  };
  csrfToken?: string;
  expiresAt: string;
};

export const LoginForm = component$(() => {
  const nav = useNavigate();
  const state = useStore({
    email: '',
    password: '',
    loading: false,
    error: ''
  });

  const onSubmit = $(async () => {
    state.loading = true;
    state.error = '';

    const response = await fetchApi<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: state.email,
        password: state.password
      })
    });

    state.loading = false;

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    if (response.data.requiresTwoFactor && response.data.challengeId) {
      await nav(`/auth/2fa?challenge=${encodeURIComponent(response.data.challengeId)}`);
      return;
    }

    await nav('/dashboard');
  });

  return (
    <div class="auth-form-card">
      <h2>Sign in</h2>
      <p class="muted">Use your email/password or OAuth.</p>

      <label class="field-label" for="login-email">
        Email
      </label>
      <input id="login-email" class="input" type="email" value={state.email} onInput$={(event) => (state.email = (event.target as HTMLInputElement).value)} />

      <label class="field-label" for="login-password">
        Password
      </label>
      <input
        id="login-password"
        class="input"
        type="password"
        value={state.password}
        onInput$={(event) => (state.password = (event.target as HTMLInputElement).value)}
      />

      {state.error ? <div class="inline-error">{state.error}</div> : null}

      <button class="button" type="button" disabled={state.loading} onClick$={onSubmit}>
        {state.loading ? 'Signing in...' : 'Sign in'}
      </button>
    </div>
  );
});
