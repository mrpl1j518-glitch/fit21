import { describe, expect, it } from 'vitest';
import {
  dateForDayIndex,
  dateKeyForDayIndex,
  daysSinceDate,
  formatDateKey,
  getDayIndex,
  getWeekStartKey,
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
