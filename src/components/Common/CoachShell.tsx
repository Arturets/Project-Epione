import { $, Slot, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Link, useLocation, useNavigate } from '@builder.io/qwik-city';
import { fetchApi } from '../../lib/client';

type Props = {
  title: string;
  subtitle?: string;
  userEmail?: string;
  csrfToken?: string;
};

const COACH_NAV = [
  { href: '/coach/dashboard', label: 'Dashboard' },
  { href: '/coach/clients', label: 'Clients' },
  { href: '/coach/care-plans', label: 'Care Plans' },
  { href: '/coach/messages', label: 'Messages' },
  { href: '/coach/alerts', label: 'Alerts' },
  { href: '/coach/reports', label: 'Reports' }
];

export const CoachShell = component$<Props>(({ title, subtitle, userEmail, csrfToken }) => {
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
    <div class="app-shell coach-shell">
      <header class="app-header coach-header">
        <div>
          <Link href="/" class="app-logo-link">
            <span class="landing-brand-dot" />
            Project Epione
          </Link>
          <div class="eyebrow">Coach Workspace</div>
          <h1 class="page-title">{title}</h1>
          {subtitle ? <p class="page-subtitle">{subtitle}</p> : null}
        </div>
        <div class="header-right">
          <Link href="/dashboard" class="button button-ghost">
            Consumer View
          </Link>
          <div class="user-chip">{userEmail ?? 'Coach'}</div>
          {userEmail ? (
            <button class="button button-ghost" type="button" onClick$={onLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <nav class="main-nav" aria-label="Coach navigation">
        {COACH_NAV.map((link) => (
          <a href={link.href} class={`nav-link ${location.url.pathname === link.href ? 'nav-link-active' : ''}`} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <main class="page-content">
        <Slot />
      </main>
    </div>
  );
});
