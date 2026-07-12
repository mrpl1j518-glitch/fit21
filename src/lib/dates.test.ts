import { describe, expect, it } from 'vitest';
import {
  dateForDayIndex,
  dateKeyForDayIndex,
  daysSinceDate,
  formatDateKey,
  getDayIndex,
  getWeekStartKey,
  isCyclePeriodEnded,
  isDateWithinCycle,
} from './dates';

/** Lunes 7 de julio de 2025 (hora local del entorno de test). */
const monday = new Date(2025, 6, 7, 12, 0, 0);

describe('getDayIndex', () => {
  it('mapea lunes a 0 y domingo a 6', () => {
    expect(getDayIndex(monday)).toBe(0);
    expect(getDayIndex(new Date(2025, 6, 13, 12))).toBe(6);
  });
});

describe('getWeekStartKey', () => {
  it('devuelve el lunes de la semana en YYYY-MM-DD', () => {
    expect(getWeekStartKey(new Date(2025, 6, 9, 12))).toBe('2025-07-07');
  });
});

describe('dateKeyForDayIndex', () => {
  it('resuelve fechas de la semana actual', () => {
    expect(dateKeyForDayIndex(0, monday)).toBe('2025-07-07');
    expect(dateKeyForDayIndex(3, monday)).toBe('2025-07-10');
  });
});

describe('dateForDayIndex', () => {
  it('avanza días desde el lunes de la semana', () => {
    const thursday = dateForDayIndex(3, monday);
    expect(formatDateKey(thursday)).toBe('2025-07-10');
  });
});

describe('daysSinceDate', () => {
  it('cuenta días calendario entre fechas locales', () => {
    expect(daysSinceDate(new Date(2025, 6, 1), new Date(2025, 6, 7, 12))).toBe(6);
    expect(daysSinceDate(new Date(2025, 6, 7), new Date(2025, 6, 7, 18))).toBe(0);
  });
});

describe('isDateWithinCycle', () => {
  it('incluye día 1 y día 28, excluye día 29', () => {
    const start = '2025-07-01T06:00:00.000Z';
    expect(isDateWithinCycle(start, '2025-07-01', 28)).toBe(true);
    expect(isDateWithinCycle(start, '2025-07-28', 28)).toBe(true);
    expect(isDateWithinCycle(start, '2025-07-29', 28)).toBe(false);
  });
});

describe('isCyclePeriodEnded', () => {
  it('es true desde el día 29 de calendario', () => {
    const start = new Date(2025, 6, 1);
    expect(isCyclePeriodEnded(start.toISOString(), 28, new Date(2025, 6, 28, 12))).toBe(false);
    expect(isCyclePeriodEnded(start.toISOString(), 28, new Date(2025, 6, 29, 12))).toBe(true);
  });
});
