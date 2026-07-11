import { buildClientPlanPath } from './clientSlug';

const CLIENT_ID_KEY = 'fit21_last_client_id';
const CLIENT_NAME_PREFIX = 'fit21_client_name_';

const MANIFEST_BASE = {
  name: 'FIT21 — Constancia que transforma',
  short_name: 'FIT21',
  description: 'Rutinas y plan de alimentación personalizado',
  theme_color: '#3B1E78',
  background_color: '#FAFAFA',
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  scope: '/',
  // id estable: un solo instalable por origen/navegador (no duplicar por usuaria)
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
};

let lastManifestBlobUrl: string | null = null;

export function getRememberedClientId(): string | null {
  try {
    return localStorage.getItem(CLIENT_ID_KEY);
  } catch {
    return null;
  }
}

export function getCachedClientName(clientId: string): string | null {
  try {
    return localStorage.getItem(`${CLIENT_NAME_PREFIX}${clientId}`);
  } catch {
    return null;
  }
}

export function cacheClientName(clientId: string, name: string) {
  try {
    localStorage.setItem(`${CLIENT_NAME_PREFIX}${clientId}`, name);
  } catch {
    // ignore quota / private mode
  }
}

/** Detecta PWA instalada (Android standalone o iOS "Añadir a inicio"). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/**
 * Guarda la usuaria actual y actualiza el manifest para que
 * "Instalar app" abra su plan en lugar de la landing de coach.
 */
export function rememberClientPlan(clientId: string, clientName?: string) {
  try {
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  } catch {
    // ignore
  }

  const cachedName = clientName ?? getCachedClientName(clientId) ?? undefined;
  const startPath = cachedName
    ? buildClientPlanPath(clientId, cachedName)
    : `/plan/${clientId}`;

  applyClientManifest(startPath);
}

function applyClientManifest(startPath: string) {
  if (typeof document === 'undefined') return;

  const manifest = {
    ...MANIFEST_BASE,
    start_url: startPath,
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  if (lastManifestBlobUrl) {
    URL.revokeObjectURL(lastManifestBlobUrl);
  }
  lastManifestBlobUrl = url;
  link.href = url;
}
