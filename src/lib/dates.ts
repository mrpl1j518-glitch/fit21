export function getMondayOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekStartKey(date = new Date()): string {
  return formatDateKey(getMondayOfWeek(date));
}

/** 0 = Lunes … 6 = Domingo */
export function getDayIndex(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/** Fecha en español: "jueves 10 de julio" */
export function formatSpanishDate(date = new Date()): string {
  const formatted = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatted.replace(',', '');
}

/** Fecha de un día de la semana actual (0=Lun … 6=Dom) */
export function dateForDayIndex(dayIndex: number, from = new Date()): Date {
  const monday = getMondayOfWeek(from);
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  return d;
}

export function dateKeyForDayIndex(dayIndex: number, from = new Date()): string {
  return formatDateKey(dateForDayIndex(dayIndex, from));
}

/** Fecha corta: 10/7/2026 */
export function formatDayMonthYear(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/** Reciente: "hace 5 minutos". Antiguo: "el 10/7/2026" */
export function formatModifiedRelative(value: Date | string, now = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) {
    return diffMin === 1 ? 'hace 1 minuto' : `hace ${diffMin} minutos`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'hace 1 hora' : `hace ${diffHours} horas`;
  }

  return `el ${formatDayMonthYear(date)}`;
}

/** Días calendario transcurridos desde una fecha ISO (0 = mismo día). */
export function daysSinceDate(value: Date | string, from = new Date()): number {
  const start = typeof value === 'string' ? new Date(value) : new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(from);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

/** Inicio del día local en ISO (para marcar inicio de ciclo). */
export function startOfTodayIso(from = new Date()): string {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

