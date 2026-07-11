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

