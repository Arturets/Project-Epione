import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Tinker: Self-host Guide" subtitle="Run and customize the platform locally.">
      <section class="card">
        <h3>Quick Start</h3>
        <pre class="code-block"><code>{`pnpm install\npnpm dev`}</code></pre>
        <p class="muted">Default app URL: http://localhost:5173</p>
      </section>

      <section class="card">
        <h3>Docker Option</h3>
        <pre class="code-block"><code>{`docker compose up --build`}</code></pre>
        <p class="muted">Container URL: http://localhost:3000</p>
      </section>

      <section class="card">
        <h3>Customize</h3>
        <ul class="simple-list">
          <li>Edit intervention config in `src/config/interventions.ts`.</li>
          <li>Adjust suggestion rules in `src/config/rules.ts`.</li>
          <li>Tune graph edges in `src/config/graph.ts`.</li>
          <li>Switch persistence strategy in `src/lib/db.ts`.</li>
        </ul>
      </section>
    </MarketingShell>
  );
});
