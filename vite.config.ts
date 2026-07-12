import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
      id: '/',
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
 * VitePWA fuerza start_url al base ("/"). Lo quitamos del artefacto estático
 * para que iOS no abra siempre la landing; /api/manifest aporta start_url por plan.
 */
function stripStaticManifestStartUrl(): Plugin {
  const strip = () => {
    const file = resolve('dist/manifest.webmanifest');
    if (!existsSync(file)) return;
    const manifest = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    if (!('start_url' in manifest)) return;
    delete manifest.start_url;
    writeFileSync(file, JSON.stringify(manifest));
  };

  return {
    name: 'fit21-strip-manifest-start-url',
    enforce: 'post',
    writeBundle: strip,
    closeBundle: strip,
  };
}

export default defineConfig({
  plugins: [
    react(),
    devManifestApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fit21-logo.png', 'favicon.svg'],
      // El plugin inyecta start_url:"/" aunque no lo pongamos; stripStaticManifestStartUrl lo quita.
      // En runtime, JS apunta a /api/manifest?start=/plan/...
      manifest: {
        name: 'FIT21 — Constancia que transforma',
        short_name: 'FIT21',
        description: 'Rutinas y plan de alimentación personalizado',
        theme_color: '#3B1E78',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        id: '/',
        icons: [
          {
            src: '/fit21-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/fit21-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
    stripStaticManifestStartUrl(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
