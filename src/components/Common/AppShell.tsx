import { $, Slot, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { fetchApi } from '../../lib/client';
import { SyncStatus } from './SyncStatus';

type Props = {
  title: string;
  subtitle?: string;
  userEmail?: string;
  csrfToken?: string;
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/graph', label: 'Graph' },
  { href: '/anatomy', label: 'Anatomy' },
  { href: '/interventions', label: 'Interventions' },
  { href: '/insights', label: 'Insights' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/coach/dashboard', label: 'Coach Portal' },
  { href: '/developer/console', label: 'Developer Console' },
  { href: '/snapshots', label: 'Snapshots' },
  { href: '/billing', label: 'Billing' },
  { href: '/account', label: 'Account' },
  { href: '/settings', label: 'Settings' }
];

export const AppShell = component$<Props>(({ title, subtitle, userEmail, csrfToken }) => {
  const location = useLocation();
  const nav = useNavigate();
  const lastTrackedPath = useSignal('');

  const onLogout = $(async () => {
    if (!csrfToken) {
      await nav('/auth/login');
      return;
    }

    await fetchApi('/api/auth/logout', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({})
    });

    await nav('/auth/login');
  });

  useVisibleTask$(async ({ track }) => {
    const path = track(() => location.url.pathname);
    if (!userEmail || !csrfToken) return;
    if (lastTrackedPath.value === path) return;

    lastTrackedPath.value = path;
    await fetchApi('/api/events/page-visit', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({
        route: path,
        referrer: document.referrer || null
      })
    });
  });

  return (
    <div class="app-shell">
      <header class="app-header">
        <div>
          <Link href="/" class="app-logo-link">
            <span class="landing-brand-dot" />
            Project Epione
          </Link>
          <div class="eyebrow">Project Epione</div>
          <h1 class="page-title">{title}</h1>
          {subtitle ? <p class="page-subtitle">{subtitle}</p> : null}
        </div>
        <div class="header-right">
          <div class="user-chip">{userEmail ?? 'Guest'}</div>
          {userEmail ? (
            <button class="button button-ghost" type="button" onClick$={onLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      {userEmail ? (
        <nav class="main-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a href={link.href} class={`nav-link ${location.url.pathname === link.href ? 'nav-link-active' : ''}`} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}

      <main class="page-content">
        <Slot />
      </main>

      {userEmail ? <SyncStatus csrfToken={csrfToken} /> : null}
    </div>
  );
});
