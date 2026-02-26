import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Product Statement & Vision" subtitle="Make health recommendations coherent by connecting every metric, assumption, and tradeoff.">
      <section class="card">
        <h3>Statement</h3>
        <p>
          Generic advice fails because it ignores personal context. Project Epione provides a local-first,
          explainable system where a user can inspect how sleep, stress, cardio, and body composition interact.
        </p>
      </section>

      <section class="card">
        <h3>Vision</h3>
        <ul class="simple-list">
          <li>One state model for all core health signals.</li>
          <li>One graph to show upstream and downstream effects.</li>
          <li>One intervention layer with explicit assumptions and contraindications.</li>
          <li>One timeline to compare reality against predicted outcomes.</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
