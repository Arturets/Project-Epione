import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="How It Works" subtitle="From baseline capture to explainable outcomes.">
      <section class="landing-section-grid">
        <article class="card">
          <h3>1. Capture baseline</h3>
          <p>Log key metrics manually or through connected sources to establish your starting state.</p>
        </article>
        <article class="card">
          <h3>2. Visualize interconnections</h3>
          <p>See upstream/downstream relationships across weight, body fat, cardio fitness, recovery, and stress.</p>
        </article>
        <article class="card">
          <h3>3. Simulate interventions</h3>
          <p>Run predicted outcomes, compare confidence levels, and inspect potential contradictions.</p>
        </article>
      </section>
      <section class="card">
        <h3>4. Track and adapt</h3>
        <p>Save snapshots, compare deltas over time, and evolve your plan based on observed outcomes.</p>
        <div class="actions-row">
          <Link href="/dashboard" class="button">Open Dashboard</Link>
        </div>
      </section>
    </MarketingShell>
  );
});
