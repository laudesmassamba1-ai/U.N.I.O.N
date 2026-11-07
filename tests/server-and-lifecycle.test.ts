import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getDatabase, resetDatabaseForTests } from '../lib/server/db';
import { checkRateLimit, createStudioSession, getStudioSession, hashVoterToken } from '../server/security';
import { evaluateStatus } from '../src/lib/suggestions';
import type { Suggestion, SuggestionSettings } from '../src/types';

async function db() {
  return getDatabase();
}

describe('Cycle de vie serveur et intégrité', () => {
  beforeAll(async () => {
    await resetDatabaseForTests();
    await getDatabase();
  }, 60_000);

  beforeEach(async () => {
    const database = await db();
    await database.prepare('DELETE FROM reports').run();
    await database.prepare('DELETE FROM suggestion_votes').run();
    await database.prepare('DELETE FROM suggestion_responses').run();
    await database.prepare('DELETE FROM article_revisions').run();
    await database.prepare('DELETE FROM articles').run();
    await database.prepare('DELETE FROM suggestions').run();
    await database.prepare('DELETE FROM audit_log').run();
    await database.prepare('DELETE FROM members').run();
  }, 20_000);

  it('publication d’un article visible côté public immédiatement', async () => {
    const database = await db();
    const now = new Date().toISOString();
    const articleId = 'art-test-1';

    await database.prepare(`
      INSERT INTO articles (id, slug, title, standfirst, body, category, nature, status, created_at, updated_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
    `).run(articleId, 'test-article', 'Article Test', 'Chapeau', JSON.stringify([]), 'Jeunesse', 'info', now, now, now);

    const publicArticles = await database.prepare(`
      SELECT id, title, slug, status FROM articles WHERE status = 'published' AND deleted_at IS NULL
    `).all<{ id: string; title: string; status: string }>();

    expect(publicArticles).toHaveLength(1);
    expect(publicArticles[0].id).toBe(articleId);
    expect(publicArticles[0].title).toBe('Article Test');
    expect(publicArticles[0].status).toBe('published');
  });

  it('cycle de vie d’une suggestion avec transition selon les seuils', () => {
    const settings: SuggestionSettings = {
      retainedVotes: 25,
      retainedShare: 65,
      archivedVotes: 25,
      archivedShare: 70,
      expiryDays: 60,
      retentionDays: 90,
    };

    const baseSuggestion: Suggestion = {
      id: 'sugg-1',
      text: 'Aménager un espace communautaire inter-départements.',
      category: 'Jeunesse',
      department: null,
      status: 'discussion',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      archivedAt: null,
      votesUseful: 0,
      votesNotUseful: 0,
      reportCount: 0,
      response: null,
      duplicateOf: null,
    };

    const now = Date.now();
    expect(evaluateStatus(baseSuggestion, settings, now).status).toBe('discussion');

    const retainedSugg = { ...baseSuggestion, votesUseful: 20, votesNotUseful: 5 };
    expect(evaluateStatus(retainedSugg, settings, now).status).toBe('retained');

    const archivedSugg = { ...baseSuggestion, votesUseful: 5, votesNotUseful: 20 };
    expect(evaluateStatus(archivedSugg, settings, now).status).toBe('archived');

    const pastDate = new Date(now - 61 * 24 * 60 * 60 * 1000).toISOString();
    const expiredSugg = { ...baseSuggestion, createdAt: pastDate, votesUseful: 5, votesNotUseful: 2 };
    expect(evaluateStatus(expiredSugg, settings, now).status).toBe('expired');
  });

  it('vote unique par appareil via empreinte HMAC et changement de vote autorisé', async () => {
    const database = await db();
    const suggestionId = 'sugg-vote-test';
    const deviceToken = 'random-device-token-12345';
    const voterHash = hashVoterToken(deviceToken);
    const now = new Date().toISOString();

    await database.prepare(`
      INSERT INTO suggestions (id, text, category, created_at, updated_at)
      VALUES (?, 'Suggestion pour le vote', 'Organisation', ?, ?)
    `).run(suggestionId, now, now);

    await database.prepare(`
      INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at)
      VALUES (?, ?, ?, 'useful', ?, ?)
    `).run('v-1', suggestionId, voterHash, now, now);

    const firstVote = await database
      .prepare('SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
      .get<{ value: string }>(suggestionId, voterHash);
    expect(firstVote?.value).toBe('useful');

    await database.prepare(`
      UPDATE suggestion_votes SET value = 'not_useful', updated_at = ?
      WHERE suggestion_id = ? AND voter_hash = ?
    `).run(now, suggestionId, voterHash);

    const changedVote = await database
      .prepare('SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
      .get<{ value: string }>(suggestionId, voterHash);
    expect(changedVote?.value).toBe('not_useful');

    await expect(
      database.prepare(`
        INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at)
        VALUES (?, ?, ?, 'useful', ?, ?)
      `).run('v-2', suggestionId, voterHash, now, now),
    ).rejects.toThrow();
  });

  it('refus d’une troisième suggestion en une heure (limitation de fréquence)', () => {
    const clientIdentifier = `test-client-${Date.now()}`;
    expect(checkRateLimit(clientIdentifier).allowed).toBe(true);
    expect(checkRateLimit(clientIdentifier).allowed).toBe(true);
    const third = checkRateLimit(clientIdentifier);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('absence d’adresse IP et de données personnelles dans la base et les journaux', async () => {
    const database = await db();
    const result = await database.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns
       where table_schema = 'public'
         and table_name in ('suggestions', 'suggestion_votes', 'reports', 'audit_log')`,
    );
    const forbidden = ['ip', 'ip_address', 'user_agent', 'email', 'phone'];
    for (const row of result) {
      expect(forbidden).not.toContain(row.column_name.toLowerCase());
    }
  });

  it('échec de l’accès au Studio sans session valide', () => {
    expect(getStudioSession(undefined)).toBeNull();
    expect(getStudioSession(null)).toBeNull();
    expect(getStudioSession('invalid-token')).toBeNull();

    const session = createStudioSession({ id: 'u1', username: 'admin', role: 'admin' });
    const verified = getStudioSession(session.token);
    expect(verified).not.toBeNull();
    expect(verified?.user.username).toBe('admin');
  });
});
