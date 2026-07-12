import { buildClientPlanPath } from './clientSlug';

const CLIENT_ID_KEY = 'fit21_last_client_id';
const CLIENT_NAME_PREFIX = 'fit21_client_name_';

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
 * Apunta el <link rel="manifest"> a /api/manifest?start=...
 * (HTTP real; blob: lo ignora iOS Safari al Agregar a Inicio).
 */
export function setManifestStartUrl(startPath: string) {
  if (typeof document === 'undefined') return;

  const path = startPath.startsWith('/') ? startPath : `/${startPath}`;
  const href = `/api/manifest?start=${encodeURIComponent(path)}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) {
    link.href = href;
  }
}

/**
 * Si la URL actual es un plan, fija el manifest cuanto antes
 * (antes de que React monte), para el diálogo "Agregar a Inicio" de iOS.
 *
 * En la landing: si ya hay clienta recordada, NO resetear start_url a "/"
 * (eso hacía que el icono de iPhone abriera la pantalla vacía de instrucciones).
 * Sin clienta recordada, no forzamos "/" — iOS usará la URL de la página actual.
 */
export function applyManifestForCurrentPath() {
  if (typeof window === 'undefined') return;
  const { pathname } = window.location;
  if (pathname.startsWith('/plan/')) {
    setManifestStartUrl(pathname);
    return;
  }
  if (pathname.startsWith('/coach')) return;

  const rememberedId = getRememberedClientId();
  if (rememberedId) {
    const name = getCachedClientName(rememberedId);
    setManifestStartUrl(
      name ? buildClientPlanPath(rememberedId, name) : `/plan/${rememberedId}`
    );
  }
  // Sin plan recordado: no llamar setManifestStartUrl('/') — evita iconos rotos en iOS
}

/**
 * Guarda solo el pointer de clienta (no rutinas/progreso) y actualiza
 * el manifest para que "Instalar / Agregar a Inicio" abra su plan.
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

  setManifestStartUrl(startPath);
}
