import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Trust Center" subtitle="Privacy, security, and compliance controls for consumers.">
      <section class="landing-section-grid">
        <article class="card">
          <h3>Data privacy</h3>
          <p>Consumer data controls, retention expectations, and account-level privacy settings.</p>
          <Link href="/legal/privacy" class="button button-ghost">Privacy policy</Link>
        </article>
        <article class="card">
          <h3>Security model</h3>
          <p>Session-based auth, CSRF protection, and audit event logging for critical actions.</p>
          <Link href="/account" class="button button-ghost">Account security</Link>
        </article>
        <article class="card">
          <h3>Compliance scope</h3>
          <p>HIPAA/GDPR controls are surfaced as policy and account controls in this build.</p>
          <Link href="/legal/compliance" class="button button-ghost">Compliance details</Link>
        </article>
      </section>
    </MarketingShell>
  );
});
