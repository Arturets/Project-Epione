import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { fetchSession } from '../../lib/session-client';

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: ''
  });

  const load = $(async () => {
    const session = await fetchSession();
    if (!session.ok) {
      state.authenticated = false;
      state.loading = false;
      return;
    }
    state.authenticated = true;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;
    state.loading = false;
  });

  useVisibleTask$(async () => {
    await load();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Integrations" subtitle="Sign in to manage integrations.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <Link href="/auth/login" class="button">Login</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Integrations" subtitle="Connect data sources and external apps (scaffold)." userEmail={state.userEmail} csrfToken={state.csrfToken}>
      <section class="landing-section-grid">
        <article class="card">
          <h3>Apple Health</h3>
          <p class="muted">Read-only health metric sync.</p>
          <button class="button button-ghost" type="button">Configure</button>
        </article>
        <article class="card">
          <h3>Wearables</h3>
          <p class="muted">Connect Whoop, Oura, Garmin, Fitbit (planned).</p>
          <button class="button button-ghost" type="button">Connect</button>
        </article>
        <article class="card">
          <h3>Lab Data</h3>
          <p class="muted">Import bloodwork and biomarker panels (planned).</p>
          <button class="button button-ghost" type="button">Import</button>
        </article>
      </section>
    </AppShell>
  );
});
