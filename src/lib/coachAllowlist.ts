/** Correos coach autorizados (VITE_COACH_EMAILS separados por coma). */
export function getCoachEmailAllowlist(): string[] {
  const raw = import.meta.env.VITE_COACH_EMAILS as string | undefined;
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isCoachEmailAllowed(email: string | null | undefined): boolean {
  const list = getCoachEmailAllowlist();
  // Sin lista configurada: cualquier login Auth pasa el filtro de UI (rules + registro cerrado).
  if (list.length === 0) return true;
  if (!email) return false;
  return list.includes(email.trim().toLowerCase());
}
