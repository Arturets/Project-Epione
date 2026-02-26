import { $, Slot, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { fetchSession } from '../../lib/session-client';

type Props = {
  title?: string;
  subtitle?: string;
};

const MARKETING_LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/science', label: 'Science' },
  { href: '/memberships', label: 'Memberships' },
  { href: '/coach/dashboard', label: 'Coach Portal' },
  { href: '/tinker', label: 'Tinker' },
  { href: '/product-audit', label: 'Product Audit' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/vision', label: 'Statement & Vision' },
  { href: '/support', label: 'Support' }
];

export const MarketingShell = component$<Props>(({ title, subtitle }) => {
  const state = useStore({
    isLoggedIn: false,
    userEmail: '',
    searchQuery: ''
  });

  const loadSession = $(async () => {
    const session = await fetchSession();
    if (session.ok) {
      state.isLoggedIn = true;
      state.userEmail = session.data.user.email;
    }
  });

  useVisibleTask$(async () => {
    await loadSession();
  });

  return (
    <div class="landing-page">
      <header class="landing-nav-wrap">
        <div class="landing-nav-inner">
          <Link href="/" class="landing-brand">
            <span class="landing-brand-dot" />
            Project Epione
          </Link>

          <form class="landing-search" preventdefault:submit>
            <input
              class="input"
              type="search"
              placeholder="Search features, docs, interventions"
              value={state.searchQuery}
              onInput$={(event) => (state.searchQuery = (event.target as HTMLInputElement).value)}
            />
          </form>

          <nav class="landing-nav-links" aria-label="Primary">
            {MARKETING_LINKS.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div class="landing-auth-actions">
            {state.isLoggedIn ? (
              <>
                <Link href="/dashboard" class="button button-ghost">
                  Dashboard
                </Link>
                <Link href="/account" class="button">
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" class="button button-ghost">
                  Login
                </Link>
                <Link href="/auth/signup" class="button">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main class="landing-main">
        {title ? (
          <section class="card">
            <h1>{title}</h1>
            {subtitle ? <p class="muted">{subtitle}</p> : null}
          </section>
        ) : null}
        <Slot />
      </main>

      <footer class="landing-footer">
        <div class="landing-footer-grid">
          <div>
            <h4>Legal</h4>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/cookies">Cookie Policy</Link>
            <Link href="/trust">Trust Center</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/contact">Contact</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/media">Media</Link>
            <Link href="/partners">Partners</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link href="/support">Support Hub</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/status">Status</Link>
            <Link href="/changelog">Changelog</Link>
          </div>
          <div>
            <h4>Socials</h4>
            <Link href="/social">Social Channels</Link>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://x.com" target="_blank" rel="noreferrer">X / Twitter</a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer">YouTube</a>
          </div>
          <div>
            <h4>Other</h4>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/science">Science</Link>
            <Link href="/memberships">Memberships</Link>
            <Link href="/coach/dashboard">Coach Portal</Link>
            <Link href="/tinker">Tinker</Link>
            <Link href="/product-audit">Product Audit</Link>
            <Link href="/vision">Vision</Link>
          </div>
        </div>
        <div class="landing-footer-meta">
          <span>© {new Date().getFullYear()} Project Epione</span>
          <span>{state.isLoggedIn ? `Signed in as ${state.userEmail}` : 'Public preview mode'}</span>
        </div>
      </footer>
    </div>
  );
});
