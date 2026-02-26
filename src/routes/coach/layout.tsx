import { $, Slot, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { CoachShell } from '../../components/Common/CoachShell';
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
      <div class="app-shell">
        <section class="card card-center">
          <h2>Coach access requires sign in</h2>
          <p class="muted">Please sign in and use an account with coach permissions.</p>
          <div class="actions-row">
            <Link href="/auth/login" class="button">
              Login
            </Link>
            <Link href="/" class="button button-ghost">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div class="app-shell">
        <section class="card">Loading coach workspace...</section>
      </div>
    );
  }

  return (
    <CoachShell title="Coach Portal" subtitle="Client oversight, care planning, messaging, and reporting." userEmail={state.userEmail} csrfToken={state.csrfToken}>
      <Slot />
    </CoachShell>
  );
});
