import { describe, expect, it } from 'vitest';
import { formatRest, initials } from './index';

describe('formatRest', () => {
  it('formatea minutos y segundos', () => {
    expect(formatRest({ id: '1', name: 'X', restMin: '2', restSec: '30' })).toBe('2 min 30 s');
    expect(formatRest({ id: '1', name: 'X', restMin: '1' })).toBe('1 min');
    expect(formatRest({ id: '1', name: 'X', restSec: '45' })).toBe('45 s');
  });

  it('usa rest legacy si no hay min/seg', () => {
    expect(formatRest({ id: '1', name: 'X', rest: '90 s' })).toBe('90 s');
  });

  it('devuelve vacío sin datos de descanso', () => {
    expect(formatRest({ id: '1', name: 'X' })).toBe('');
  });
});

describe('initials', () => {
  it('toma hasta dos iniciales', () => {
    expect(initials('María Rosa Pérez')).toBe('MR');
    expect(initials('Wendy')).toBe('W');
  });

  it('ignora espacios extra', () => {
    expect(initials('  Ana   ')).toBe('A');
    expect(initials('')).toBe('');
  });
});
