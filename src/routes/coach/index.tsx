import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <section class="card">
      <h2>Coach Workspace Overview</h2>
      <p class="muted">This module is structured around client outcomes, intervention execution, and communication loops.</p>
      <div class="landing-section-grid">
        <article class="card">
          <h3>Client Panel Health</h3>
          <p>Monitor high-risk clients, overdue check-ins, and intervention adherence.</p>
          <Link href="/coach/dashboard" class="button button-ghost">Open dashboard</Link>
        </article>
        <article class="card">
          <h3>Care Plan Operations</h3>
          <p>Build and assign templates, then track progress against planned milestones.</p>
          <Link href="/coach/care-plans" class="button button-ghost">Open care plans</Link>
        </article>
        <article class="card">
          <h3>Communication Hub</h3>
          <p>Manage direct client messages and asynchronous check-ins.</p>
          <Link href="/coach/messages" class="button button-ghost">Open messages</Link>
        </article>
      </div>
    </section>
  );
});
