import { describe, expect, it } from 'vitest';
import { isAllowedMediaUrl, normalizeMediaUrl } from './mediaUrl';

describe('isAllowedMediaUrl', () => {
  it('acepta hosts de la allowlist', () => {
    expect(isAllowedMediaUrl('https://drive.google.com/file/d/abc/view')).toBe(true);
    expect(isAllowedMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isAllowedMediaUrl('https://firebasestorage.googleapis.com/v0/b/x/o/y')).toBe(true);
  });

  it('rechaza hosts desconocidos', () => {
    expect(isAllowedMediaUrl('https://evil.example/track.gif')).toBe(false);
    expect(isAllowedMediaUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('normalizeMediaUrl', () => {
  it('convierte Drive a thumbnail', () => {
    expect(normalizeMediaUrl('https://drive.google.com/file/d/ABC123/view')).toContain(
      'thumbnail?id=ABC123'
    );
  });

  it('devuelve vacío si el host no está permitido', () => {
    expect(normalizeMediaUrl('https://evil.example/x.png')).toBe('');
  });
});
