export interface OutgoingMail {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

const DEFAULT_ENDPOINT = 'https://api.resend.com/emails';

export function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_API_KEY?.trim() && process.env.MEMBER_FROM_EMAIL?.trim());
}

/** Destinataires du dossier de membre, côté serveur uniquement. */
export function dossierRecipients(): string[] {
  return (process.env.MEMBER_DOSSIER_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.includes('@'));
}

export type MailFailure = 'unconfigured' | 'rejected' | 'network';

/**
 * Envoi par API REST. Aucun SDK, aucune dépendance : l’adresse du service
 * est configurable pour ne pas lier le mouvement à un prestataire unique.
 */
export async function sendMail(
  mail: OutgoingMail,
): Promise<{ ok: true } | { ok: false; reason: MailFailure }> {
  if (!isMailConfigured() || mail.to.length === 0) {
    return { ok: false, reason: 'unconfigured' };
  }
  const endpoint = process.env.MAIL_API_URL?.trim() || DEFAULT_ENDPOINT;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MAIL_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MEMBER_FROM_EMAIL?.trim(),
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, reason: 'rejected' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
