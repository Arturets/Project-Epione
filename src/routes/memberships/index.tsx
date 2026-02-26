import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Memberships" subtitle="Choose the level that matches your health optimization workflow.">
      <section class="landing-section-grid">
        <article class="card">
          <h3>Starter</h3>
          <p>Individual tracking, intervention simulation, and weekly snapshots.</p>
          <strong>$19 / month</strong>
        </article>
        <article class="card">
          <h3>Coach</h3>
          <p>Multi-client dashboards, shared notes, and priority support.</p>
          <strong>$79 / month</strong>
        </article>
        <article class="card">
          <h3>Team</h3>
          <p>Collaboration, compliance controls, and white-label deployment options.</p>
          <strong>Contact sales</strong>
        </article>
      </section>

      <section class="card">
        <div class="actions-row">
          <Link href="/auth/signup" class="button">Create account</Link>
        </div>
      </section>
    </MarketingShell>
  );
});
