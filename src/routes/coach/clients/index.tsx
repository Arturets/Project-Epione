import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

const CLIENTS = [
  { id: 'maya-r', name: 'Maya Rivera', status: 'On track', nextCheckIn: 'Tomorrow' },
  { id: 'andre-t', name: 'Andre Thompson', status: 'Needs attention', nextCheckIn: 'Today' },
  { id: 'hannah-c', name: 'Hannah Chen', status: 'On track', nextCheckIn: 'Friday' }
];

export default component$(() => {
  return (
    <section class="card">
      <h2>Client Roster</h2>
      <p class="muted">Search/filter tooling can be added here; this scaffold shows core roster workflow.</p>
      <div class="account-list">
        {CLIENTS.map((client) => (
          <div class="account-list-item" key={client.id}>
            <div>
              <strong>{client.name}</strong>
              <div class="muted small">Status: {client.status}</div>
              <div class="muted small">Next check-in: {client.nextCheckIn}</div>
            </div>
            <Link href={`/coach/clients/${client.id}`} class="button button-ghost">Open profile</Link>
          </div>
        ))}
      </div>
    </section>
  );
});
