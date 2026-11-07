import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMemberCard, buildMemberDossier, createMemberNumber } from '../server/member-card';
import { validateMemberInput, ValidationException } from '../server/validator';
import { isMailConfigured, sendMail } from '../server/mail';

const validInput = {
  fullName: 'Awa Mbemba',
  email: 'awa@example.com',
  department: 'Pool',
  consent: true,
};

describe('carte de membre', () => {
  it('génère un numéro lisible et non prévisible', () => {
    const first = createMemberNumber(new Date('2026-11-07T00:00:00.000Z'));
    const second = createMemberNumber(new Date('2026-11-07T00:00:00.000Z'));
    expect(first).toMatch(/^UN-2026-[0-9A-F]{6}$/);
    expect(first).not.toBe(second);
  });

  it('échappe le nom dans la carte et rappelle le statut du mouvement', () => {
    const card = buildMemberCard({
      fullName: '<script>alert(1)</script>',
      memberNumber: 'UN-2026-ABC123',
      department: null,
      issuedAt: '2026-11-07T00:00:00.000Z',
    });
    expect(card.html).not.toContain('<script>alert(1)</script>');
    expect(card.html).toContain('&lt;script&gt;');
    expect(card.html).toContain('Mouvement en cours de constitution');
    expect(card.html).toContain('Non précisé');
    expect(card.text).toContain('UN-2026-ABC123');
  });

  it('prépare le dossier du bureau avec les informations de la demande', () => {
    const dossier = buildMemberDossier({
      fullName: 'Awa Mbemba',
      email: 'awa@example.com',
      department: 'Pool',
      memberNumber: 'UN-2026-ABC123',
      issuedAt: '2026-11-07T00:00:00.000Z',
    });
    expect(dossier.subject).toContain('Awa Mbemba');
    expect(dossier.text).toContain('awa@example.com');
    expect(dossier.text).toContain('Pool');
    expect(dossier.html).toContain('Nouveau dossier de membre');
  });

  describe('validation', () => {
    it('accepte une demande complète', () => {
      expect(validateMemberInput(validInput)).toEqual({
        fullName: 'Awa Mbemba',
        email: 'awa@example.com',
        department: 'Pool',
      });
    });

    it('refuse un nom trop court et un e-mail invalide', () => {
      expect(() => validateMemberInput({ ...validInput, fullName: 'A' })).toThrow(ValidationException);
      expect(() => validateMemberInput({ ...validInput, email: 'awa.example.com' })).toThrow(
        ValidationException,
      );
    });

    it('refuse une demande sans accord explicite', () => {
      expect(() => validateMemberInput({ ...validInput, consent: false })).toThrow(
        ValidationException,
      );
    });

    it('accepte un département absent', () => {
      expect(validateMemberInput({ ...validInput, department: '' }).department).toBeNull();
    });
  });

  describe('envoi', () => {
    const originalKey = process.env.MAIL_API_KEY;
    const originalFrom = process.env.MEMBER_FROM_EMAIL;

    beforeEach(() => {
      delete process.env.MAIL_API_KEY;
      delete process.env.MEMBER_FROM_EMAIL;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      if (originalKey === undefined) delete process.env.MAIL_API_KEY;
      else process.env.MAIL_API_KEY = originalKey;
      if (originalFrom === undefined) delete process.env.MEMBER_FROM_EMAIL;
      else process.env.MEMBER_FROM_EMAIL = originalFrom;
    });

    it('signale que l’envoi n’est pas configuré', async () => {
      expect(isMailConfigured()).toBe(false);
      const result = await sendMail({
        to: ['awa@example.com'],
        subject: 'Carte',
        html: '<p>Carte</p>',
        text: 'Carte',
      });
      expect(result).toEqual({ ok: false, reason: 'unconfigured' });
    });

    it('transmet la carte au service configuré', async () => {
      process.env.MAIL_API_KEY = 'test-key';
      process.env.MEMBER_FROM_EMAIL = 'bureau@example.com';
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);

      const result = await sendMail({
        to: ['awa@example.com'],
        subject: 'Carte',
        html: '<p>Carte</p>',
        text: 'Carte',
        replyTo: 'awa@example.com',
      });

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(payload.to).toEqual(['awa@example.com']);
      expect(payload.reply_to).toBe('awa@example.com');
    });

    it('signale un refus du service sans confirmer l’envoi', async () => {
      process.env.MAIL_API_KEY = 'test-key';
      process.env.MEMBER_FROM_EMAIL = 'bureau@example.com';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));

      const result = await sendMail({
        to: ['awa@example.com'],
        subject: 'Carte',
        html: '<p>Carte</p>',
        text: 'Carte',
      });
      expect(result).toEqual({ ok: false, reason: 'rejected' });
    });
  });
});
