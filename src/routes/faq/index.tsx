import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="FAQ" subtitle="Common questions from consumer members.">
      <section class="card">
        <h3>Do I need a wearable?</h3>
        <p>No. You can start with manual metric entries and connect devices later.</p>
      </section>
      <section class="card">
        <h3>Are intervention results guaranteed?</h3>
        <p>No. Predictions are directional and assumption-based; actual outcomes vary by adherence and context.</p>
      </section>
      <section class="card">
        <h3>Can I export my data?</h3>
        <p>Data export tooling is planned in follow-up releases.</p>
      </section>
    </MarketingShell>
  );
});
