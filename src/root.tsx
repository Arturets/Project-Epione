import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import './global.css';
import { APPEARANCE_STORAGE_KEY, applyThemeToDocument, readStoredTheme } from './lib/theme';

export default component$(() => {
  useVisibleTask$(({ cleanup }) => {
    applyThemeToDocument(readStoredTheme());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== APPEARANCE_STORAGE_KEY) return;
      applyThemeToDocument(readStoredTheme());
    };

    window.addEventListener('storage', onStorage);
    cleanup(() => window.removeEventListener('storage', onStorage));
  });

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main class="app-root">
          <RouterOutlet />
        </main>
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
