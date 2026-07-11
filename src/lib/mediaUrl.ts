/** Convierte links de Google Drive a una URL usable en <img>. */
export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/);
  const idParam = trimmed.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] ?? idParam?.[1];

  if (id && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
    // thumbnail suele funcionar mejor que uc?export=view dentro de <img>
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return trimmed;
}

export function formatFirebaseError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Error desconocido';
  const e = error as { code?: string; message?: string };
  if (e.code === 'permission-denied') {
    return 'Firebase bloqueó el guardado. Publica las Rules de Firestore (allow read, write: if true).';
  }
  return e.message || e.code || 'Error al guardar';
}
