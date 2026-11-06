import { describe, expect, it } from 'vitest';
import { clamp, createId, slugify, uniqueSlug } from '../src/lib/id';

describe('identifiants et slugs', () => {
  it('crée un identifiant préfixé', () => {
    expect(createId('article')).toMatch(/^article-/);
  });

  it('retire les accents et la ponctuation', () => {
    expect(slugify('Économie : le Congo uni')).toBe('economie-le-congo-uni');
  });

  it('garde un slug unique', () => {
    expect(uniqueSlug('Journal', ['journal'])).toBe('journal-2');
    expect(uniqueSlug('Journal', ['journal', 'journal-2'])).toBe('journal-3');
    expect(uniqueSlug('!!!', [])).toBe('article');
  });

  it('borne une valeur', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});
