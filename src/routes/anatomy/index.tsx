import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MuscleHeadDiagram } from '../../components/Anatomy/MuscleHeadDiagram';
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
      <AppShell title="Anatomical Diagram" subtitle="Sign in to select muscle heads from the anatomy map.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <p class="muted">Sign in to open the head-by-head muscle selector.</p>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Anatomical Diagram"
      subtitle="Select specific muscles head-by-head from front/back views."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      <section class="card">
        <div class="section-header-row">
          <div>
            <h3>Muscle-Level Drilldown</h3>
            <p class="muted">Use this map for targeted planning, coaching notes, and intervention focus.</p>
          </div>
          <Link href="/graph" class="button button-ghost">
            Back to Graph
          </Link>
        </div>
      </section>

      <MuscleHeadDiagram />
    </AppShell>
  );
});
