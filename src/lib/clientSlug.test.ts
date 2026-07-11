import { describe, expect, it } from 'vitest';
import {
  buildClientPlanPath,
  getClientPlanUrl,
  parseClientPlanParam,
  slugifyName,
} from './clientSlug';

describe('slugifyName', () => {
  it('normaliza acentos y espacios', () => {
    expect(slugifyName('María Rosa')).toBe('maria-rosa');
    expect(slugifyName('  Wendy   López  ')).toBe('wendy-lopez');
  });

  it('usa fallback si el nombre queda vacío', () => {
    expect(slugifyName('   ')).toBe('clienta');
    expect(slugifyName('---')).toBe('clienta');
  });
});

describe('buildClientPlanPath', () => {
  it('arma ruta amigable con slug e id', () => {
    expect(buildClientPlanPath('Kp7aNk5RU7', 'Wendy')).toBe('/plan/wendy-Kp7aNk5RU7');
  });
});

describe('getClientPlanUrl', () => {
  it('quita slash final del origin', () => {
    expect(getClientPlanUrl('https://fit21-amber.vercel.app/', 'abc1234567', 'Ana')).toBe(
      'https://fit21-amber.vercel.app/plan/ana-abc1234567'
    );
  });
});

describe('parseClientPlanParam', () => {
  it('acepta id crudo legacy', () => {
    expect(parseClientPlanParam('Kp7aNk5RU7')).toBe('Kp7aNk5RU7');
  });

  it('extrae id de slug compuesto', () => {
    expect(parseClientPlanParam('wendy-Kp7aNk5RU7')).toBe('Kp7aNk5RU7');
    expect(parseClientPlanParam('maria-rosa-abc1234567')).toBe('abc1234567');
  });

  it('devuelve el param si no coincide con ningún patrón', () => {
    expect(parseClientPlanParam('link-invalido')).toBe('link-invalido');
  });
});
