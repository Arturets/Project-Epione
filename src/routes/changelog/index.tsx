import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Changelog" subtitle="Product release notes for consumer-facing capabilities.">
      <section class="card">
        <h3>v0.1.0</h3>
        <ul class="simple-list">
          <li>Landing + consumer pages scaffolded.</li>
          <li>Dashboard, graph, interventions, snapshots, account flows wired.</li>
          <li>Consumer support, legal, and trust pages added.</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
