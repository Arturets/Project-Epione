import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { fetchApi } from '../../lib/client';
import { fetchSession } from '../../lib/session-client';

type SettingsResponse = {
  id: string;
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'mi';
  createdAt: string;
  updatedAt: string;
};

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    distanceUnit: 'km' as 'km' | 'mi',
    error: '',
    message: ''
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

    const settings = await fetchApi<SettingsResponse>('/api/settings');
    if (!settings.ok) {
      state.error = settings.error.message;
      state.loading = false;
      return;
    }

    state.weightUnit = settings.data.weightUnit;
    state.distanceUnit = settings.data.distanceUnit;
    state.loading = false;
  });

  const save = $(async () => {
    if (!state.csrfToken) return;

    const response = await fetchApi<SettingsResponse>('/api/settings', {
      method: 'PUT',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        weight_unit: state.weightUnit,
        distance_unit: state.distanceUnit
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = 'Settings updated.';
  });

  useVisibleTask$(async () => {
    await load();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Settings" subtitle="Sign in to update preferences.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      subtitle="User preferences and deployment/security notes."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading settings...</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}
      {state.message ? <div class="banner banner-success">{state.message}</div> : null}

      <section class="card">
        <h3>User Preferences</h3>

        <label class="field-label">Weight unit</label>
        <select class="input" value={state.weightUnit} onChange$={(event) => (state.weightUnit = (event.target as HTMLSelectElement).value as 'kg' | 'lbs')}>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>

        <label class="field-label">Distance unit</label>
        <select
          class="input"
          value={state.distanceUnit}
          onChange$={(event) => (state.distanceUnit = (event.target as HTMLSelectElement).value as 'km' | 'mi')}
        >
          <option value="km">km</option>
          <option value="mi">mi</option>
        </select>

        <button class="button" type="button" onClick$={save}>
          Save settings
        </button>
      </section>

      <section class="card">
        <h3>Security & Runtime Notes</h3>
        <ul class="simple-list">
          <li>Session cookies are httpOnly and SameSite=Lax. Session inactivity timeout is 30 days.</li>
          <li>State-changing endpoints enforce CSRF via x-csrf-token.</li>
          <li>Auth endpoints include rate limiting and email/password validation.</li>
          <li>Local-first mode persists app data to a JSON store in `.data/health-db.json`.</li>
        </ul>
      </section>
    </AppShell>
  );
});
