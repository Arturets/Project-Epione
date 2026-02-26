import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Contact" subtitle="Talk to us about product, support, and partnerships.">
      <section class="card">
        <h3>Email</h3>
        <p>support@project-epione.local</p>
      </section>
      <section class="card">
        <h3>Response Times</h3>
        <ul class="simple-list">
          <li>Starter: within 48 hours</li>
          <li>Coach: within 24 hours</li>
          <li>Team: priority response windows</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
