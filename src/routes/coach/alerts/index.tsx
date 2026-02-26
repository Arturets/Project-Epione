import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <>
      <section class="card">
        <h2>Alerts & Escalations</h2>
        <p class="muted">Prioritized alert queue with placeholder severity routing.</p>
      </section>

      <section class="account-list">
        <article class="card">
          <h3>High • Andre Thompson</h3>
          <p>HRV down 3 consecutive days and self-reported stress above 8/10.</p>
          <div class="actions-row">
            <button class="button">Escalate</button>
            <button class="button button-ghost">Snooze 24h</button>
          </div>
        </article>
        <article class="card">
          <h3>Moderate • Maya Rivera</h3>
          <p>Sleep duration below target threshold 4 of last 7 days.</p>
          <div class="actions-row">
            <button class="button button-ghost">Create task</button>
            <button class="button button-ghost">Message client</button>
          </div>
        </article>
      </section>
    </>
  );
});
