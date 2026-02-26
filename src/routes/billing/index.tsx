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
      <AppShell title="Billing" subtitle="Sign in to manage memberships and billing.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <Link href="/auth/login" class="button">Login</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Billing & Membership" subtitle="Plans, invoices, and payment method management (scaffold)." userEmail={state.userEmail} csrfToken={state.csrfToken}>
      <section class="card">
        <h3>Current Plan</h3>
        <p><strong>Starter</strong> — $19/month</p>
        <div class="actions-row">
          <button class="button">Upgrade plan</button>
          <button class="button button-ghost">Manage payment method</button>
        </div>
      </section>
      <section class="card">
        <h3>Invoices</h3>
        <p class="muted">Invoice history and downloadable receipts will appear here.</p>
      </section>
    </AppShell>
  );
});
