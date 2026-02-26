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
      <AppShell title="Insights" subtitle="Sign in to view personalized insight summaries.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <Link href="/auth/login" class="button">Login</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Insights" subtitle="Personalized summaries and decision support (scaffold)." userEmail={state.userEmail} csrfToken={state.csrfToken}>
      <section class="card">
        <h3>Weekly Insight Summary</h3>
        <p class="muted">This section will surface key drivers, trend shifts, and intervention opportunities.</p>
      </section>
      <section class="card">
        <h3>Action Priorities</h3>
        <p class="muted">Ranked recommendations with expected upside and confidence will appear here.</p>
      </section>
    </AppShell>
  );
});
