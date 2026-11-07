import { describe, expect, it } from 'vitest';
import { buildDossierMailto } from '../src/lib/member-mail';

describe('dossier par messagerie', () => {
  it('adresse le message aux deux boîtes du bureau', () => {
    const link = buildDossierMailto(['bureau@example.com', 'suivi@example.com'], {
      fullName: 'Awa Mbemba',
      department: 'Pool',
      issuedAt: '2026-11-07T00:00:00.000Z',
    });
    expect(link.startsWith('mailto:bureau@example.com,suivi@example.com?subject=')).toBe(true);
  });

  it('remplit le corps avec le nom, le département et la date', () => {
    const link = buildDossierMailto(['bureau@example.com'], {
      fullName: 'Awa Mbemba',
      department: null,
      issuedAt: '2026-11-07T00:00:00.000Z',
    });
    const body = decodeURIComponent(link.split('&body=')[1]);
    expect(body).toContain('Nom : Awa Mbemba');
    expect(body).toContain('Département : Non précisé');
    expect(body).toContain('2026');
    expect(body).toContain('carte de membre');
  });

  it('marque le nom à compléter quand le champ est vide', () => {
    const link = buildDossierMailto(['bureau@example.com'], {
      fullName: '   ',
      department: '',
      issuedAt: '2026-11-07T00:00:00.000Z',
    });
    const body = decodeURIComponent(link.split('&body=')[1]);
    expect(body).toContain('Nom : (à compléter)');
    expect(body).toContain('Département : Non précisé');
  });

  it('ne construit rien sans destinataire', () => {
    expect(buildDossierMailto([], { fullName: 'Awa', department: null })).toBe('');
    expect(buildDossierMailto(['invalide'], { fullName: 'Awa', department: null })).toBe('');
  });
});
