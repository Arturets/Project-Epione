import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { MarketingShell } from '../components/Common/MarketingShell';

export default component$(() => {
  return (
    <MarketingShell>
      <section class="landing-hero">
        <div class="landing-hero-copy">
          <div class="landing-eyebrow">Project Epione</div>
          <h1>See how your health systems connect before you choose what to change.</h1>
          <p>
            Project Epione connects your key metrics into one explainable model. Track weight, body fat, VO2 max,
            RHR, HRV, sleep, and stress. Simulate interventions, catch contradictions, and measure progress with snapshots.
          </p>
          <div class="actions-row">
            <Link href="/auth/signup" class="button">
              Start Free
            </Link>
            <Link href="/dashboard" class="button button-ghost">
              Open Dashboard
            </Link>
          </div>
        </div>
        <div class="landing-hero-panel">
          <h3>For consumers</h3>
          <ul class="simple-list">
            <li>Build a baseline profile and monitor trends.</li>
            <li>Simulate interventions before committing to a plan.</li>
            <li>Track confidence and assumptions for each recommendation.</li>
            <li>Compare progress against your own historical snapshots.</li>
          </ul>
        </div>
      </section>

        <section class="landing-section-grid">
        <article class="card">
          <h3>How It Works</h3>
          <p class="muted">Follow the end-to-end loop from baseline capture to intervention outcomes.</p>
          <Link href="/how-it-works" class="button button-ghost">
            Explore flow
          </Link>
        </article>
        <article class="card">
          <h3>Science &amp; Methodology</h3>
          <p class="muted">Understand the evidence model, assumptions, and confidence framing.</p>
          <Link href="/science" class="button button-ghost">
            Read methodology
          </Link>
        </article>
          <article class="card">
            <h3>Memberships</h3>
            <p class="muted">Choose a plan with the depth of insights and support you need.</p>
            <Link href="/memberships" class="button button-ghost">
              View memberships
            </Link>
          </article>
          <article class="card">
            <h3>Coach Workspace</h3>
            <p class="muted">Manage client rosters, care plans, alerts, messaging, and reports.</p>
            <Link href="/coach/dashboard" class="button button-ghost">
              Open coach portal
            </Link>
          </article>
        </section>

      <section class="landing-testimonials-grid">
        <blockquote class="landing-quote">
          “I finally understand why sleep and stress were blocking fat-loss progress.”
          <cite>— Member</cite>
        </blockquote>
        <blockquote class="landing-quote">
          “The graph made complex tradeoffs easy to discuss with my coach.”
          <cite>— Consumer beta user</cite>
        </blockquote>
        <blockquote class="landing-quote">
          “Snapshot timelines turned vague goals into measurable changes.”
          <cite>— Health optimization user</cite>
        </blockquote>
      </section>
    </MarketingShell>
  );
});
