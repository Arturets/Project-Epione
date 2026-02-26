import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Status" subtitle="Service health and incident communication.">
      <section class="card">
        <h3>Current Status</h3>
        <p><strong>All systems operational</strong></p>
      </section>
      <section class="card">
        <h3>Recent Incidents</h3>
        <p class="muted">No incidents reported in this scaffolding build.</p>
      </section>
    </MarketingShell>
  );
});
