import { $, component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { fetchApi } from '../../lib/client';
import {
  ConsentMode,
  emitConsentEvent,
  getConsentModeFromUrl,
  getStoredConsentMode,
  loadConsent,
  saveConsent,
  setStoredConsentMode
} from '../../lib/consent';

type Props = {
  mode?: ConsentMode;
  csrfToken?: string;
};

type ClearStatus = {
  lastAction: string;
  lastResult: 'idle' | 'success' | 'error';
  message: string;
};

const DEFAULT_PREFS = {
  functional: false,
  analytics: false
};

const CONSENT_VERSION = 1 as const;

const deleteNonHttpOnlyCookies = () => {
  if (typeof document === 'undefined') return 0;
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim()).filter(Boolean);
  let cleared = 0;
  for (const cookie of cookies) {
    const [name] = cookie.split('=');
    if (!name) continue;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    cleared += 1;
  }
  return cleared;
};

const clearCacheStorage = async () => {
  if (typeof caches === 'undefined') return 0;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
  return keys.length;
};

const clearIndexedDb = async () => {
  if (typeof indexedDB === 'undefined') return 0;
  if (!('databases' in indexedDB)) return 0;
  const databases = await (indexedDB as IDBFactory & { databases: () => Promise<IDBDatabaseInfo[]> }).databases();
  let cleared = 0;
  await Promise.all(
    databases.map((db) => {
      if (!db.name) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(db.name as string);
        request.onsuccess = () => {
          cleared += 1;
          resolve();
        };
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    })
  );
  return cleared;
};

