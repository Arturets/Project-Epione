import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Compliance" subtitle="HIPAA/GDPR scope and control surface (scaffold).">
      <section class="card">
        <ul class="simple-list">
          <li>Account-level privacy controls are available in the Account Center.</li>
          <li>Security controls include session cookies, CSRF checks, and audit events.</li>
          <li>Replace this placeholder with legal/compliance-approved statements.</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
