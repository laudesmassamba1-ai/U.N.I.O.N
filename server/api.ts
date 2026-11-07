import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDatabase, type Database } from '../lib/server/db.js';
import {
  checkMemberRateLimit,
  checkRateLimit,
  createStudioSession,
  getSecurityHeaders,
  getStudioLoginSecret,
  getStudioSession,
  hashVoterToken,
  isStudioConfigured,
  isVoteConfigured,
  revokeStudioSession,
  verifyProofOfWork,
} from './security.js';
import {
  validateMemberInput,
  validateReportInput,
  validateSuggestionInput,
  validateVoteInput,
  ValidationException,
} from './validator.js';
import { buildMemberCard, buildMemberDossier, createMemberNumber } from './member-card.js';
import { storeMemberDocuments } from './member-documents.js';
import { dossierRecipients, isMailConfigured, sendMail } from './mail.js';
import { buildHealthReport, DB_STORAGE_LIMIT_BYTES } from './health.js';
import {
  createSnapshotState,
  loadSnapshot,
  rebuildSnapshot,
  SNAPSHOT_CACHE_CONTROL,
  snapshotUpdatedAt,
} from './snapshot.js';
import { createSnapshotSource } from './snapshot-source.js';
import { classifyDatabaseError, degradedResponse, withDbRetry, withTimeout } from './resilience.js';
import { requestWarm, WARM_MIN_TEXT_LENGTH } from './warm.js';
import { analyseSuggestion } from '../src/lib/moderation.js';
import { DEFAULT_SETTINGS, evaluateStatus } from '../src/lib/suggestions.js';

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  method: string;
  clientIp: string;
  cookies: Record<string, string>;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('=') || '');
    }
  });
  return list;
}

class PayloadTooLargeError extends Error {}

const editionSnapshot = createSnapshotState();
let snapshotSource: ReturnType<typeof createSnapshotSource> | null = null;

