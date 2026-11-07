import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDatabase } from './db';
import {
  checkRateLimit,
  createStudioSession,
  getSecurityHeaders,
  getStudioSession,
  hashVoterToken,
  isStudioConfigured,
  isVoteConfigured,
  revokeStudioSession,
  verifyProofOfWork,
} from './security';
import {
  validateReportInput,
  validateSuggestionInput,
  validateVoteInput,
  ValidationException,
} from './validator';
import { analyseSuggestion } from '../src/lib/moderation';
import { DEFAULT_SETTINGS, evaluateStatus } from '../src/lib/suggestions';

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

function sendJson(res: ServerResponse, statusCode: number, data: unknown, extraHeaders: Record<string, string> = {}): void {
  const headers = {
    ...getSecurityHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  };
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

function renderSharePage(req: IncomingMessage, res: ServerResponse, slug: string): void {
  const db = getDatabase();
  const article = db.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published' AND deleted_at IS NULL").get(slug) as any;

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
    renderSharePage(req, res, shareSlug);
    return true;
  }

  // Check if it's an API route
  if (!pathname.startsWith('/api/v1/')) {
    return false;
  }

  try {
    const db = getDatabase();

    // 2. GET /api/v1/edition
    if (method === 'GET' && pathname === '/api/v1/edition') {
      const articleRows = db.prepare(`
        SELECT * FROM articles
        WHERE status = 'published' AND deleted_at IS NULL
        ORDER BY published_at DESC
      `).all();
      const articles = articleRows.map((row: any) => mapArticle(req, row));

      const suggestionRows = db.prepare(`
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

      const settingsRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('suggestions') as any;
      const settings = { ...DEFAULT_SETTINGS, ...(settingsRow ? safeJsonParse(settingsRow.value, {}) : {}) };

      const roadmap = db.prepare('SELECT id, step_order as stepOrder, title, status, description, updated_at as updatedAt FROM roadmap ORDER BY step_order ASC').all();

      const updatedAt = latestIso([
        ...articles.map((article: any) => article.updatedAt),
        ...suggestions.map((suggestion: any) => suggestion.updatedAt),
        ...roadmap.map((step: any) => step.updatedAt),
        settingsRow ? settings.editionName : null,
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
      const responsePayload = { ...basePayload, revision };
      const payloadString = JSON.stringify(responsePayload);
      const etag = `"${crypto.createHash('md5').update(payloadString).digest('hex')}"`;

      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ...getSecurityHeaders(), ETag: etag });
        res.end();
        return true;
      }

      sendJson(res, 200, responsePayload, {
        ETag: etag,
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      });
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
      const existingRows = db.prepare('SELECT text FROM suggestions ORDER BY created_at DESC LIMIT 100').all() as Array<{ text: string }>;
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

      db.prepare(`
        INSERT INTO suggestions (id, text, category, department, status, flagged, flag_reason, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(id, input.text, input.category, input.department || null, flagged, flagReason, now, now);

      sendJson(res, 202, {
        id,
        status: 'pending',
        message: 'Suggestion reçue. Elle sera examinée par le bureau.',
      });
      return true;
    }

    // 4. POST /api/v1/votes
    if (method === 'POST' && pathname === '/api/v1/votes') {
      if (!isVoteConfigured() && process.env.NODE_ENV === 'production') {
        sendJson(res, 503, { error: 'Le vote n’est pas configuré sur ce serveur.' });
        return true;
      }
      const body = await readJsonBody(req);
      const input = validateVoteInput(body);

      const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(input.suggestionId) as any;
      if (!suggestion) {
        sendJson(res, 404, { error: 'Suggestion introuvable.' });
        return true;
      }
      if (!['discussion', 'retained', 'adapted', 'integrated'].includes(suggestion.status)) {
        sendJson(res, 409, { error: 'Cette suggestion n’est plus ouverte au vote.' });
        return true;
      }

      const voterHash = hashVoterToken(input.token);
      const now = new Date().toISOString();
      const existingVote = db.prepare(`
        SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?
      `).get(input.suggestionId, voterHash) as any;
      let myVote: string | null = input.value;

      if (existingVote) {
        if (existingVote.value === input.value) {
          db.prepare('DELETE FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
            .run(input.suggestionId, voterHash);
          myVote = null;
        } else {
          db.prepare('UPDATE suggestion_votes SET value = ?, updated_at = ? WHERE suggestion_id = ? AND voter_hash = ?')
            .run(input.value, now, input.suggestionId, voterHash);
        }
      } else {
        db.prepare('INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(`vote-${crypto.randomUUID()}`, input.suggestionId, voterHash, input.value, now, now);
      }

      const countUseful = (db.prepare('SELECT COUNT(*) as count FROM suggestion_votes WHERE suggestion_id = ? AND value = ?').get(input.suggestionId, 'useful') as any)?.count || 0;
      const countNotUseful = (db.prepare('SELECT COUNT(*) as count FROM suggestion_votes WHERE suggestion_id = ? AND value = ?').get(input.suggestionId, 'not_useful') as any)?.count || 0;
      const settings = readSettings(db);
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

      db.prepare('UPDATE suggestions SET votes_useful = ?, votes_not_useful = ?, status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
        .run(countUseful, countNotUseful, evaluated.status, evaluated.archivedAt, now, input.suggestionId);

      sendJson(res, 200, {
        ok: true,
        suggestionId: input.suggestionId,
        myVote,
        status: evaluated.status,
        votesUseful: countUseful,
        votesNotUseful: countNotUseful,
      });
      return true;
    }

    // 5. POST /api/v1/reports
    if (method === 'POST' && pathname === '/api/v1/reports') {
      const body = await readJsonBody(req);
      const input = validateReportInput(body);

      const suggestion = db.prepare('SELECT id FROM suggestions WHERE id = ?').get(input.suggestionId);
      if (!suggestion) {
        sendJson(res, 404, { error: 'Suggestion introuvable.' });
        return true;
      }

      const reportId = `rep-${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      db.prepare('INSERT INTO reports (id, suggestion_id, reason, created_at) VALUES (?, ?, ?, ?)')
        .run(reportId, input.suggestionId, input.reason, now);

      db.prepare('UPDATE suggestions SET report_count = report_count + 1, updated_at = ? WHERE id = ?')
        .run(now, input.suggestionId);

      sendJson(res, 201, { ok: true, reportId });
      return true;
    }

    // 6. GET /api/v1/roadmap
    if (method === 'GET' && pathname === '/api/v1/roadmap') {
      const steps = db.prepare('SELECT id, step_order as stepOrder, title, status, description, updated_at as updatedAt FROM roadmap ORDER BY step_order ASC').all();
      sendJson(res, 200, { steps });
      return true;
    }

    // 7. STUDIO ROUTES: /api/v1/studio/*
    if (pathname.startsWith('/api/v1/studio/')) {
      // 7a. POST /api/v1/studio/login
      if (method === 'POST' && pathname === '/api/v1/studio/login') {
        if (!isStudioConfigured()) {
          sendJson(res, 503, {
            error: 'Studio non configuré : définissez STUDIO_SECRET (16 caractères minimum).',
          });
          return true;
        }

        const body = (await readJsonBody(req)) as any;
        const code = typeof body.code === 'string' ? body.code : '';
        const expectedSecret = process.env.STUDIO_SECRET as string;

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

      // 7d. GET /api/v1/studio/suggestions (all suggestions including pending & flagged)
      if (method === 'GET' && pathname === '/api/v1/studio/suggestions') {
        const rows = db.prepare(`
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
        const existing = db.prepare('SELECT id, status FROM suggestions WHERE id = ?').get(id) as any;
        if (!existing) {
          sendJson(res, 404, { error: 'Suggestion introuvable.' });
          return true;
        }

        const allowedStatuses = ['pending', 'discussion', 'retained', 'adapted', 'integrated', 'archived', 'expired'];
        if (body.action === 'approve') {
          db.prepare('UPDATE suggestions SET status = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?')
            .run('discussion', now, now, id);
        } else if (body.action === 'archive') {
          db.prepare('UPDATE suggestions SET status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
            .run('archived', now, now, id);
        } else if (body.action === 'status' && typeof body.status === 'string') {
          if (!allowedStatuses.includes(body.status)) {
            sendJson(res, 400, { error: 'Statut inconnu.' });
            return true;
          }
          db.prepare('UPDATE suggestions SET status = ?, archived_at = ?, updated_at = ? WHERE id = ?')
            .run(
              body.status,
              body.status === 'archived' || body.status === 'expired' ? now : null,
              now,
              id,
            );
        } else if (body.action === 'merge') {
          const target = typeof body.duplicateOf === 'string' ? body.duplicateOf.trim() : '';
          if (!target || target === id) {
            sendJson(res, 400, { error: 'Identifiant de fusion invalide.' });
            return true;
          }
          const targetExists = db.prepare('SELECT id FROM suggestions WHERE id = ?').get(target);
          if (!targetExists) {
            sendJson(res, 404, { error: 'Suggestion cible introuvable.' });
            return true;
          }
          db.prepare('UPDATE suggestions SET status = ?, duplicate_of = ?, archived_at = ?, updated_at = ? WHERE id = ?')
            .run('archived', target, now, now, id);
        } else if (body.action !== 'response') {
          sendJson(res, 400, { error: 'Action de modération inconnue.' });
          return true;
        }

        if (typeof body.response === 'string' && body.response.trim()) {
          db.prepare('INSERT INTO suggestion_responses (id, suggestion_id, response_text, responder_role, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(`resp-${crypto.randomUUID()}`, id, body.response.trim(), session.user.role, now);
          if (existing.status === 'discussion' || existing.status === 'retained') {
            db.prepare('UPDATE suggestions SET status = ?, updated_at = ? WHERE id = ?')
              .run('adapted', now, id);
          } else {
            db.prepare('UPDATE suggestions SET updated_at = ? WHERE id = ?').run(now, id);
          }
        }

        db.prepare('INSERT INTO audit_log (id, action, target, details, user_role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(
            `aud-${crypto.randomUUID()}`,
            `modération:${body.action || 'response'}`,
            id,
            body.status || body.duplicateOf || body.response || '',
            session.user.role,
            now,
          );

        sendJson(res, 200, { ok: true });
        return true;
      }

      // 7f. GET /api/v1/studio/articles
      if (method === 'GET' && pathname === '/api/v1/studio/articles') {
        const rows = db.prepare('SELECT * FROM articles WHERE deleted_at IS NULL ORDER BY updated_at DESC').all();
        const articles = rows.map((row: any) => mapArticle(req, row, articleRevisions(db, row.id)));
        sendJson(res, 200, { articles });
        return true;
      }

      // 7g. POST /api/v1/studio/articles (Create)
      if (method === 'POST' && pathname === '/api/v1/studio/articles') {
        const body = (await readJsonBody(req)) as any;
        const id = typeof body.id === 'string' && body.id ? body.id : `art-${crypto.randomUUID()}`;
        const now = new Date().toISOString();
        const slug = uniqueSlug(db, normaliseSlug(body.slug || body.title || 'article'), id);
        const status = articleStatus(body.status);
        const article = normaliseArticlePayload(body, {
          id,
          slug,
          status,
          createdAt: now,
          updatedAt: now,
          publishedAt: status === 'published' ? body.publishedAt || now : body.publishedAt || null,
        });

        db.prepare(`
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
          insertRevision(db, article, 'Création', session.user.username, now);
        }
        unfeatureOthers(db, article);
        writeAudit(db, 'article:création', id, article.title, session.user.role, now);

        sendJson(res, 201, { ok: true, id, article: mapArticle(req, db.prepare('SELECT * FROM articles WHERE id = ?').get(id), articleRevisions(db, id)) });
        return true;
      }

      // 7h. PUT /api/v1/studio/articles/:id (Update)
      if (method === 'PUT' && /^\/api\/v1\/studio\/articles\/[^/]+$/.test(pathname)) {
        const id = decodeURIComponent(pathname.replace('/api/v1/studio/articles/', ''));
        const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
        if (!existing) {
          sendJson(res, 404, { error: 'Article introuvable.' });
          return true;
        }
        const body = (await readJsonBody(req)) as any;
        const now = new Date().toISOString();
        const status = articleStatus(body.status);
        const slug = uniqueSlug(
          db,
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

        db.prepare(`
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
          insertRevision(db, article, body.revisionSummary || 'Modification', session.user.username, now);
        }
        unfeatureOthers(db, article);
        writeAudit(db, 'article:modification', id, article.title, session.user.role, now);

        sendJson(res, 200, { ok: true, id, article: mapArticle(req, db.prepare('SELECT * FROM articles WHERE id = ?').get(id), articleRevisions(db, id)) });
        return true;
      }

      // 7i. PUT /api/v1/studio/roadmap
      if (method === 'PUT' && pathname === '/api/v1/studio/roadmap') {
        const body = (await readJsonBody(req)) as any;
        const steps = body.steps || [];
        const now = new Date().toISOString();

        db.exec('DELETE FROM roadmap');
        const insert = db.prepare('INSERT INTO roadmap (id, step_order, title, status, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          insert.run(s.id || `step-${i + 1}`, i + 1, s.title, s.status, s.description || '', now);
        }

        sendJson(res, 200, { ok: true });
        return true;
      }

      // 7j. GET /api/v1/studio/settings
      if (method === 'GET' && pathname === '/api/v1/studio/settings') {
        sendJson(res, 200, { settings: readSettings(db) });
        return true;
      }

      // 7k. PUT /api/v1/studio/settings
      if (method === 'PUT' && pathname === '/api/v1/studio/settings') {
        const body = (await readJsonBody(req)) as any;
        const current = readSettings(db);
        const settings = {
          retainedVotes: positiveInt(body.retainedVotes, current.retainedVotes),
          retainedShare: percentage(body.retainedShare, current.retainedShare),
          archivedVotes: positiveInt(body.archivedVotes, current.archivedVotes),
          archivedShare: percentage(body.archivedShare, current.archivedShare),
          expiryDays: positiveInt(body.expiryDays, current.expiryDays),
          retentionDays: positiveInt(body.retentionDays, current.retentionDays),
        };
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
          .run('suggestions', JSON.stringify(settings));
        writeAudit(db, 'réglages:seuils', 'suggestions', JSON.stringify(settings), session.user.role, new Date().toISOString());
        sendJson(res, 200, { ok: true, settings });
        return true;
      }

      // 7l. GET /api/v1/studio/audit
      if (method === 'GET' && pathname === '/api/v1/studio/audit') {
        const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
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
        const articleRows = db.prepare('SELECT * FROM articles ORDER BY updated_at DESC').all();
        const suggestionRows = db.prepare(`
          SELECT s.*,
            (SELECT response_text FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_text,
            (SELECT created_at FROM suggestion_responses r
              WHERE r.suggestion_id = s.id ORDER BY r.created_at DESC LIMIT 1) AS response_created_at
          FROM suggestions s
          ORDER BY s.created_at DESC
        `).all();
        const votes = db.prepare('SELECT * FROM suggestion_votes ORDER BY updated_at DESC').all().map((row: any) => ({
          suggestionId: row.suggestion_id,
          voterHash: row.voter_hash,
          value: row.value,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        const reports = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all().map((row: any) => ({
          id: row.id,
          suggestionId: row.suggestion_id,
          reason: row.reason,
          createdAt: row.created_at,
        }));
        const audit = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all().map((row: any) => ({
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
          articles: articleRows.map((row: any) => mapArticle(req, row, articleRevisions(db, row.id))),
          suggestions: suggestionRows.map((row: any) => mapSuggestion(row)),
          votes,
          reports,
          settings: readSettings(db),
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
    console.error('API Error:', err);
    sendJson(res, 500, { error: 'Erreur interne du serveur' });
    return true;
  }
}

function readSettings(db: any): typeof DEFAULT_SETTINGS {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('suggestions') as any;
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

function uniqueSlug(db: any, base: string, id: string): string {
  let candidate = base;
  let suffix = 2;
  while (db.prepare('SELECT id FROM articles WHERE slug = ? AND id <> ?').get(candidate, id)) {
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

function mapArticle(req: IncomingMessage, row: any, revisions: any[] = []): any {
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

function articleRevisions(db: any, articleId: string): any[] {
  const rows = db.prepare('SELECT * FROM article_revisions WHERE article_id = ? ORDER BY revision_number DESC LIMIT 20').all(articleId);
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

function unfeatureOthers(db: any, article: any): void {
  if (!article.featured || !article.weekStart || article.status !== 'published') return;
  db.prepare('UPDATE articles SET featured = 0 WHERE id <> ? AND week_start = ? AND status = ?')
    .run(article.id, article.weekStart, 'published');
}

function insertRevision(db: any, article: any, summary: string, author: string, now: string): void {
  const count = (db.prepare('SELECT COUNT(*) as count FROM article_revisions WHERE article_id = ?').get(article.id) as any)?.count || 0;
  db.prepare('INSERT INTO article_revisions (id, article_id, revision_number, snapshot, summary, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(`rev-${crypto.randomUUID()}`, article.id, count + 1, JSON.stringify(article), summary, author, now);
}

function writeAudit(db: any, action: string, target: string, details: string, role: string, now: string): void {
  db.prepare('INSERT INTO audit_log (id, action, target, details, user_role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
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
