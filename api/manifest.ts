/**
 * Web App Manifest dinámico (Vercel Edge).
 * Evita blob: (iOS lo ignora) y permite start_url = /plan/... por clienta.
 *
 * GET /api/manifest?start=/plan/wendy-xxxxx
 */

export const config = { runtime: 'edge' };

const MANIFEST_BASE = {
  name: 'FIT21 — Constancia que transforma',
  short_name: 'FIT21',
  description: 'Rutinas y plan de alimentación personalizado',
  theme_color: '#3B1E78',
  background_color: '#FAFAFA',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
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
};

/** Solo rutas relativas mismas-origen; nunca URLs absolutas ni //. */
export function sanitizeStartUrl(raw: string | null): string {
  if (!raw) return '/';
  const start = raw.trim();
  if (!start.startsWith('/') || start.startsWith('//') || start.includes('://')) {
    return '/';
  }
  if (start.length > 200) return '/';
  if (!/^\/[A-Za-z0-9/_\-.%~]*$/.test(start)) return '/';
  return start;
}

export default function handler(request: Request): Response {
  const url = new URL(request.url);
  const startUrl = sanitizeStartUrl(url.searchParams.get('start'));

  // id debe coincidir con start_url: si id="/" iOS “pega” la app a la landing
  // aunque la barra muestre /plan/… (Share → Agregar a Inicio muestra /).
  const body = JSON.stringify({
    ...MANIFEST_BASE,
    id: startUrl,
    start_url: startUrl,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
