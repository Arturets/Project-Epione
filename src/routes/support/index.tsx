import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Support" subtitle="Get help with setup, metrics, and simulations.">
      <section class="landing-section-grid">
        <article class="card">
          <h3>Guides</h3>
          <p>Step-by-step guides for onboarding, logging, syncing, and interpreting trends.</p>
          <Link href="/faq" class="button button-ghost">Open FAQ</Link>
        </article>
        <article class="card">
          <h3>Contact Support</h3>
          <p>Reach product support for account access, data issues, or feature questions.</p>
          <Link href="/contact" class="button button-ghost">Contact team</Link>
        </article>
        <article class="card">
          <h3>Service Health</h3>
          <p>Check uptime and incident updates.</p>
          <Link href="/status" class="button button-ghost">View status</Link>
        </article>
      </section>
    </MarketingShell>
  );
});