function snapshotStore(): ReturnType<typeof createSnapshotSource> {
  snapshotSource ??= createSnapshotSource();
  return snapshotSource;
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      body += chunk;
      if (body.length > 4 * 1024 * 1024) {
        settled = true;
        reject(new PayloadTooLargeError('Corps trop volumineux'));
        req.resume();
      }
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('JSON invalide'));
      }
    });
    req.on('error', (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
}

function isFormDataContentType(contentType: string | undefined): boolean {
  return Boolean(contentType && contentType.toLowerCase().startsWith('multipart/form-data'));
}

interface RawFormFile {
  name: string;
  type: string;
  body: Buffer;
}

interface RawFormFields {
  fields: Record<string, string | null>;
  files: Record<string, RawFormFile | null>;
}

async function readFormDataBody(req: IncomingMessage, maxFileBytes = 5 * 1024 * 1024): Promise<RawFormFields> {
  const contentType = req.headers['content-type']?.toString() || '';
  const boundary = contentType.split('boundary=')[1]?.trim();
  if (!boundary) {
    throw new Error('Frontière de formulaire manquante.');
  }

  const encoder = new TextEncoder();
  const boundaryBytes = Buffer.from(encoder.encode('--' + boundary));
  const crlf = Buffer.from(encoder.encode('\r\n'));
  const lf = Buffer.from(encoder.encode('\n'));

  const chunks: Buffer[] = [];
  let total = 0;

  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      if (total > maxFileBytes * 3) {
        req.destroy();
        return;
      }
      total += chunk.length;
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks, total);
        resolve(parseMultipart(buffer, boundaryBytes, crlf, lf, maxFileBytes));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function parseMultipart(
  buffer: Buffer,
  boundaryBytes: Buffer,
  crlf: Buffer,
  lf: Buffer,
  maxFileBytes: number,
): RawFormFields {
  const fields: Record<string, string | null> = {};
  const files: Record<string, RawFormFile | null> = {};

  let pos = 0;
  const len = buffer.length;

  while (pos < len) {
    if (!scanDelimiter(buffer, pos, boundaryBytes, crlf)) {
      throw new Error('Form-data illisible.');
    }
    pos = skipBytes(buffer, pos, boundaryBytes.length);

    if (buffer[pos] === 0x2d && buffer[pos + 1] === 0x2d) {
      pos += 2;
      break;
    }
    if (pos < len && buffer[pos] === 0x0d) {
      pos += 1;
    }
    if (pos < len && buffer[pos] === 0x0a) {
      pos += 1;
    }

    let dispositionEnd = indexOfLineEnd(buffer, pos);
    if (dispositionEnd < 0) {
      throw new Error('En-tête de partie manquant.');
    }
    const headerPart = buffer.slice(pos, dispositionEnd).toString('latin1');
    pos = dispositionEnd + 1;

    const name = extractHeaderValue(headerPart, 'name');
    const filename = extractHeaderValue(headerPart, 'filename');

    let contentType = 'application/octet-stream';
    let headersEnd = pos;
    while (headersEnd < len) {
      const lineEnd = indexOfLineEnd(buffer, headersEnd);
      if (lineEnd < 0) {
        throw new Error('En-tête de partie illisible.');
      }
      const raw = buffer.slice(headersEnd, lineEnd).toString('latin1');
      headersEnd = lineEnd + 1;
      if (raw.trim() === '') {
        break;
      }
      if (/^\s*[Cc]ontent-[Tt]ype:\s*/i.test(raw)) {
        contentType = raw.replace(/^\s*[Cc]ontent-[Tt]ype:\s*/i, '').trim();
      }
    }

    if (filename) {
      const fileEnd = indexOfDelimiter(buffer, pos, boundaryBytes);
      if (fileEnd < 0) {
        throw new Error('Partie de fichier illisible.');
      }
      const raw = buffer.slice(pos, fileEnd);
      const fileBytes = raw.length >= 2 && raw[raw.length - 2] === 0x0d && raw[raw.length - 1] === 0x0a
        ? raw.slice(0, raw.length - 2)
        : raw;

      if (fileBytes.length > maxFileBytes) {
        throw new Error('Fichier trop volumineux.');
      }

      files[name] = {
        name: filename,
        type: contentType,
        body: fileBytes,
      };
      pos = fileEnd;
    } else {
      const valueEnd = indexOfDelimiter(buffer, pos, boundaryBytes);
      if (valueEnd < 0) {
        throw new Error('Champ texte illisible.');
      }
      const raw = buffer.slice(pos, valueEnd).toString('utf8').trim();
      fields[name] = raw || null;
      pos = valueEnd;
    }
  }

  return { fields, files };
}

function scanDelimiter(buffer: Buffer, pos: number, delimiter: Buffer, crlf: Buffer): boolean {
  const dlen = delimiter.length;
  if (pos + dlen + crlf.length <= buffer.length) {
    const chunk = buffer.subarray(pos, pos + dlen);
    if (Buffer.compare(chunk, delimiter) === 0) {
      if (buffer[pos + dlen] === 0x0d && buffer[pos + dlen + 1] === 0x0a) {
        return true;
      }
    }
  }
  if (pos + dlen <= buffer.length) {
    const chunk = buffer.subarray(pos, pos + dlen);
    if (Buffer.compare(chunk, delimiter) === 0) {
      return buffer[pos + dlen] === 0x0a;
    }
  }
  return false;
}

function indexOfDelimiter(buffer: Buffer, start: number, delimiter: Buffer): number {
  const dlen = delimiter.length;
  for (let i = start; i <= buffer.length - dlen; i++) {
    const chunk = buffer.subarray(i, i + dlen);
    if (Buffer.compare(chunk, delimiter) === 0) {
      const after = i + dlen;
      if (after < buffer.length && buffer[after] === 0x0d && buffer[after + 1] === 0x0a) {
        return i;
      }
      if (after === buffer.length || buffer[after] === 0x0a) {
        return i;
      }
    }
  }
  return -1;
}

function indexOfLineEnd(buffer: Buffer, start: number): number {
  for (let i = start; i < buffer.length; i++) {
    if (buffer[i] === 0x0a) {
      return i;
    }
  }
  return -1;
}

function skipBytes(buffer: Buffer, pos: number, count: number): number {
  return pos + count;
}

function extractHeaderValue(header: string, key: string): string {
  const match = header.match(new RegExp(`${key}="([^"]*)"|,${key}=([^;\\r\n]*)`, 'i'));
  if (!match) return '';
  return (match[1] ?? match[2] ?? '').trim();
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown, extraHeaders: Record<string, string> = {}): void {
  const headers = {
    ...getSecurityHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

async function renderSharePage(req: IncomingMessage, res: ServerResponse, slug: string): Promise<void> {
  const db = await getDatabase();
  const article = await db.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published' AND deleted_at IS NULL").get(slug) as any;

  const title = article?.title ? `${article.title}` : "U.N.I.O.N, Union Nationale pour l'Unité";
  const standfirst = article?.standfirst ? `${article.standfirst}` : "Un Congo uni travaille. Un Congo divisé mendie.";
  const leadImage = parseLeadImage(article?.lead_image);
  const imageUrl = absoluteUrl(req, leadImage?.src);
  const targetUrl = `/#/journal/${encodeURIComponent(slug)}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | U.N.I.O.N</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(standfirst)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=${targetUrl}" />
  <script>window.location.replace('${targetUrl}');</script>
</head>
<body style="font-family:sans-serif;padding:2rem;text-align:center;">
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(standfirst)}</p>
  <p>Redirection vers l'article... <a href="${targetUrl}">Cliquez ici</a></p>
</body>
</html>`;
  sendHtml(res, 200, html);
}

function sendHtml(res: ServerResponse, statusCode: number, html: string): void {
  const headers = {
    ...getSecurityHeaders(),
    'Content-Type': 'text/html; charset=utf-8',
  };
  res.writeHead(statusCode, headers);
  res.end(html);
}

// Master Request Handler for API routes and Open Graph share pages
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `http://${host}`);
  const pathname = url.pathname;
  const method = req.method?.toUpperCase() || 'GET';
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const cookies = parseCookies(req.headers.cookie);

  // 1. Open Graph Share Page: GET /p/:slug or /api/v1/share/:slug
  const shareSlug = pathname.startsWith('/api/v1/share/')
    ? decodeURIComponent(pathname.replace(/^\/api\/v1\/share\//, '').replace(/\/+$/, ''))
    : pathname.startsWith('/p/')
      ? decodeURIComponent(pathname.replace(/^\/p\//, '').replace(/\/+$/, ''))
      : null;
  if (method === 'GET' && shareSlug !== null) {
    await renderSharePage(req, res, shareSlug);
    return true;
  }

  // Sonde de santé. La version courte ne touche jamais la base.
  if (method === 'GET' && pathname === '/api/health') {
    const deep = url.searchParams.get('deep') === '1';
    const updatedAt = snapshotUpdatedAt(editionSnapshot);
    const parsedUpdatedAt = updatedAt ? Date.parse(updatedAt) : Number.NaN;
    const snapshot = {
      updatedAt,
      ageSeconds: Number.isFinite(parsedUpdatedAt)
        ? Math.max(0, Math.round((Date.now() - parsedUpdatedAt) / 1000))
        : null,
    };

    if (!deep) {
      sendJson(
        res,
        200,
        {
          ok: true,
          service: 'union-api',
          database: 'untouched',
          snapshot,
          storageLimitBytes: DB_STORAGE_LIMIT_BYTES,
        },
        { 'Cache-Control': 'no-store' },
      );
      return true;
    }

    const secret = process.env.HEALTH_SECRET;
    if (!secret) {
      sendJson(res, 503, { error: 'Sonde profonde non configurée (HEALTH_SECRET).' });
      return true;
    }
    const provided =
      (req.headers.authorization || '').replace(/^Bearer\s+/i, '') ||
      url.searchParams.get('key') ||
      '';
    if (!constantTimeEqual(provided, secret)) {
      sendJson(res, 401, { error: 'Accès refusé.' });
      return true;
    }

    try {
      const metrics = await withDbRetry(async () =>
        withTimeout(collectDbMetrics()),
      );
      sendJson(
        res,
        200,
        {
          ok: true,
          service: 'union-api',
          database: 'ok',
          ...buildHealthReport({ ...metrics, snapshotUpdatedAt: updatedAt }),
        },
        { 'Cache-Control': 'no-store' },
      );
    } catch (error) {
      sendJson(
        res,
        503,
        {
          ok: false,
          service: 'union-api',
          database: 'unavailable',
          code: classifyDatabaseError(error),
        },
        { 'Cache-Control': 'no-store' },
      );
    }
    return true;
  }

  // 1 bis. Tâche quotidienne déclenchée par Vercel Cron, protégée par CRON_SECRET.
  if (pathname === '/api/cron/daily') {
    if (method !== 'GET') {
      sendJson(res, 405, { error: 'Méthode non autorisée.' });
      return true;
    }
    const secret = process.env.CRON_SECRET;
    const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!secret || !constantTimeEqual(provided, secret)) {
      sendJson(res, 401, { error: 'Accès refusé.' }, { 'Cache-Control': 'no-store' });
      return true;
    }
    const result = await runDailyMaintenance();
    sendJson(res, 200, { ok: true, ...result }, { 'Cache-Control': 'no-store' });
    return true;
  }

  // Check if it's an API route
  if (!pathname.startsWith('/api/v1/')) {
    return false;
  }

  try {
    // 2. GET /api/v1/edition — instantané public, sans réveil de la base.
    if (method === 'GET' && pathname === '/api/v1/edition') {
      try {
        const served = await loadSnapshot({
          state: editionSnapshot,
          source: snapshotStore(),
          build: async () => buildEditionDocument(await getDatabase(), req),
        });
        const { payload } = served;
        const updatedAt = payload.document.updatedAt;
        const parsed = Date.parse(updatedAt);
        const age = Number.isFinite(parsed)
          ? Math.max(0, Math.round((Date.now() - parsed) / 1000))
          : null;
        const headers = {
          ETag: payload.etag,
          'Cache-Control': SNAPSHOT_CACHE_CONTROL,
          'X-Snapshot-Origin': served.origin,
          'X-Snapshot-Updated-At': updatedAt,
          'X-Snapshot-Age': age === null ? 'unknown' : String(age),
        };

        if (req.headers['if-none-match'] === payload.etag) {
          res.writeHead(304, { ...getSecurityHeaders(), ...headers });
          res.end();
          return true;
        }

        res.writeHead(200, {
          ...getSecurityHeaders(),
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
        });
        res.end(payload.body);
        return true;
      } catch (error) {
        const degraded = degradedResponse(error);
        if (!degraded) throw error;
        sendJson(res, degraded.status, degraded.body, {
          'Cache-Control': 'no-store',
          'Retry-After': String(degraded.retryAfterSeconds),
        });
        return true;
      }
    }

    // 2b. POST /api/v1/warm — réveil à l’intention, une fois par dix minutes.
    if (method === 'POST' && pathname === '/api/v1/warm') {
      const body = (await readJsonBody(req)) as { text?: unknown; proof?: unknown };
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      const proof = typeof body?.proof === 'string' ? body.proof : '';
      if (text.length < WARM_MIN_TEXT_LENGTH || !proof || !verifyProofOfWork(text, proof)) {
        sendJson(res, 400, { error: 'Requête de réveil refusée.' });
        return true;
      }
      const gate = requestWarm();
      if (!gate.allowed) {
        sendJson(
          res,
          429,
          { error: 'La base a déjà été réveillée récemment.', retryAfter: gate.retryAfterSeconds },
          { 'Cache-Control': 'no-store', 'Retry-After': String(gate.retryAfterSeconds ?? 600) },
        );
        return true;
      }
      try {
        await withDbRetry(async () => {
          await (await getDatabase()).prepare('SELECT 1').get();
        });
      } catch (error) {
        const degraded = degradedResponse(error);
        sendJson(
          res,
          degraded?.status ?? 503,
          degraded?.body ?? { error: 'La base de données ne répond pas.' },
          { 'Cache-Control': 'no-store' },
        );
        return true;
      }
      sendJson(res, 200, { warm: true }, { 'Cache-Control': 'no-store' });
      return true;
    }

    // 3. POST /api/v1/suggestions
    if (method === 'POST' && pathname === '/api/v1/suggestions') {
      const rateCheck = checkRateLimit(clientIp);
      if (!rateCheck.allowed) {
        sendJson(res, 429, {
          error: 'Limite de fréquence atteinte. Attendez une heure entre deux dépôts de suggestion.',
          retryAfter: rateCheck.retryAfterSeconds,
        });
        return true;
      }

      const body = await readJsonBody(req);
      const input = validateSuggestionInput(body);

      // Verify Proof of Work (mandatory)
      if (!input.proof) {
        sendJson(res, 400, { error: 'Épreuve de calcul manquante.' });
        return true;
      }
      if (!verifyProofOfWork(input.text, input.proof)) {
        sendJson(res, 400, { error: 'Épreuve de calcul invalide.' });
        return true;
      }

      // Check existing texts for duplication
      const db = await getDatabase();
      const existingRows = await db.prepare('SELECT text FROM suggestions ORDER BY created_at DESC LIMIT 100').all() as Array<{ text: string }>;
      const modResult = analyseSuggestion({
        text: input.text,
        category: input.category,
        existingTexts: existingRows.map((r) => r.text),
      });

      if (!modResult.ok) {
        sendJson(res, 400, {
          error: modResult.code === 'hate'
            ? 'Ce texte contient des propos qui ne sont pas acceptés.'
            : modResult.code === 'personal'
            ? 'Retirez les numéros, e-mails ou coordonnées.'
            : 'Suggestion refusée par les filtres de modération.',
          code: modResult.code,
        });
        return true;
      }

      const id = `sugg-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const flagged = modResult.flagged ? 1 : 0;
      const flagReason = modResult.flagReason || null;

      await withDbRetry(async () => {
        await (await getDatabase())
          .prepare(`
            INSERT INTO suggestions (id, text, category, department, status, flagged, flag_reason, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
          `)
          .run(id, input.text, input.category, input.department || null, flagged, flagReason, now, now);
      });
      await refreshPublicEdition();

      sendJson(res, 202, {
        id,
        status: 'pending',
        message: 'Suggestion reçue. Elle sera examinée par le bureau.',
      });
      return true;
    }

    // 4. POST /api/v1/votes — une instruction par vote, compteurs renvoyés.
    if (method === 'POST' && pathname === '/api/v1/votes') {
      if (!isVoteConfigured() && process.env.NODE_ENV === 'production') {
        sendJson(res, 503, { error: 'Le vote n’est pas configuré sur ce serveur.' });
        return true;
      }
      const body = await readJsonBody(req);
      const input = validateVoteInput(body) as {
        suggestionId: string;
        value: 'useful' | 'not_useful';
        token: string;
      };

      try {
        const outcome = await withDbRetry(async () => performVote(await getDatabase(), input));
        await refreshPublicEdition();
        sendJson(res, 200, outcome);
      } catch (error) {
        if (error instanceof VoteRejected) {
          sendJson(res, error.reason === 'not_found' ? 404 : 409, {
            error:
              error.reason === 'not_found'
                ? 'Suggestion introuvable.'
                : 'Cette suggestion n’est plus ouverte au vote.',
          });
          return true;
        }
        throw error;
      }
      return true;
    }

    // 5. POST /api/v1/reports
    if (method === 'POST' && pathname === '/api/v1/reports') {
      const body = await readJsonBody(req);
      const input = validateReportInput(body);

      const db = await getDatabase();
      const suggestion = await db.prepare('SELECT id FROM suggestions WHERE id = ?').get(input.suggestionId);
      if (!suggestion) {
        sendJson(res, 404, { error: 'Suggestion introuvable.' });
        return true;
      }

      const reportId = `rep-${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      await withDbRetry(async () => {
        const target = await getDatabase();
        await target.transaction(async (tx) => {
          await tx
            .prepare('INSERT INTO reports (id, suggestion_id, reason, created_at) VALUES (?, ?, ?, ?)')
            .run(reportId, input.suggestionId, input.reason, now);
          await tx
            .prepare('UPDATE suggestions SET report_count = report_count + 1, updated_at = ? WHERE id = ?')
            .run(now, input.suggestionId);
        });
      });
      await refreshPublicEdition();

      sendJson(res, 201, { ok: true, reportId });
      return true;
    }

    // 5b. POST /api/v1/members — dossier de membre, carte envoyée par e-mail
    if (method === 'POST' && pathname === '/api/v1/members') {
      if (!isMailConfigured() || dossierRecipients().length === 0) {
        sendJson(res, 503, {
          error:
            'Le service de carte de membre n’est pas encore ouvert. Le groupe WhatsApp reste le canal du mouvement.',
        });
        return true;
      }

      const memberRateCheck = checkMemberRateLimit(clientIp);
      if (!memberRateCheck.allowed) {
        sendJson(res, 429, {
          error: 'Trop de demandes depuis cette connexion. Réessayez dans une heure.',
          retryAfter: memberRateCheck.retryAfterSeconds,
        });
        return true;
      }

      const contentType = (req.headers['content-type'] ?? '').toString();
      let fields: Record<string, string | null>;
      let files: Record<string, RawFormFile | null>;

      if (isFormDataContentType(contentType)) {
        const parsed = await readFormDataBody(req);
        fields = parsed.fields;
        files = parsed.files;
      } else {
        const raw = await readJsonBody(req) as Record<string, unknown> | null;
        fields = raw
          ? Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === 'string' ? value : null]))
          : {};
        files = {};
      }

      const input = validateMemberInput({
        ...fields,
        selfiePath: files.selfie ? `/selfies/${files.selfie.name}` : null,
        identityPath: files.identity ? `/documents/${files.identity.name}` : null,
      });

      const now = new Date();
      const issuedAt = now.toISOString();
      const memberNumber = createMemberNumber(now);

      const documents = await storeMemberDocuments(
        process.env,
        {
          selfie: (files.selfie && files.selfie.body.length > 0) ? new File([Buffer.from(files.selfie.body)], files.selfie.name, { type: files.selfie.type }) : null,
          identity: (files.identity && files.identity.body.length > 0) ? new File([Buffer.from(files.identity.body)], files.identity.name, { type: files.identity.type }) : null,
        },
        now,
      );

      // 1. Le dossier part au bureau.
      const bureauDossier = buildMemberDossier({
        fullName: input.fullName,
        email: input.email,
        department: input.department,
        phone: input.phone,
        memberNumber,
        issuedAt,
        documentSelfieUrl: documents.selfie?.url ?? null,
        documentIdUrl: documents.identity?.url ?? null,
      });
      const bureauSend = await sendMail({
        to: dossierRecipients(),
        subject: bureauDossier.subject,
        html: bureauDossier.html,
        text: bureauDossier.text,
        replyTo: input.email,
      });
      if (!bureauSend.ok) {
        sendJson(res, 502, {
          error: 'Le dossier n’a pas pu être transmis au bureau. Aucune carte n’a été délivrée.',
        });
        return true;
      }

      // 1b. Notification Studio pour vérification.
      const studioDossier = buildMemberDossier({
        fullName: input.fullName,
        email: input.email,
        department: input.department,
        phone: input.phone,
        memberNumber,
        issuedAt,
        documentSelfieUrl: documents.selfie?.url ?? null,
        documentIdUrl: documents.identity?.url ?? null,
      }, { studio: true });

      const studioSend = await sendMail({
        to: dossierRecipients(),
        subject: studioDossier.subject,
        html: studioDossier.html,
        text: studioDossier.text,
        replyTo: input.email,
      });

      if (!studioSend.ok) {
        console.warn('Notification Studio non envoyée :', studioSend.reason);
      }

      const db = await getDatabase();
      await db.transaction(async (tx) => {
        await tx.prepare(
          'INSERT INTO members (id, member_number, full_name, email, department, phone, documents_consent, status, created_at, card_sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ).run(
          `member-${crypto.randomUUID()}`,
          memberNumber,
          input.fullName,
          input.email,
          input.department,
          input.phone,
          input.documentsConsent ? 1 : 0,
          'dossier_recu',
          issuedAt,
          null,
        );

        // Conservation maximale de 12 mois, aucune donnée publiée.
        await tx.prepare('DELETE FROM members WHERE created_at < ?').run(
          new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        );
      });

      // 2. La carte part au membre.
      const card = buildMemberCard({
        fullName: input.fullName,
        memberNumber,
        department: input.department,
        phone: input.phone,
        issuedAt,
        documentSelfieUrl: documents.selfie?.url ?? null,
        documentIdUrl: documents.identity?.url ?? null,
      });
      const cardSend = await sendMail({
        to: [input.email],
        subject: card.subject,
        html: card.html,
        text: card.text,
      });

      if (!cardSend.ok) {
        sendJson(res, 202, {
          ok: true,
          cardSent: false,
          memberNumber,
          message:
            'Votre dossier est arrivé au bureau et au Studio, mais la carte n’a pas pu être envoyée à votre adresse.',
        });
        return true;
      }

      await db.prepare('UPDATE members SET status = ?, card_sent_at = ? WHERE member_number = ?').run(
        'carte_envoyee',
        issuedAt,
        memberNumber,
      );

      sendJson(res, 201, {
        ok: true,
        cardSent: true,
        memberNumber,
        message: 'Votre dossier est arrivé au bureau et au Studio, et votre carte a été envoyée.',
      });
      return true;
    }

    // 6. GET /api/v1/roadmap
    if (method === 'GET' && pathname === '/api/v1/roadmap') {
      const db = await getDatabase();
      const steps = await db.prepare('SELECT id, step_order AS "stepOrder", title, status, description, updated_at AS "updatedAt" FROM roadmap ORDER BY step_order ASC').all();
      sendJson(res, 200, { steps });
      return true;
    }

    // 7. STUDIO ROUTES: /api/v1/studio/*
    if (pathname.startsWith('/api/v1/studio/')) {
      // 7a. POST /api/v1/studio/login
      if (method === 'POST' && pathname === '/api/v1/studio/login') {
        if (!isStudioConfigured()) {
          sendJson(res, 503, {
            error: 'Studio non configuré : définissez SESSION_SECRET (32 caractères minimum) ou STUDIO_SECRET (16 caractères minimum).',
          });
          return true;
        }

        const body = (await readJsonBody(req)) as any;
        const code = typeof body.code === 'string' ? body.code : '';
        const expectedSecret = getStudioLoginSecret() as string;

        if (constantTimeEqual(code, expectedSecret)) {
          const session = createStudioSession({
            id: 'admin-1',
            username: 'bureau',
            role: 'admin',
          });

          const cookieStr = `union_session=${session.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          sendJson(res, 200, { ok: true, user: session.user }, { 'Set-Cookie': cookieStr });
          return true;
        }

        sendJson(res, 401, { error: 'Code d’accès incorrect.' });
        return true;
      }

      // Check session for all other studio routes
      const sessionToken = cookies.union_session;
      const session = getStudioSession(sessionToken);
      if (!session) {
        sendJson(res, 401, { error: 'Session non authentifiée ou expirée.' });
        return true;
      }

      // 7b. POST /api/v1/studio/logout
      if (method === 'POST' && pathname === '/api/v1/studio/logout') {
        revokeStudioSession(sessionToken);
        const expiredCookie = 'union_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';
        sendJson(res, 200, { ok: true }, { 'Set-Cookie': expiredCookie });
        return true;
      }

      // 7c. GET /api/v1/studio/me
      if (method === 'GET' && pathname === '/api/v1/studio/me') {
        sendJson(res, 200, { user: session.user });
        return true;
      }

      const db = await getDatabase('studio');

      // 7c-bis. GET /api/v1/studio/health — budget de stockage et sauvegardes.
      if (method === 'GET' && pathname === '/api/v1/studio/health') {
        try {
          const metrics = await withDbRetry(async () =>
            withTimeout(collectDbMetrics()),
          );
          sendJson(res, 200, {
            ok: true,
            ...buildHealthReport({
              ...metrics,
              snapshotUpdatedAt: snapshotUpdatedAt(editionSnapshot),
            }),
          });
        } catch (error) {
          sendJson(res, 503, {
            ok: false,
            code: classifyDatabaseError(error),
            error: 'La base de données ne répond pas.',
          });
        }
        return true;
      }

      // 7d. GET /api/v1/studio/suggestions (all suggestions including pending & flagged)
      if (method === 'GET' && pathname === '/api/v1/studio/suggestions') {
        const rows = await db.prepare(`
          SELECT s.*,
            (SELECT response_text FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_text,
            (SELECT created_at FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_created_at
          FROM suggestions s
          ORDER BY s.created_at DESC
        `).all();
        sendJson(res, 200, { suggestions: rows.map((row: any) => mapSuggestion(row)) });
        return true;
      }

      // 7e. POST /api/v1/studio/suggestions/:id/moderate
      if (method === 'POST' && /^\/api\/v1\/studio\/suggestions\/[^/]+\/moderate$/.test(pathname)) {
        const id = decodeURIComponent(pathname.split('/')[5] || '');
        const body = (await readJsonBody(req)) as any;
        const now = new Date().toISOString();
        const existing = await db.prepare('SELECT id, status FROM suggestions WHERE id = ?').get(id) as any;
        if (!existing) {
          sendJson(res, 404, { error: 'Suggestion introuvable.' });
          return true;
        }

        const allowedStatuses = ['pending', 'discussion', 'retained', 'adapted', 'integrated', 'archived', 'expired'];
        if (body.action === 'status' && !allowedStatuses.includes(body.status)) {
          sendJson(res, 400, { error: 'Statut inconnu.' });
          return true;
        }
        if (body.action === 'merge') {
          const target = typeof body.duplicateOf === 'string' ? body.duplicateOf.trim() : '';
          if (!target || target === id) {
            sendJson(res, 400, { error: 'Identifiant de fusion invalide.' });
            return true;
          }
          const targetExists = await db.prepare('SELECT id FROM suggestions WHERE id = ?').get(target);
          if (!targetExists) {
            sendJson(res, 404, { error: 'Suggestion cible introuvable.' });
            return true;
          }
        }
        if (!['approve', 'archive', 'status', 'merge', 'response'].includes(body.action)) {
          sendJson(res, 400, { error: 'Action de modération inconnue.' });
          return true;
        }

        await db.transaction(async (tx) => {
          if (body.action === 'approve') {
            await tx
              .prepare('UPDATE suggestions SET status = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?')
              .run('discussion', now, now, id);
          } else if (body.action === 'archive') {
            await tx
              .prepare('UPDATE suggestions SET status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
              .run('archived', now, now, id);
          } else if (body.action === 'status') {
            await tx
              .prepare('UPDATE suggestions SET status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
              .run(
                body.status,
                body.status === 'archived' || body.status === 'expired' ? now : null,
                now,
                id,
              );
          } else if (body.action === 'merge') {
            await tx
              .prepare('UPDATE suggestions SET status = ?, duplicate_of = ?, archived_at = ?, updated_at = ? WHERE id = ?')
              .run('archived', body.duplicateOf.trim(), now, now, id);
          }

          if (typeof body.response === 'string' && body.response.trim()) {
            await tx
              .prepare('INSERT INTO suggestion_responses (id, suggestion_id, response_text, responder_role, created_at) VALUES (?, ?, ?, ?, ?)')
              .run(`resp-${crypto.randomUUID()}`, id, body.response.trim(), session.user.role, now);
            if (existing.status === 'discussion' || existing.status === 'retained') {
              await tx
                .prepare('UPDATE suggestions SET status = ?, updated_at = ? WHERE id = ?')
                .run('adapted', now, id);
            } else {
              await tx.prepare('UPDATE suggestions SET updated_at = ? WHERE id = ?').run(now, id);
            }
          }

          await writeAudit(
            tx,
            `modération:${body.action || 'response'}`,
            id,
            body.status || body.duplicateOf || body.response || '',
            session.user.role,
            now,
          );
        });

        await refreshPublicEdition({ force: true });
        sendJson(res, 200, { ok: true });
        return true;
      }

      // 7f. GET /api/v1/studio/articles
      if (method === 'GET' && pathname === '/api/v1/studio/articles') {
        const rows = await db.prepare('SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY updated_at DESC').all();
        const articles = await Promise.all(
          rows.map(async (row: any) => mapArticle(req, row, await articleRevisions(db, row.id))),
        );
        sendJson(res, 200, { articles });
        return true;
      }

      // 7g. POST /api/v1/studio/articles (Create)
      if (method === 'POST' && pathname === '/api/v1/studio/articles') {
        const body = (await readJsonBody(req)) as any;
        const id = typeof body.id === 'string' && body.id ? body.id : `art-${crypto.randomUUID()}`;
        const now = new Date().toISOString();
        const status = articleStatus(body.status);

        await db.transaction(async (tx) => {
          const slug = await uniqueSlug(tx, normaliseSlug(body.slug || body.title || 'article'), id);
          const article = normaliseArticlePayload(body, {
            id,
            slug,
            status,
            createdAt: now,
            updatedAt: now,
            publishedAt: status === 'published' ? body.publishedAt || now : body.publishedAt || null,
          });

          await tx.prepare(`
            INSERT INTO articles (id, slug, title, standfirst, body, lead_image, category, department, nature, status, featured, week_number, week_start, week_end, sources, created_at, updated_at, published_at, archived_at, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            article.id,
            article.slug,
            article.title,
            article.standfirst,
            JSON.stringify(article.body),
            article.leadImage ? JSON.stringify(article.leadImage) : null,
            article.category,
            article.department,
            article.nature,
            article.status,
            article.featured ? 1 : 0,
            article.weekNumber,
            article.weekStart,
            article.weekEnd,
            JSON.stringify(article.sources),
            article.createdAt,
            article.updatedAt,
            article.publishedAt,
            article.archivedAt,
            article.deletedAt,
          );

          if (body.recordRevision !== false) {
            await insertRevision(tx, article, 'Création', session.user.username, now);
          }
          await unfeatureOthers(tx, article);
          await writeAudit(tx, 'article:création', id, article.title, session.user.role, now);
        });

        await refreshPublicEdition({ force: true });
        sendJson(res, 201, { ok: true, id, article: mapArticle(req, await db.prepare('SELECT * FROM articles WHERE id = ?').get(id), await articleRevisions(db, id)) });
        return true;
      }

      // 7h. PUT /api/v1/studio/articles/:id (Update)
      if (method === 'PUT' && /^\/api\/v1\/studio\/articles\/[^/]+$/.test(pathname)) {
        const id = decodeURIComponent(pathname.replace('/api/v1/studio/articles/', ''));
        const existing = await db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
        if (!existing) {
          sendJson(res, 404, { error: 'Article introuvable.' });
          return true;
        }
        const body = (await readJsonBody(req)) as any;
        const now = new Date().toISOString();
        const status = articleStatus(body.status);
        await db.transaction(async (tx) => {
          const slug = await uniqueSlug(
            tx,
            normaliseSlug(body.slug || existing.slug || body.title || 'article'),
            id,
          );
          const article = normaliseArticlePayload(body, {
            id,
            slug,
            status,
            createdAt: existing.created_at,
            updatedAt: now,
            publishedAt:
              status === 'published'
                ? existing.published_at || body.publishedAt || now
                : body.publishedAt || existing.published_at || null,
            archivedAt:
              body.archivedAt ?? (status === 'archived' ? existing.archived_at || now : existing.archived_at),
            deletedAt: body.deletedAt ?? existing.deleted_at,
          });

          await tx.prepare(`
            UPDATE articles SET
              slug = ?, title = ?, standfirst = ?, body = ?, lead_image = ?, category = ?,
              department = ?, nature = ?, status = ?, featured = ?, week_number = ?,
              week_start = ?, week_end = ?, sources = ?, updated_at = ?,
              published_at = ?, archived_at = ?, deleted_at = ?
            WHERE id = ?
          `).run(
            article.slug,
            article.title,
            article.standfirst,
            JSON.stringify(article.body),
            article.leadImage ? JSON.stringify(article.leadImage) : null,
            article.category,
            article.department,
            article.nature,
            article.status,
            article.featured ? 1 : 0,
            article.weekNumber,
            article.weekStart,
            article.weekEnd,
            JSON.stringify(article.sources),
            article.updatedAt,
            article.publishedAt,
            article.archivedAt,
            article.deletedAt,
            id,
          );

          if (body.recordRevision !== false) {
            await insertRevision(tx, article, body.revisionSummary || 'Modification', session.user.username, now);
          }
          await unfeatureOthers(tx, article);
          await writeAudit(tx, 'article:modification', id, article.title, session.user.role, now);
        });

        await refreshPublicEdition({ force: true });
        sendJson(res, 200, { ok: true, id, article: mapArticle(req, await db.prepare('SELECT * FROM articles WHERE id = ?').get(id), await articleRevisions(db, id)) });
        return true;
      }

      // 7i. PUT /api/v1/studio/roadmap
      if (method === 'PUT' && pathname === '/api/v1/studio/roadmap') {
        const body = (await readJsonBody(req)) as any;
        const steps = body.steps || [];
        const now = new Date().toISOString();

        await db.transaction(async (tx) => {
          await tx.prepare('DELETE FROM roadmap').run();
          const insert = tx.prepare('INSERT INTO roadmap (id, step_order, title, status, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
          for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            await insert.run(s.id || `step-${i + 1}`, i + 1, s.title, s.status, s.description || '', now);
          }
        });

        await refreshPublicEdition({ force: true });
        sendJson(res, 200, { ok: true });
        return true;
      }

      // 7j. GET /api/v1/studio/settings
      if (method === 'GET' && pathname === '/api/v1/studio/settings') {
        sendJson(res, 200, { settings: await readSettings(db) });
        return true;
      }

      // 7k. PUT /api/v1/studio/settings
      if (method === 'PUT' && pathname === '/api/v1/studio/settings') {
        const body = (await readJsonBody(req)) as any;
        const current = await readSettings(db);
        const settings = {
          retainedVotes: positiveInt(body.retainedVotes, current.retainedVotes),
          retainedShare: percentage(body.retainedShare, current.retainedShare),
          archivedVotes: positiveInt(body.archivedVotes, current.archivedVotes),
          archivedShare: percentage(body.archivedShare, current.archivedShare),
          expiryDays: positiveInt(body.expiryDays, current.expiryDays),
          retentionDays: positiveInt(body.retentionDays, current.retentionDays),
        };
        await db.transaction(async (tx) => {
          await tx
            .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
            .run('suggestions', JSON.stringify(settings));
          await writeAudit(tx, 'réglages:seuils', 'suggestions', JSON.stringify(settings), session.user.role, new Date().toISOString());
        });
        await refreshPublicEdition({ force: true });
        sendJson(res, 200, { ok: true, settings });
        return true;
      }

      // 7l. GET /api/v1/studio/audit
      if (method === 'GET' && pathname === '/api/v1/studio/audit') {
        const logs = await db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
        sendJson(res, 200, {
          audit: logs.map((row: any) => ({
            id: row.id,
            at: row.created_at,
            actor: row.user_role,
            action: row.action,
            target: row.target,
          })),
        });
        return true;
      }

      // 7m. GET /api/v1/studio/backup (complete server snapshot)
      if (method === 'GET' && pathname === '/api/v1/studio/backup') {
        const articleRows = await db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all();
        const suggestionRows = await db.prepare(`
          SELECT s.*,
            (SELECT response_text FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_text,
            (SELECT created_at FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_created_at
          FROM suggestions s
          ORDER BY s.created_at DESC
        `).all();
        const votes = (await db.prepare('SELECT * FROM suggestion_votes ORDER BY updated_at DESC').all()).map((row: any) => ({
          suggestionId: row.suggestion_id,
          voterHash: row.voter_hash,
          value: row.value,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        const reports = (await db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all()).map((row: any) => ({
          id: row.id,
          suggestionId: row.suggestion_id,
          reason: row.reason,
          createdAt: row.created_at,
        }));
        const audit = (await db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all()).map((row: any) => ({
          id: row.id,
          at: row.created_at,
          actor: row.user_role,
          action: row.action,
          target: row.target,
        }));
        const updatedAt = latestIso([
          ...articleRows.map((row: any) => row.updated_at),
          ...suggestionRows.map((row: any) => row.updated_at),
          ...votes.map((vote: any) => vote.updatedAt),
          ...reports.map((report: any) => report.createdAt),
          ...audit.map((entry: any) => entry.at),
        ]) || new Date().toISOString();
        sendJson(res, 200, {
          format: 'union-backup',
          version: 1,
          revision: Date.now(),
          updatedAt,
          articles: await Promise.all(
            articleRows.map(async (row: any) => mapArticle(req, row, await articleRevisions(db, row.id))),
          ),
          suggestions: suggestionRows.map((row: any) => mapSuggestion(row)),
          votes,
          reports,
          settings: await readSettings(db),
          audit,
        });
        return true;
      }
    }

    sendJson(res, 404, { error: 'Route API introuvable' });
    return true;
  } catch (err: any) {
    if (err instanceof PayloadTooLargeError) {
      sendJson(res, 413, { error: 'Corps trop volumineux.' });
      return true;
    }
    if (err instanceof ValidationException) {
      sendJson(res, 400, { error: 'Données non valides', errors: err.errors });
      return true;
    }
    const degraded = degradedResponse(err);
    if (degraded) {
      sendJson(res, degraded.status, degraded.body, {
        'Cache-Control': 'no-store',
        'Retry-After': String(degraded.retryAfterSeconds),
      });
      return true;
    }
    console.error('API Error:', err);
    sendJson(res, 500, { error: 'Erreur interne du serveur' });
    return true;
  }
}

class VoteRejected extends Error {
  constructor(readonly reason: 'not_found' | 'closed') {
    super(reason);
    this.name = 'VoteRejected';
  }
}

async function performVote(
  db: Database,
  input: { suggestionId: string; value: 'useful' | 'not_useful'; token: string },
): Promise<{
  ok: true;
  suggestionId: string;
  myVote: string | null;
  status: string;
  votesUseful: number;
  votesNotUseful: number;
}> {
  return db.transaction(async (tx) => {
    const suggestion = await tx
      .prepare('SELECT * FROM suggestions WHERE id = ?')
      .get(input.suggestionId) as any;
    if (!suggestion) throw new VoteRejected('not_found');
    if (!['discussion', 'retained', 'adapted', 'integrated'].includes(suggestion.status)) {
      throw new VoteRejected('closed');
    }

    const voterHash = hashVoterToken(input.token);
    const now = new Date().toISOString();
    const existingVote = await tx
      .prepare(
        'SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?',
      )
      .get(input.suggestionId, voterHash) as any;
    let myVote: string | null = input.value;

    if (existingVote) {
      if (existingVote.value === input.value) {
        await tx
          .prepare('DELETE FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
          .run(input.suggestionId, voterHash);
        myVote = null;
      } else {
        await tx
          .prepare(
            'UPDATE suggestion_votes SET value = ?, updated_at = ? WHERE suggestion_id = ? AND voter_hash = ?',
          )
          .run(input.value, now, input.suggestionId, voterHash);
      }
    } else {
      await tx
        .prepare(
          'INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(`vote-${crypto.randomUUID()}`, input.suggestionId, voterHash, input.value, now, now);
    }

    const counters = await tx
      .prepare(
        `SELECT
           COUNT(*) FILTER (WHERE value = 'useful') AS useful,
           COUNT(*) FILTER (WHERE value = 'not_useful') AS not_useful
         FROM suggestion_votes WHERE suggestion_id = ?`,
      )
      .get(input.suggestionId) as any;
    const countUseful = Number(counters?.useful ?? 0);
    const countNotUseful = Number(counters?.not_useful ?? 0);
    const settings = await readSettings(tx);
    const evaluated = evaluateStatus(
      {
        status: suggestion.status,
        createdAt: suggestion.created_at,
        votesUseful: countUseful,
        votesNotUseful: countNotUseful,
        archivedAt: suggestion.archived_at ?? null,
      },
      settings,
      Date.now(),
    );

    await tx
      .prepare(
        'UPDATE suggestions SET votes_useful = ?, votes_not_useful = ?, status = ?, archived_at = ?, updated_at = ? WHERE id = ?',
      )
      .run(
        countUseful,
        countNotUseful,
        evaluated.status,
        evaluated.archivedAt,
        now,
        input.suggestionId,
      );

    return {
      ok: true as const,
      suggestionId: input.suggestionId,
      myVote,
      status: evaluated.status,
      votesUseful: countUseful,
      votesNotUseful: countNotUseful,
    };
  });
}

async function buildEditionDocument(db: any, req: IncomingMessage | null): Promise<any> {
  const articleRows = await db.prepare(`
    SELECT * FROM articles
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY published_at DESC
  `).all();
  const articles = articleRows.map((row: any) => mapArticle(req, row));

  const suggestionRows = await db.prepare(`
    SELECT s.*,
      (SELECT response_text FROM suggestion_responses r
        WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_text,
      (SELECT created_at FROM suggestion_responses r
        WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_created_at
    FROM suggestions s
    WHERE s.status IN ('discussion', 'retained', 'adapted', 'integrated', 'expired')
    ORDER BY s.created_at DESC
  `).all();
  const suggestions = suggestionRows.map((row: any) => mapSuggestion(row));

  const settingsRow = await db.prepare('SELECT value FROM settings WHERE key = ?').get('suggestions') as any;
  const settings = { ...DEFAULT_SETTINGS, ...(settingsRow ? safeJsonParse(settingsRow.value, {}) : {}) };

  const roadmap = await db.prepare(
    'SELECT id, step_order AS "stepOrder", title, status, description, updated_at AS "updatedAt" FROM roadmap ORDER BY step_order ASC',
  ).all();

  const updatedAt =
    latestIso([
      ...articles.map((article: any) => article.updatedAt),
      ...suggestions.map((suggestion: any) => suggestion.updatedAt),
      ...roadmap.map((step: any) => step.updatedAt),
      settingsRow ? (settings as { editionName?: string }).editionName : null,
    ]) || '1970-01-01T00:00:00.000Z';

  const basePayload = {
    format: 'union-edition',
    version: 1,
    updatedAt,
    articles,
    suggestions,
    settings,
    roadmap,
  };
  const revision = parseInt(
    crypto.createHash('md5').update(JSON.stringify(basePayload)).digest('hex').slice(0, 12),
    16,
  );
  return { ...basePayload, revision };
}

/** Reconstruction opportuniste : la base est déjà éveillée par l’écriture. */
async function refreshPublicEdition(options: { force?: boolean } = {}): Promise<void> {
  try {
    await rebuildSnapshot({
      state: editionSnapshot,
      source: snapshotStore(),
      force: options.force,
      build: async () => buildEditionDocument(await getDatabase(), null),
    });
  } catch (error) {
    console.warn('Instantané non reconstruit :', (error as Error)?.message);
  }
}

export interface DailyMaintenanceResult {
  revisionsPurged: number;
  suggestionsPurged: number;
  auditPurged: number;
}

/** Purge les données au-delà des durées de conservation, puis reconstruit l’instantané. */
export async function runDailyMaintenance(): Promise<DailyMaintenanceResult> {
  const db = await getDatabase('studio');
  const archivedBefore = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const auditBefore = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const revisions = await db.prepare(`
    DELETE FROM article_revisions
    WHERE id IN (
      SELECT id FROM (
        SELECT id, row_number() OVER (PARTITION BY article_id ORDER BY revision_number DESC) AS rn
        FROM article_revisions
      ) ranked
      WHERE rn > 20
    )
  `).run();
  const suggestions = await db.prepare(
    "DELETE FROM suggestions WHERE status = 'archived' AND archived_at IS NOT NULL AND archived_at < ?",
  ).run(archivedBefore);
  const audit = await db.prepare('DELETE FROM audit_log WHERE created_at < ?').run(auditBefore);

  await refreshPublicEdition({ force: true });

  return {
    revisionsPurged: revisions.changes,
    suggestionsPurged: suggestions.changes,
    auditPurged: audit.changes,
  };
}

async function readDatabaseSize(db: any): Promise<number | null> {
  try {
    const row = await db.prepare('SELECT pg_database_size(current_database()) AS size').get() as any;
    const size = Number(row?.size);
    return Number.isFinite(size) ? size : null;
  } catch {
    return null;
  }
}

async function collectDbMetrics(): Promise<{
  dbSizeBytes: number | null;
  backupAt: string | null;
  backupSizeBytes: number | null;
}> {
  const db = await getDatabase('studio');
  const backup = await db.prepare(
    'SELECT created_at AS "at", size_bytes AS "sizeBytes" FROM backup_log ORDER BY created_at DESC LIMIT 1',
  ).get() as any;
  return {
    dbSizeBytes: await readDatabaseSize(db),
    backupAt: backup?.at ?? null,
    backupSizeBytes: typeof backup?.sizeBytes === 'number' ? backup.sizeBytes : null,
  };
}

async function readSettings(db: any): Promise<typeof DEFAULT_SETTINGS> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').get('suggestions') as any;
  return { ...DEFAULT_SETTINGS, ...(row ? safeJsonParse(row.value, {}) : {}) };
}

function positiveInt(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function percentage(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(1, number)) : fallback;
}

function latestIso(values: Array<string | null | undefined>): string | null {
  const valid = values
    .filter((value): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value)))
    .sort();
  return valid.length > 0 ? valid[valid.length - 1] : null;
}

function articleStatus(value: unknown): 'draft' | 'published' | 'archived' {
  return value === 'published' || value === 'archived' ? value : 'draft';
}

function normaliseSlug(value: unknown): string {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'article';
}

async function uniqueSlug(db: any, base: string, id: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await db.prepare('SELECT id FROM articles WHERE slug = ? AND id <> ?').get(candidate, id)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function parseLeadImage(raw: unknown): any {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parsed = safeJsonParse<Record<string, unknown> | null>(raw, null);
  if (parsed && typeof parsed === 'object') {
    return {
      src: typeof parsed.src === 'string' ? parsed.src : '',
      alt: typeof parsed.alt === 'string' ? parsed.alt : '',
      caption: typeof parsed.caption === 'string' ? parsed.caption : '',
      credit: typeof parsed.credit === 'string' ? parsed.credit : '',
    };
  }
  return { src: raw, alt: '', caption: '', credit: '' };
}

function mapArticle(req: IncomingMessage | null, row: any, revisions: any[] = []): any {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    standfirst: row.standfirst || '',
    body: safeJsonParse(row.body, []),
    leadImage: parseLeadImage(row.lead_image),
    category: row.category,
    department: row.department ?? null,
    nature: row.nature || 'info',
    status: row.status,
    featured: Boolean(row.featured),
    weekNumber: row.week_number ?? 0,
    weekStart: row.week_start || '',
    weekEnd: row.week_end || '',
    sources: safeJsonParse(row.sources, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
    archivedAt: row.archived_at ?? null,
    deletedAt: row.deleted_at ?? null,
    revisions,
  };
}

function mapSuggestion(row: any): any {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    department: row.department ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
    archivedAt: row.archived_at ?? null,
    votesUseful: row.votes_useful ?? 0,
    votesNotUseful: row.votes_not_useful ?? 0,
    response: row.response_text
      ? { text: row.response_text, createdAt: row.response_created_at }
      : null,
    reportCount: row.report_count ?? 0,
    duplicateOf: row.duplicate_of ?? null,
  };
}

async function articleRevisions(db: any, articleId: string): Promise<any[]> {
  const rows = await db.prepare('SELECT * FROM article_revisions WHERE article_id = ? ORDER BY revision_number DESC LIMIT 20').all(articleId);
  return rows.map((row: any) => {
    const snapshot = safeJsonParse<Record<string, any>>(row.snapshot, {});
    return {
      id: row.id,
      savedAt: row.created_at,
      title: typeof snapshot.title === 'string' ? snapshot.title : '',
      standfirst: typeof snapshot.standfirst === 'string' ? snapshot.standfirst : '',
      body: Array.isArray(snapshot.body) ? snapshot.body : [],
      leadImage: parseLeadImage(snapshot.leadImage ? JSON.stringify(snapshot.leadImage) : null),
      sources: Array.isArray(snapshot.sources) ? snapshot.sources : [],
    };
  });
}

function normaliseArticlePayload(body: any, overrides: {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
}): any {
  return {
    id: overrides.id,
    slug: overrides.slug,
    title: typeof body.title === 'string' ? body.title : 'Sans titre',
    standfirst: typeof body.standfirst === 'string' ? body.standfirst : '',
    body: Array.isArray(body.body) ? body.body : [],
    leadImage:
      body.leadImage && typeof body.leadImage === 'object' && typeof body.leadImage.src === 'string'
        ? {
            src: body.leadImage.src,
            alt: typeof body.leadImage.alt === 'string' ? body.leadImage.alt : '',
            caption: typeof body.leadImage.caption === 'string' ? body.leadImage.caption : '',
            credit: typeof body.leadImage.credit === 'string' ? body.leadImage.credit : '',
          }
        : null,
    category: typeof body.category === 'string' && body.category ? body.category : 'Vie du mouvement',
    department: typeof body.department === 'string' && body.department ? body.department : null,
    nature: body.nature === 'analyse' || body.nature === 'opinion' ? body.nature : 'info',
    status: overrides.status,
    featured: Boolean(body.featured),
    weekNumber: Number.isFinite(body.weekNumber) ? body.weekNumber : 0,
    weekStart: typeof body.weekStart === 'string' ? body.weekStart : '',
    weekEnd: typeof body.weekEnd === 'string' ? body.weekEnd : '',
    sources: Array.isArray(body.sources) ? body.sources.filter((item: unknown) => typeof item === 'string') : [],
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
    publishedAt: overrides.publishedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    revisions: [],
  };
}

async function unfeatureOthers(db: any, article: any): Promise<void> {
  if (!article.featured || !article.weekStart || article.status !== 'published') return;
  await db.prepare('UPDATE articles SET featured = 0 WHERE id <> ? AND week_start = ? AND status = ?')
    .run(article.id, article.weekStart, 'published');
}

async function insertRevision(db: any, article: any, summary: string, author: string, now: string): Promise<void> {
  const count = Number((await db.prepare('SELECT COUNT(*) as count FROM article_revisions WHERE article_id = ?').get(article.id) as any)?.count ?? 0);
  await db.prepare('INSERT INTO article_revisions (id, article_id, revision_number, snapshot, summary, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(`rev-${crypto.randomUUID()}`, article.id, count + 1, JSON.stringify(article), summary, author, now);
}

async function writeAudit(db: any, action: string, target: string, details: string, role: string, now: string): Promise<void> {
  await db.prepare('INSERT INTO audit_log (id, action, target, details, user_role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`aud-${crypto.randomUUID()}`, action, target, details, role, now);
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function absoluteUrl(req: IncomingMessage, value: string | null | undefined): string {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  const forwarded = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  const protocol = forwarded || 'http';
  const host = req.headers.host || 'localhost';
  if (typeof value === 'string' && value.startsWith('/')) return `${protocol}://${host}${value}`;
  if (typeof value === 'string' && value && !value.startsWith('data:')) return `${protocol}://${host}/${value}`;
  return `${protocol}://${host}/assets/logo-union.jpg`;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
