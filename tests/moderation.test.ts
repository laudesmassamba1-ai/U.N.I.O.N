import { describe, expect, it } from 'vitest';
import { analyseSuggestion } from '../src/lib/moderation';

const valid = {
  text: 'Créer une permanence administrative dans chaque chef-lieu de département.',
  category: 'organisation',
};

describe('modération des suggestions', () => {
  it('accepte un texte utile et anonyme', () => {
    expect(analyseSuggestion(valid)).toEqual({ ok: true, code: null });
  });

  it('refuse un texte trop court', () => {
    expect(analyseSuggestion({ ...valid, text: 'Trop court.' }).code).toBe('too_short');
  });

  it('refuse un texte trop long', () => {
    expect(analyseSuggestion({ ...valid, text: 'a'.repeat(601) }).code).toBe('too_long');
  });

  it('refuse une catégorie absente', () => {
    expect(analyseSuggestion({ ...valid, category: '' }).code).toBe('category');
  });

  it('refuse les liens', () => {
    expect(analyseSuggestion({ ...valid, text: 'Voir www.exemple.com pour la suite.' }).code).toBe(
      'link',
    );
  });

  it('refuse les coordonnées personnelles', () => {
    expect(analyseSuggestion({ ...valid, text: 'Appelez le +242 06 000 00 00 demain.' }).code).toBe(
      'personal',
    );
    expect(analyseSuggestion({ ...valid, text: 'Écrivez à test@example.com pour agir.' }).code).toBe(
      'personal',
    );
  });

  it('refuse les insultes et propos haineux', () => {
    expect(analyseSuggestion({ ...valid, text: 'Ce sont des sous-hommes incapables.' }).code).toBe(
      'hate',
    );
  });

  it('signale et place en file de modération humaine les suggestions contenant un ethnonyme au lieu de les refuser', () => {
    const res = analyseSuggestion({ ...valid, text: 'Cette proposition concerne l’histoire des Bakongo au Congo.' });
    expect(res.ok).toBe(true);
    expect(res.flagged).toBe(true);
    expect(res.flagReason).toContain('ethnonyme');
  });

  it('refuse les doublons', () => {
    expect(analyseSuggestion({ ...valid, existingTexts: [valid.text] }).code).toBe('duplicate');
  });
});