export const CookieConsentPanel = component$<Props>(({ mode, csrfToken }) => {
  const state = useStore({
    ready: false,
    open: false,
    mode: (mode ?? 'gdpr') as ConsentMode,
    functional: DEFAULT_PREFS.functional,
    analytics: DEFAULT_PREFS.analytics,
    hasStoredConsent: false,
    saving: false,
    showClearMenu: false,
    clearStatus: {
      lastAction: '',
      lastResult: 'idle',
      message: ''
    } as ClearStatus
  });

  const showFab = useSignal(false);

  const syncFromStorage = $(() => {
    const urlMode = getConsentModeFromUrl();
    const storedMode = getStoredConsentMode();
    const resolvedMode = mode ?? urlMode ?? storedMode ?? 'gdpr';
    state.mode = resolvedMode;
    if (urlMode) {
      setStoredConsentMode(urlMode);
    }

    const stored = loadConsent();
    if (stored) {
      state.functional = stored.functional;
      state.analytics = stored.analytics;
      state.hasStoredConsent = true;
      showFab.value = true;
    } else {
      state.hasStoredConsent = false;
      state.open = true;
      showFab.value = false;
    }
  });

  const persistConsent = $(async (prefs: { functional: boolean; analytics: boolean }) => {
    state.saving = true;
    const payload = {
      ...prefs,
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION
    };

    saveConsent(payload);

    emitConsentEvent('consent:updated', {
      mode: state.mode,
      ...payload
    });

    emitConsentEvent('consent:placeholder', {
      functional: payload.functional,
      analytics: payload.analytics
    });

    state.functional = payload.functional;
    state.analytics = payload.analytics;
    state.hasStoredConsent = true;
    state.open = false;
    state.saving = false;
    showFab.value = true;
  });

  const onAcceptAll = $(async () => {
    await persistConsent({ functional: true, analytics: true });
  });

  const onRejectAll = $(async () => {
    await persistConsent({ functional: false, analytics: false });
  });

  const onSave = $(async () => {
    await persistConsent({ functional: state.functional, analytics: state.analytics });
  });

  const onClearAction = $(async (action: string, fn: () => Promise<string> | string) => {
    try {
      const message = await fn();
      state.clearStatus = {
        lastAction: action,
        lastResult: 'success',
        message
      };
    } catch (error) {
      state.clearStatus = {
        lastAction: action,
        lastResult: 'error',
        message: error instanceof Error ? error.message : 'Action failed'
      };
    }
  });

  const onLogout = $(async () => {
    await onClearAction('Logout', async () => {
      if (!csrfToken) {
        return 'Logout requires an active session.';
      }
      const response = await fetchApi<{ ok: true }>('/api/auth/logout', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(response.error.message);
      }
      return 'Logged out and server session cleared.';
    });
  });

  const onClearCookies = $(async () => {
    await onClearAction('Cookies', async () => {
      if (csrfToken) {
        const response = await fetchApi<{ ok: true }>('/api/auth/logout', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({})
        });
        if (!response.ok) {
          throw new Error(response.error.message);
        }
      }
      const cleared = deleteNonHttpOnlyCookies();
      return `Cleared ${cleared} non-HttpOnly cookies.`;
    });
  });

  const onClearLocalStorage = $(async () => {
    await onClearAction('Local storage', async () => {
      window.localStorage.clear();
      return 'Local storage cleared.';
    });
  });

  const onClearSessionStorage = $(async () => {
    await onClearAction('Session storage', async () => {
      window.sessionStorage.clear();
      return 'Session storage cleared.';
    });
  });

  const onClearCache = $(async () => {
    await onClearAction('Cache', async () => {
      const cleared = await clearCacheStorage();
      return cleared ? `Cleared ${cleared} cache entries.` : 'No Cache API entries found.';
    });
  });

  const onClearIndexedDb = $(async () => {
    await onClearAction('IndexedDB', async () => {
      const cleared = await clearIndexedDb();
      return cleared ? `Cleared ${cleared} IndexedDB databases.` : 'No IndexedDB databases found.';
    });
  });

  const openPanel = $(() => {
    state.open = true;
    state.showClearMenu = false;
  });

  useVisibleTask$(() => {
    state.ready = true;
    syncFromStorage();
  });

  return (
    <>
      {(state.open || !state.hasStoredConsent) && state.ready ? (
        <aside class="consent-panel" role="dialog" aria-live="polite" aria-label="Privacy controls">
          <div class="consent-header">
            <div>
              <div class="consent-eyebrow">Privacy</div>
              <h4>{state.mode === 'gdpr' ? 'Cookie preferences' : 'Privacy controls'}</h4>
            </div>
            <button class="button button-ghost small" type="button" onClick$={() => (state.open = false)}>
              Close
            </button>
          </div>

          <p class="muted small">
            {state.mode === 'gdpr'
              ? 'Choose how we use functional and analytical cookies. You can update this at any time.'
              : 'We do not track your web activity, and your data is kept as private as possible. Choose what you want enabled.'}
          </p>

          <div class="consent-options">
            <label class="consent-option">
              <div>
                <div class="consent-label">Functional</div>
                <div class="muted small">Enable convenience features and saved preferences.</div>
              </div>
              <input
                type="checkbox"
                checked={state.functional}
                onChange$={(event) => (state.functional = (event.target as HTMLInputElement).checked)}
              />
            </label>

            <label class="consent-option">
              <div>
                <div class="consent-label">Analytical</div>
                <div class="muted small">Allow anonymized usage analytics to improve the product.</div>
              </div>
              <input
                type="checkbox"
                checked={state.analytics}
                onChange$={(event) => (state.analytics = (event.target as HTMLInputElement).checked)}
              />
            </label>
          </div>

          {state.mode === 'privacy' ? (
            <div class="consent-clear">
              <button
                class={`button button-ghost small ${state.showClearMenu ? 'button-active' : ''}`}
                type="button"
                onClick$={() => (state.showClearMenu = !state.showClearMenu)}
              >
                Clear session data
              </button>
              {state.showClearMenu ? (
                <div class="consent-clear-menu">
                  <button class="button button-ghost small" type="button" onClick$={onLogout}>
                    Log out
                  </button>
                  <button class="button button-ghost small" type="button" onClick$={onClearCookies}>
                    Clear cookies
                  </button>
                  <button class="button button-ghost small" type="button" onClick$={onClearLocalStorage}>
                    Clear local storage
                  </button>
                  <button class="button button-ghost small" type="button" onClick$={onClearSessionStorage}>
                    Clear session storage
                  </button>
                  <button class="button button-ghost small" type="button" onClick$={onClearCache}>
                    Clear cache
                  </button>
                  <button class="button button-ghost small" type="button" onClick$={onClearIndexedDb}>
                    Clear IndexedDB
                  </button>
                  <div class={`consent-clear-status ${state.clearStatus.lastResult}`}>
                    {state.clearStatus.message || 'Choose an action to remove stored data.'}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div class="consent-actions">
            {state.mode === 'gdpr' ? (
              <button class="button button-ghost" type="button" onClick$={onRejectAll} disabled={state.saving}>
                Reject all
              </button>
            ) : null}
            <button class="button button-ghost" type="button" onClick$={onSave} disabled={state.saving}>
              Save
            </button>
            {state.mode === 'gdpr' ? (
              <button class="button" type="button" onClick$={onAcceptAll} disabled={state.saving}>
                Accept all
              </button>
            ) : null}
          </div>

          <div class="consent-meta">
            <span>Your choices are stored locally in this browser.</span>
            <span>You can reopen this panel anytime from the Privacy button.</span>
          </div>
        </aside>
      ) : null}

      {showFab.value && !state.open ? (
        <button class="consent-fab" type="button" onClick$={openPanel}>
          Privacy
        </button>
      ) : null}
    </>
  );
});
