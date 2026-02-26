import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Product Audit" subtitle="Implementation and quality snapshot for the current MVP build.">
      <section class="card">
        <h3>Audit Checklist</h3>
        <ul class="simple-list">
          <li>Auth flows: password + OAuth routes present, session cookies + CSRF checks active.</li>
          <li>Metrics: manual logging, history, and latest-state endpoints implemented.</li>
          <li>Interventions: simulation tables and contraindication warnings available.</li>
          <li>Snapshots: create/list/delete and comparison UI implemented.</li>
          <li>Landing + route coverage: public pages and account area are fully navigable.</li>
        </ul>
      </section>

      <section class="card">
        <h3>Known Gaps</h3>
        <ul class="simple-list">
          <li>Placeholder actions on account settings are not persisted to backend yet.</li>
          <li>OAuth callbacks are local simulation flows, not production provider exchange.</li>
          <li>No external observability integration is enabled by default in local mode.</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
