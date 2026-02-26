import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <>
      <section class="landing-section-grid">
        <article class="card">
          <h3>Active Clients</h3>
          <div class="metric-value">42</div>
          <p class="muted">4 new this week</p>
        </article>
        <article class="card">
          <h3>High-Risk Alerts</h3>
          <div class="metric-value">7</div>
          <p class="muted">2 require action today</p>
        </article>
        <article class="card">
          <h3>Avg Adherence</h3>
          <div class="metric-value">81%</div>
          <p class="muted">+3% vs previous week</p>
        </article>
      </section>

      <section class="grid two-col">
        <div class="card">
          <h3>Today’s Priorities</h3>
          <ul class="simple-list">
            <li>Review sleep regression alerts for 3 clients.</li>
            <li>Approve 2 revised care plans awaiting confirmation.</li>
            <li>Complete weekly summary notes for athlete cohort.</li>
          </ul>
        </div>
        <div class="card">
          <h3>Recent Events</h3>
          <ul class="simple-list">
            <li>Client check-in submitted: Maya R. (10 min ago)</li>
            <li>Snapshot delta warning: Andre T. (22 min ago)</li>
            <li>New message from Hannah C. (45 min ago)</li>
          </ul>
        </div>
      </section>
    </>
  );
});
