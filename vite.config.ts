import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sanitizeStartUrl } from './api/manifest.ts';

/** En local (sin Vercel), sirve el mismo contrato que /api/manifest. */
function devManifestApi(): Plugin {
  const handle = (
    req: { url?: string },
    res: { setHeader: (k: string, v: string) => void; end: (b: string) => void },
    next: () => void
  ) => {
    const raw = req.url ?? '';
    if (!raw.startsWith('/api/manifest')) {
      next();
      return;
    }
    const url = new URL(raw, 'http://localhost');
    const startUrl = sanitizeStartUrl(url.searchParams.get('start'));
    const body = JSON.stringify({
      name: 'FIT21 — Constancia que transforma',
      short_name: 'FIT21',
      description: 'Rutinas y plan de alimentación personalizado',
      theme_color: '#3B1E78',
      background_color: '#FAFAFA',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      // id = start_url para que iOS no “pegue” la app a la raíz
      id: startUrl,
      start_url: startUrl,
      icons: [
        { src: '/fit21-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/fit21-logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    });
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.end(body);
  };

  return {
    name: 'fit21-dev-manifest-api',
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

/**
 * VitePWA a veces reinyecta <link rel="manifest" href="/manifest.webmanifest">.
 * Eso hace que iOS “Agregar a Inicio” use start_url=/ (o vacío → /) y ignore /plan/….
 * Dejamos solo el link a /api/manifest del script inline en index.html.
 */
function preferApiManifestLink(): Plugin {
  return {
    name: 'fit21-prefer-api-manifest-link',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link[^>]*rel="manifest"[^>]*href="\/manifest\.webmanifest"[^>]*>/gi,
        ''
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devManifestApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fit21-logo.png', 'favicon.svg'],
      // Sin manifest estático: iOS debe leer solo /api/manifest?start=...
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
    preferApiManifestLink(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
