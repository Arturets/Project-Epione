import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Social Channels" subtitle="Official channels and community touchpoints.">
      <section class="card">
        <ul class="simple-list">
          <li><a href="https://x.com" target="_blank" rel="noreferrer">X / Twitter</a></li>
          <li><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
          <li><a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
          <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
        </ul>
      </section>
    </MarketingShell>
  );
});
