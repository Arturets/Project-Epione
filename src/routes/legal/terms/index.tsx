import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Terms of Service" subtitle="Consumer usage terms (scaffold).">
      <section class="card">
        <p class="muted">This is a placeholder terms page. Replace with reviewed legal language before production.</p>
      </section>
    </MarketingShell>
  );
});
