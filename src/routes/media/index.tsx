import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Media" subtitle="Press kit and media inquiries.">
      <section class="card">
        <h3>Press Contact</h3>
        <p>press@project-epione.local</p>
      </section>
      <section class="card">
        <h3>Assets</h3>
        <p>Brand assets and product screenshots are available on request.</p>
      </section>
    </MarketingShell>
  );
});
