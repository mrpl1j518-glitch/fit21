/** Longitud del ID interno de clienta (nanoid). */
export const CLIENT_ID_LENGTH = 10;

const CLIENT_ID_PATTERN = `[A-Za-z0-9_-]{${CLIENT_ID_LENGTH}}`;

/** "María Rosa" → "maria-rosa" */
export function slugifyName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'clienta';
}

/** Ruta amigable: /plan/wendy-Kp7aNk5RU7 */
export function buildClientPlanPath(clientId: string, name: string): string {
  return `/plan/${slugifyName(name)}-${clientId}`;
}

export function getClientPlanUrl(origin: string, clientId: string, name: string): string {
  return `${origin.replace(/\/$/, '')}${buildClientPlanPath(clientId, name)}`;
}

/**
 * Acepta el ID crudo (legacy) o slug-id.
 * Ej: "Kp7aNk5RU7" o "wendy-Kp7aNk5RU7" → "Kp7aNk5RU7"
 */
export function parseClientPlanParam(param: string): string {
  if (new RegExp(`^${CLIENT_ID_PATTERN}$`).test(param)) return param;

  const match = param.match(new RegExp(`^(.+)-(${CLIENT_ID_PATTERN})$`));
  if (match) return match[2];

  return param;
}
