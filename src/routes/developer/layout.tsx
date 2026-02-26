import { $, Slot, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { fetchSession } from '../../lib/session-client';

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    authorized: false,
    userEmail: '',
    csrfToken: ''
  });

  const load = $(async () => {
    const session = await fetchSession();
    if (!session.ok) {
      state.loading = false;
      state.authenticated = false;
      state.authorized = false;
      return;
    }

    state.authenticated = true;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;
    state.authorized = session.data.user.role === 'admin';
    state.loading = false;
  });

  useVisibleTask$(async () => {
    await load();
  });

  if (state.loading) {
    return (
      <AppShell title="Developer Console" subtitle="Loading developer workspace..." userEmail={state.userEmail} csrfToken={state.csrfToken}>
        <section class="card">Loading developer access...</section>
      </AppShell>
    );
  }

  if (!state.authenticated) {
    return (
      <AppShell title="Developer Console" subtitle="Admin authentication is required.">
        <section class="card card-center">
          <h2>Sign in required</h2>
          <p class="muted">Use an admin account to access developer tools.</p>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!state.authorized) {
    return (
      <AppShell title="Developer Console" subtitle="Admin role required." userEmail={state.userEmail} csrfToken={state.csrfToken}>
        <section class="card card-center">
          <h2>Access denied</h2>
          <p class="muted">Your account does not have admin permissions.</p>
          <Link href="/dashboard" class="button button-ghost">
            Back to dashboard
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Developer Console"
      subtitle="Intervention versioning, architecture visibility, and usage analytics."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      <Slot />
    </AppShell>
  );
});
