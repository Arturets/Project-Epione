import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Careers" subtitle="Build consumer-first Project Epione tools with us.">
      <section class="card">
        <h3>Open Roles</h3>
        <ul class="simple-list">
          <li>Product Designer (Consumer Experience)</li>
          <li>Frontend Engineer (Qwik/TypeScript)</li>
          <li>Health Data Analyst</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
