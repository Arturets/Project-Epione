import { $, component$, useStore } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { fetchApi } from '../../lib/client';

type SignupResponse = {
  user: {
    id: string;
    email: string;
  };
  csrfToken: string;
  expiresAt: string;
};

export const SignupForm = component$(() => {
  const nav = useNavigate();
  const state = useStore({
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,
    error: ''
  });

  const onSubmit = $(async () => {
    if (state.password !== state.confirmPassword) {
      state.error = 'Passwords do not match.';
      return;
    }

    state.loading = true;
    state.error = '';

    const response = await fetchApi<SignupResponse>('/api/auth/signup', {
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

    await nav('/dashboard');
  });

  return (
    <div class="auth-form-card">
      <h2>Create account</h2>
      <p class="muted">Session-based auth with secure cookies and inactivity timeout.</p>

      <label class="field-label" for="signup-email">
        Email
      </label>
      <input id="signup-email" class="input" type="email" value={state.email} onInput$={(event) => (state.email = (event.target as HTMLInputElement).value)} />

      <label class="field-label" for="signup-password">
        Password
      </label>
      <input
        id="signup-password"
        class="input"
        type="password"
        value={state.password}
        onInput$={(event) => (state.password = (event.target as HTMLInputElement).value)}
      />

      <label class="field-label" for="signup-confirm-password">
        Confirm Password
      </label>
      <input
        id="signup-confirm-password"
        class="input"
        type="password"
        value={state.confirmPassword}
        onInput$={(event) => (state.confirmPassword = (event.target as HTMLInputElement).value)}
      />

      {state.error ? <div class="inline-error">{state.error}</div> : null}

      <button class="button" type="button" disabled={state.loading} onClick$={onSubmit}>
        {state.loading ? 'Creating account...' : 'Create account'}
      </button>
    </div>
  );
});
