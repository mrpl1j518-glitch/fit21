import { describe, expect, it } from 'vitest';
import { sanitizeStartUrl } from '../api/manifest.ts';

describe('sanitizeStartUrl', () => {
  it('acepta rutas de plan', () => {
    expect(sanitizeStartUrl('/plan/wendy-h9cNgFsHl8')).toBe('/plan/wendy-h9cNgFsHl8');
  });

  it('rechaza URLs absolutas y protocol-relative', () => {
    expect(sanitizeStartUrl('https://evil.com')).toBe('/');
    expect(sanitizeStartUrl('//evil.com')).toBe('/');
  });

  it('usa / si falta o es inválido', () => {
    expect(sanitizeStartUrl(null)).toBe('/');
    expect(sanitizeStartUrl('../etc')).toBe('/');
    expect(sanitizeStartUrl('/plan/<script>')).toBe('/');
  });
});
