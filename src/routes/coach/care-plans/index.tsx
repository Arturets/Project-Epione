import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <>
      <section class="card">
        <h2>Care Plans</h2>
        <p class="muted">Template library and assignment pipeline for coach workflows.</p>
        <div class="actions-row">
          <button class="button">Create new plan</button>
          <button class="button button-ghost">Import template</button>
        </div>
      </section>

      <section class="landing-section-grid">
        <article class="card">
          <h3>Recovery Reset</h3>
          <p>4-week protocol focusing on sleep + stress normalization.</p>
          <div class="muted small">Assigned: 8 clients</div>
        </article>
        <article class="card">
          <h3>Body Composition Cycle</h3>
          <p>8-week nutrition and resistance plan with staged targets.</p>
          <div class="muted small">Assigned: 14 clients</div>
        </article>
        <article class="card">
          <h3>Cardio Base Builder</h3>
          <p>Progressive aerobic protocol with HRV safety thresholds.</p>
          <div class="muted small">Assigned: 10 clients</div>
        </article>
      </section>
    </>
  );
});
