import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Partners" subtitle="Integrators, health programs, and data partners.">
      <section class="card">
        <h3>Partner Tracks</h3>
        <ul class="simple-list">
          <li>Coach and practitioner partnerships</li>
          <li>Wearable and data integrations</li>
          <li>Corporate wellness programs</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
