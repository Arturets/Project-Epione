import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Privacy Policy" subtitle="How consumer data is handled (scaffold).">
      <section class="card">
        <p class="muted">This placeholder describes data collection, retention, and user controls at a high level.</p>
      </section>
    </MarketingShell>
  );
});
