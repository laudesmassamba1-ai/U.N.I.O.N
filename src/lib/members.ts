import type { MemberRegistration } from '../types';

const UNION_EMAIL = (import.meta.env.VITE_UNION_EMAIL ?? '').trim();
const KICHUB_EMAIL = (import.meta.env.VITE_KICHUB_EMAIL ?? '').trim();
export const MEMBER_EMAILS: string[] = [UNION_EMAIL, KICHUB_EMAIL].filter(Boolean);

export const MEMBER_REGISTRATION_LIMIT_MS = 24 * 60 * 60 * 1000;
export const MEMBER_REGISTRATION_LIMIT = 1;

export function canRegisterMember(attempts: string[], now: number): boolean {
  const recent = attempts.filter((time) => now - time < MEMBER_REGISTRATION_LIMIT_MS);
  return recent.length < MEMBER_REGISTRATION_LIMIT;
}

export function recordRegistrationAttempt(attempts: string[], now: number): string[] {
  return [...attempts.filter((time) => now - time < MEMBER_REGISTRATION_LIMIT_MS), now];
}

export function createMemberRegistration(
  input: MemberRegistration,
): { registration: MemberRegistration } {
  return {
    registration: {
      id: input.id ?? `member-${crypto.randomUUID?.() ?? Date.now().toString(36)}`,
      text: input.text.trim(),
      category: input.category,
      department: input.department,
      status: 'pending',
      createdAt: input.createdAt ?? new Date().toISOString(),
      updatedAt: input.updatedAt ?? new Date().toISOString(),
      publishedAt: null,
      archivedAt: null,
    },
  };
}

export function sendMemberDossier(registration: MemberRegistration): { sent: boolean; to: string[] } {
  const validEmails = MEMBER_EMAILS.filter((email) => email.startsWith('<') === false && email.includes('@'));
  if (validEmails.length === 0) {
    return { sent: false, to: [] };
  }
  const body = [
    'Dossier de membre reçu par l’U.N.I.O.N',
    `ID: ${registration.id}`,
    `Date: ${new Date(registration.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Brazzaville' })}`,
    `Catégorie: ${registration.category}`,
    `Département: ${registration.department ?? 'non précisé'}`,
    '',
    'Contenu du dossier:',
    registration.text,
    '',
    'Ce dossier a été envoyé automatiquement par le site de l’U.N.I.O.N.',
  ].join('\n');

  const htmlBody = [
    '<h2>Dossier de membre reçu par l’U.N.I.O.N</h2>',
    `<p><strong>ID:</strong> ${registration.id}</p>`,
    `<p><strong>Date:</strong> ${new Date(registration.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Brazzaville' })}</p>`,
    `<p><strong>Catégorie:</strong> ${registration.category}</p>`,
    `<p><strong>Département:</strong> ${registration.department ?? 'non précisé'}</p>`,
    '<h3>Contenu du dossier</h3>',
    `<p>${registration.text.replace(/\n/g, '<br>')}</p>`,
    '<p><em>Ce dossier a été envoyé automatiquement par le site de l’U.N.I.O.N.</em></p>',
    '<hr />',
    '<p><small>U.N.I.O.N, Union Nationale pour l’Unité. Mouvement en cours de constitution.</small></p>',
  ].join('\n');

  const to = validEmails.join(', ');
  return { sent: true, to };
}
