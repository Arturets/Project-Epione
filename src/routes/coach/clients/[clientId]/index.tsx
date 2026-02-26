import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const location = useLocation();
  const clientId = location.params.clientId;

  return (
    <>
      <section class="card">
        <h2>Client Profile: {clientId}</h2>
        <p class="muted">Placeholder profile showing core coach workflows for an individual client.</p>
        <div class="actions-row">
          <button class="button">Send check-in</button>
          <button class="button button-ghost">Update care plan</button>
          <button class="button button-ghost">Record note</button>
        </div>
      </section>

      <section class="grid two-col">
        <div class="card">
          <h3>Current Focus Areas</h3>
          <ul class="simple-list">
            <li>Sleep consistency below target (5 of last 7 days)</li>
            <li>Stress index rising over 2-week window</li>
            <li>Training adherence at 72%</li>
          </ul>
        </div>
        <div class="card">
          <h3>Latest Coach Notes</h3>
          <ul class="simple-list">
            <li>Adjust evening routine intervention and reassess in 5 days.</li>
            <li>Reduce cardio volume temporarily during recovery week.</li>
            <li>Request subjective fatigue scale each morning.</li>
          </ul>
        </div>
      </section>

      <section class="card">
        <Link href="/coach/clients" class="button button-ghost">Back to roster</Link>
      </section>
    </>
  );
});
