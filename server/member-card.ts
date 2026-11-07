import crypto from 'node:crypto';

export interface MemberCardInput {
  fullName: string;
  memberNumber: string;
  department: string | null;
  phone: string | null;
  documentSelfieUrl: string | null;
  documentIdUrl: string | null;
  issuedAt: string;
}

export function createMemberNumber(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `UN-${year}-${suffix}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatIssuedAt(issuedAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Brazzaville',
  }).format(new Date(issuedAt));
}

/**
 * Carte de membre au format e-mail. Le dessin reste en noir et blanc pour
 * s’imprimer proprement et pour ne dépendre d’aucune image distante.
 */
export function buildMemberCard(input: MemberCardInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(input.fullName);
  const department = input.department ? escapeHtml(input.department) : 'Non précisé';
  const number = escapeHtml(input.memberNumber);
  const issued = formatIssuedAt(input.issuedAt);

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Carte de membre de l’U.N.I.O.N</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f2f1ec;font-family:Helvetica,Arial,sans-serif;color:#14110f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;border-collapse:collapse;background:#ffffff;border:2px solid #14110f;">
          <tr>
            <td style="padding:26px 26px 18px 26px;">
              <p style="margin:0;font-size:13px;letter-spacing:4px;font-weight:bold;">U.N.I.O.N</p>
              <p style="margin:6px 0 0 0;font-size:12px;letter-spacing:0.5px;color:#4a453f;">Union Nationale pour l’Unité</p>
              <hr style="border:0;border-top:2px solid #14110f;margin:18px 0 0 0;" />
              <p style="margin:18px 0 0 0;font-size:11px;letter-spacing:2px;color:#4a453f;">CARTE DE MEMBRE</p>
              <p style="margin:10px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;font-weight:bold;">${name}</p>
              <p style="margin:6px 0 0 0;font-size:13px;color:#4a453f;">Département : ${department}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #14110f;">
                <tr>
                  <td style="padding:12px 0;font-size:12px;color:#4a453f;">Numéro</td>
                  <td style="padding:12px 0;font-size:13px;font-weight:bold;text-align:right;">${number}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px 0;font-size:12px;color:#4a453f;">Délivrée le</td>
                  <td style="padding:0 0 12px 0;font-size:13px;text-align:right;">${escapeHtml(issued)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 26px 24px 26px;">
              <hr style="border:0;border-top:1px solid #14110f;margin:0 0 14px 0;" />
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;">« Un Congo uni travaille. Un Congo divisé mendie. »</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#4a453f;">Mouvement en cours de constitution.</p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#4a453f;">Carte personnelle, non transférable. Elle ne donne droit à aucun avantage financier.</p>
            </td>
          </tr>
        </table>
        <p style="max-width:540px;margin:16px auto 0 auto;font-size:11px;line-height:1.5;color:#4a453f;text-align:left;">
          Vous recevez ce message parce qu’une carte de membre a été demandée avec cette adresse.
          Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : aucune autre suite ne lui sera donnée.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'U.N.I.O.N — Union Nationale pour l’Unité',
    'CARTE DE MEMBRE',
    '',
    `Nom : ${input.fullName}`,
    `Département : ${input.department ?? 'Non précisé'}`,
    `Numéro : ${input.memberNumber}`,
    `Délivrée le : ${issued}`,
    '',
    '« Un Congo uni travaille. Un Congo divisé mendie. »',
    'Mouvement en cours de constitution.',
    'Carte personnelle, non transférable. Elle ne donne droit à aucun avantage financier.',
    '',
    'Vous recevez ce message parce qu’une carte de membre a été demandée avec cette adresse.',
    'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
  ].join('\n');

  return { subject: 'Votre carte de membre de l’U.N.I.O.N', html, text };
}

/** Dossier envoyé au bureau et au Studio : informations + documents joints. */
export function buildMemberDossier(
  input: MemberCardInput & { email: string },
  { studio = false }: { studio?: boolean } = {},
): { subject: string; html: string; text: string } {
  const name = escapeHtml(input.fullName);
  const email = escapeHtml(input.email);
  const department = input.department ? escapeHtml(input.department) : 'Non précisé';
  const phone = input.phone ? escapeHtml(input.phone) : 'Non précisé';
  const number = escapeHtml(input.memberNumber);
  const issued = formatIssuedAt(input.issuedAt);
  const selfieUrl = input.documentSelfieUrl && input.documentSelfieUrl.trim() ? input.documentSelfieUrl.trim() : null;
  const identityUrl = input.documentIdUrl && input.documentIdUrl.trim() ? input.documentIdUrl.trim() : null;

  const rows: Array<[string, string]> = [
    ['Nom', name],
    ['Adresse e-mail', email],
    ['Numéro de téléphone', phone],
    ['Département', department],
    ['Numéro de carte', number],
    ['Date de la demande', escapeHtml(issued)],
  ];

  const attachments: Array<{ label: string; url: string }> = [];
  if (selfieUrl) attachments.push({ label: 'Selfie', url: selfieUrl });
  if (identityUrl) attachments.push({ label: 'Pièce d’identité', url: identityUrl });

  const attachmentsSection = attachments.length > 0
    ? `<tr>
      <td style="padding:0 22px 22px 22px;">
        <hr style="border:0;border-top:1px solid #d8d4cb;margin:0 0 12px 0;" />
        <p style="margin:0 0 8px 0;font-size:11px;color:#4a453f;">Documents joints :</p>
        ${attachments
          .map(
            (attachment) =>
              `<p style="margin:0 0 4px 0;font-size:12px;color:#14110f;">• ${escapeHtml(attachment.label)} : <a href="${escapeHtml(attachment.url)}">${attachment.label}</a></p>`,
          )
          .join('\n')}
      </td>
    </tr>`
    : '';

  const introLine = studio
    ? 'Un nouveau dossier de carte de membre a été transmis au Studio pour vérification avant délivrance.'
    : 'La personne a accepté l’envoi de sa carte. Pour lui répondre, utilisez la fonction « Répondre » : cette réponse part à l’adresse indiquée ci-dessus.';

  const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8" /><title>${escapeHtml(studio ? 'Dossier Studio : ' + input.fullName : 'Nouveau dossier de membre')}</title></head>
<body style="margin:0;padding:24px;background:#f2f1ec;font-family:Helvetica,Arial,sans-serif;color:#14110f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:2px solid #14110f;">
    <tr>
      <td style="padding:22px 22px 16px 22px;">
        <p style="margin:0;font-size:12px;letter-spacing:3px;font-weight:bold;">U.N.I.O.N</p>
        <p style="margin:6px 0 0 0;font-size:13px;">${escapeHtml(studio ? 'Nouveau dossier Studio' : 'Nouveau dossier de membre')}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 22px 18px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${rows
            .map(
              ([label, value]) =>
                `<tr><td style="padding:8px 0;border-top:1px solid #d8d4cb;font-size:12px;color:#4a453f;">${label}</td><td style="padding:8px 0;border-top:1px solid #d8d4cb;font-size:13px;text-align:right;">${value}</td></tr>`,
            )
            .join('\n          ')}
        </table>
      </td>
    </tr>
    ${attachmentsSection}
    <tr>
      <td style="padding:0 22px 22px 22px;">
        <p style="margin:0;font-size:11px;line-height:1.5;color:#4a453f;">${escapeHtml(introLine)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'U.N.I.O.N — ' + (studio ? 'Nouveau dossier Studio' : 'Nouveau dossier de membre'),
    '',
    ...rows.map(([label, value]) => `${label} : ${value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}`),
    '',
    attachments.length > 0 ? 'Documents joints : ' + attachments.map((a) => a.label + ' : ' + a.url).join(', ') : '',
    '',
    introLine,
  ].filter(Boolean).join('\n');

  return { subject: `${studio ? '[Studio] ' : ''}${input.fullName} — ${studio ? 'Dossier à vérifier' : 'Nouveau dossier de membre'}`, html, text };
}
