import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <>
      <section class="card">
        <h2>Coach Reports</h2>
        <p class="muted">Generate weekly and monthly summaries for client panels.</p>
        <div class="actions-row">
          <button class="button">Generate weekly report</button>
          <button class="button button-ghost">Generate monthly report</button>
        </div>
      </section>

      <section class="grid two-col">
        <div class="card">
          <h3>Panel Summary</h3>
          <ul class="simple-list">
            <li>Average adherence: 81%</li>
            <li>Avg sleep delta: +0.4h vs baseline</li>
            <li>Risk alerts resolved: 12 this month</li>
          </ul>
        </div>
        <div class="card">
          <h3>Export Targets</h3>
          <ul class="simple-list">
            <li>PDF snapshot packets</li>
            <li>CSV metric timelines</li>
            <li>Coach note history</li>
          </ul>
        </div>
      </section>
    </>
  );
});
