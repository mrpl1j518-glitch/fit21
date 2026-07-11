/** Hosts permitidos para imágenes/videos del plan (reduce tracking / XSS por URL). */
const ALLOWED_MEDIA_HOSTS = [
  'drive.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'googleusercontent.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'i.ytimg.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_MEDIA_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/** True si la URL usa un host de la allowlist (o está vacía). */
export function isAllowedMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return hostAllowed(parsed.hostname);
  } catch {
    return false;
  }
}

/** Convierte links de Google Drive a una URL usable en <img>. */
export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (!isAllowedMediaUrl(trimmed)) return '';

  const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
  const idParam = trimmed.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] ?? idParam?.[1];

  if (id && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return trimmed;
}

export function formatFirebaseError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Error desconocido';
  const e = error as { code?: string; message?: string };
  if (e.code === 'permission-denied') {
    return 'Firebase bloqueó el guardado. Revisa las reglas de Firestore y que tu cuenta sea coach autorizada.';
  }
  return e.message || e.code || 'Error al guardar';
}
