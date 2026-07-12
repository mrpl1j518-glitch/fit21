import { isStandaloneDisplay } from './clientPlanStorage';

const DISMISS_KEY = 'fit21_install_hint_dismissed';

export type InstallHintKind = 'android' | 'ios-safari' | 'ios-other' | 'in-app' | null;

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  return /WhatsApp|FBAN|FBAV|Instagram|Line\//i.test(ua);
}

function isSamsungBrowser(): boolean {
  return /SamsungBrowser/i.test(navigator.userAgent);
}

function isFirefoxBrowser(): boolean {
  return /Firefox|FxiOS/i.test(navigator.userAgent);
}

function isChromeAndroid(): boolean {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && /Chrome/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
}

function isSafariIOS(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

export function isInstallHintDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissInstallHint(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}

/** Determina si mostrar el aviso y qué mensaje usar. */
export function getInstallHintKind(): InstallHintKind {
  if (typeof window === 'undefined') return null;
  if (!isMobileDevice()) return null;
  if (isStandaloneDisplay()) return null;
  if (isInstallHintDismissed()) return null;

  if (isInAppBrowser()) return 'in-app';

  if (isIOS()) {
    return isSafariIOS() ? 'ios-safari' : 'ios-other';
  }

  // Android u otros móviles
  if (isChromeAndroid()) return null;

  if (isSamsungBrowser() || isFirefoxBrowser() || /Android/i.test(navigator.userAgent)) {
    return 'android';
  }

  return null;
}

export const INSTALL_HINT_COPY: Record<Exclude<InstallHintKind, null>, { title: string; body: string }> = {
  'in-app': {
    title: '¿Quieres tener FIT21 como app?',
    body: 'En Android ábrelo en Chrome. En iPhone ábrelo en Safari (Chrome en iPhone no puede instalar la app).',
  },
  android: {
    title: 'Instala FIT21 como app',
    body: 'Abre este link en Google Chrome. Menú ⋮ → “Abrir en Chrome” o “Instalar app”.',
  },
  'ios-other': {
    title: 'En iPhone usa Safari',
    body: 'Chrome en iPhone no instala apps. Abre este link en Safari → Compartir (↑) → “Añadir a pantalla de inicio”. Desde WhatsApp: Compartir → “Abrir en Safari”.',
  },
  'ios-safari': {
    title: 'Agrega FIT21 a tu inicio',
    body: 'Toca Compartir (↑) → “Añadir a pantalla de inicio”. En esa pantalla la URL debe incluir /plan/… Si solo dice fit21-amber.vercel.app/, cancela, recarga esta página y vuelve a intentar.',
  },
};
