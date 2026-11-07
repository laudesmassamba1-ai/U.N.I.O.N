export interface DossierMailInput {
  fullName: string;
  department: string | null;
  issuedAt?: string;
}

/**
 * Adresses du bureau lues dans la configuration publique. Elles ne sont jamais
 * écrites dans le dépôt : sans variable, le second chemin disparaît proprement.
 */
export function dossierRecipients(): string[] {
  return (import.meta.env.VITE_DOSSIER_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.includes('@'));
}

export function buildDossierMailto(recipients: string[], input: DossierMailInput): string {
  const valid = recipients.filter((value) => value.includes('@'));
  if (valid.length === 0) return '';
  const date = input.issuedAt
    ? new Date(input.issuedAt).toLocaleDateString('fr-FR', { timeZone: 'Africa/Brazzaville' })
    : new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Brazzaville' });
  const subject = `Demande de carte de membre — ${input.fullName}`;
  const body = [
    'Bonjour,',
    '',
    'Je souhaite recevoir ma carte de membre de l’U.N.I.O.N.',
    '',
    `Nom : ${input.fullName}`,
    `Département : ${input.department ?? 'Non précisé'}`,
    `Date : ${date}`,
    '',
    'Merci.',
  ].join('\n');
  return `mailto:${valid.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
