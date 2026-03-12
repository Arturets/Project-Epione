import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { cloudflarePagesAdapter } from '@builder.io/qwik-city/adapters/cloudflare-pages/vite';

function disableManualChunksForSSR() {
  return {
    name: 'disable-manual-chunks-ssr',
    configResolved(config: { build: { ssr?: boolean; rollupOptions?: { output?: any } } }) {
      if (!config.build.ssr) return;
      const output = config.build.rollupOptions?.output;
      if (Array.isArray(output)) {
        for (const out of output) {
          if (out && typeof out === 'object') {
            delete out.manualChunks;
          }
        }
      } else if (output && typeof output === 'object') {
        delete output.manualChunks;
      }
    }
  };
}

function ensureSsrInputs() {
  return {
    name: 'ensure-ssr-inputs',
    configResolved(config: { build: { ssr?: boolean; rollupOptions?: { input?: any } } }) {
      if (!config.build.ssr) return;
      const existing = config.build.rollupOptions?.input;
      const required = {
        'entry.ssr': 'src/entry.ssr.tsx',
        '@qwik-city-plan': '@qwik-city-plan'
      };
      if (Array.isArray(existing)) {
        config.build.rollupOptions = config.build.rollupOptions ?? {};
        config.build.rollupOptions.input = [...existing, ...Object.values(required)];
        return;
      }
      if (existing && typeof existing === 'object') {
        config.build.rollupOptions = config.build.rollupOptions ?? {};
        config.build.rollupOptions.input = { ...required, ...existing };
        return;
      }
      config.build.rollupOptions = config.build.rollupOptions ?? {};
      config.build.rollupOptions.input = required;
    }
  };
}

export default defineConfig(({ ssrBuild }) => {
  const config = {
    plugins: [
      qwikCity(),
      qwikVite(),
      cloudflarePagesAdapter({ ssg: null }),
      disableManualChunksForSSR(),
      ensureSsrInputs()
    ],
    server: {
      hmr: false
    }
  } as const;

  return config;
});
