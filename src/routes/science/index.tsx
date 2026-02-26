import { component$ } from '@builder.io/qwik';
import { MarketingShell } from '../../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell title="Science & Methodology" subtitle="How recommendations and simulations are framed.">
      <section class="card">
        <h3>Signal Model</h3>
        <p>
          The model links seven core metrics and captures directional relationships. Each intervention effect is mapped
          with assumptions and confidence.
        </p>
      </section>
      <section class="landing-section-grid">
        <article class="card">
          <h3>Evidence Inputs</h3>
          <p>Published exercise physiology and recovery evidence, simplified for consumer planning.</p>
        </article>
        <article class="card">
          <h3>Confidence Labels</h3>
          <p>Low, moderate, and high confidence labels communicate uncertainty clearly.</p>
        </article>
        <article class="card">
          <h3>Explainability</h3>
          <p>Every recommendation includes assumptions and the expected tradeoffs.</p>
        </article>
      </section>
    </MarketingShell>
  );
});
