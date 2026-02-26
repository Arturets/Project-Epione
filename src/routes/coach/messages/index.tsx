import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <section class="grid two-col">
      <div class="card">
        <h2>Message Threads</h2>
        <div class="account-list">
          <div class="account-list-item">
            <div>
              <strong>Maya Rivera</strong>
              <div class="muted small">“Can we adjust my evening training?”</div>
            </div>
            <button class="button button-ghost">Open</button>
          </div>
          <div class="account-list-item">
            <div>
              <strong>Andre Thompson</strong>
              <div class="muted small">“HRV dropped again this morning.”</div>
            </div>
            <button class="button button-ghost">Open</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Quick Compose</h2>
        <label class="field-label">Client</label>
        <input class="input" placeholder="Select client" />
        <label class="field-label">Message</label>
        <textarea class="input" rows={6} placeholder="Write a coaching note" />
        <button class="button">Send</button>
      </div>
    </section>
  );
});
