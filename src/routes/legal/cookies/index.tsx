import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Cookie Policy" subtitle="Cookie and local storage usage (scaffold).">
      <section class="card">
        <p class="muted">This placeholder page should be replaced by final cookie categorization and controls.</p>
      </section>
    </MarketingShell>
  );
});
