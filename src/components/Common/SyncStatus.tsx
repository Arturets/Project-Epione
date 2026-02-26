import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { fetchApi, formatRelativeDate } from '../../lib/client';

type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

type SyncStatusResponse = {
  consentGranted: boolean;
  lastSyncAt: string | null;
  status: string;
};

type Props = {
  csrfToken?: string;
};

export const SyncStatus = component$<Props>(({ csrfToken }) => {
  const state = useStore({
    status: 'syncing' as SyncState,
    message: 'Checking sync status...',
    lastSyncAt: null as string | null,
    loading: false,
    consentGranted: false
  });

  const loadStatus = $(async () => {
    if (!navigator.onLine) {
      state.status = 'offline';
      state.message = 'Offline mode';
      return;
    }

    state.status = 'syncing';
    state.message = 'Syncing status...';

    const response = await fetchApi<SyncStatusResponse>('/api/applehealth/status');
    if (!response.ok) {
      state.status = 'error';
      state.message = response.error.message;
      return;
    }

    state.status = 'synced';
    state.lastSyncAt = response.data.lastSyncAt;
    state.consentGranted = response.data.consentGranted;
    state.message = response.data.lastSyncAt ? 'Synced' : 'No sync yet';
  });

  const onSyncNow = $(async () => {
    if (!csrfToken) return;

    state.loading = true;
    state.status = 'syncing';
    state.message = 'Syncing now...';

    const response = await fetchApi<{ syncedAt: string; importedMetrics: number }>('/api/applehealth/sync', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ consent: true })
    });

    state.loading = false;

    if (!response.ok) {
      state.status = 'error';
      state.message = response.error.message;
      return;
    }

    state.status = 'synced';
    state.lastSyncAt = response.data.syncedAt;
    state.message = `Synced ${response.data.importedMetrics} metrics`;
  });

  useVisibleTask$(async ({ cleanup }) => {
    await loadStatus();

    const onOnline = () => {
      loadStatus();
    };

    const onOffline = () => {
      state.status = 'offline';
      state.message = 'Offline mode';
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    cleanup(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  });

  return (
    <div class="sync-status sync-status-fixed">
      <div class={`sync-dot sync-dot-${state.status}`} />
      <div class="sync-copy">
        <div class="sync-label">{state.message}</div>
        {state.lastSyncAt ? <div class="sync-meta">Last sync: {formatRelativeDate(state.lastSyncAt)}</div> : null}
      </div>
      <button class="button button-ghost" type="button" onClick$={onSyncNow} disabled={!csrfToken || state.loading}>
        {state.loading ? 'Syncing...' : 'Sync now'}
      </button>
    </div>
  );
});
