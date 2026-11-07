import { describe, expect, it, beforeEach } from 'vitest';
import { getDatabase } from '../server/db';
import { checkRateLimit, createStudioSession, getStudioSession, hashVoterToken } from '../server/security';
import { evaluateStatus } from '../src/lib/suggestions';
import type { Suggestion, SuggestionSettings } from '../src/types';

describe('Cycle de vie serveur et intégrité', () => {
  beforeEach(() => {
    // Reset or prepare DB
    const db = getDatabase();
    db.exec(`
      DELETE FROM suggestions;
      DELETE FROM suggestion_votes;
      DELETE FROM articles;
      DELETE FROM article_revisions;
      DELETE FROM audit_log;
    `);
  });

  it('publication d’un article visible côté public immédiatement', () => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const articleId = 'art-test-1';

    // 1. Insert published article
    db.prepare(`
      INSERT INTO articles (id, slug, title, standfirst, body, category, nature, status, created_at, updated_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
    `).run(articleId, 'test-article', 'Article Test', 'Chapeau', JSON.stringify([]), 'Jeunesse', 'info', now, now, now);

    // 2. Query published articles (public query)
    const publicArticles = db.prepare(`
      SELECT id, title, slug, status FROM articles WHERE status = 'published' AND deleted_at IS NULL
    `).all() as Array<{ id: string; title: string; status: string }>;

    expect(publicArticles.length).toBe(1);
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
    // Before threshold
    expect(evaluateStatus(baseSuggestion, settings, now).status).toBe('discussion');

    // 20 useful, 5 not useful (total 25, 80% useful >= 65%) -> Retained
    const retainedSugg = { ...baseSuggestion, votesUseful: 20, votesNotUseful: 5 };
    expect(evaluateStatus(retainedSugg, settings, now).status).toBe('retained');

    // 5 useful, 20 not useful (total 25, 80% not useful >= 70%) -> Archived
    const archivedSugg = { ...baseSuggestion, votesUseful: 5, votesNotUseful: 20 };
    expect(evaluateStatus(archivedSugg, settings, now).status).toBe('archived');

    // 61 days old without reaching threshold -> Expired
    const pastDate = new Date(now - 61 * 24 * 60 * 60 * 1000).toISOString();
    const expiredSugg = { ...baseSuggestion, createdAt: pastDate, votesUseful: 5, votesNotUseful: 2 };
    expect(evaluateStatus(expiredSugg, settings, now).status).toBe('expired');
  });

  it('vote unique par appareil via empreinte HMAC et changement de vote autorisé', () => {
    const db = getDatabase();
    const suggestionId = 'sugg-vote-test';
    const deviceToken = 'random-device-token-12345';
    const voterHash = hashVoterToken(deviceToken);
    const now = new Date().toISOString();

    // Insert suggestion first to satisfy foreign key
    db.prepare(`
      INSERT INTO suggestions (id, text, category, created_at, updated_at)
      VALUES (?, 'Suggestion pour le vote', 'Organisation', ?, ?)
    `).run(suggestionId, now, now);

    // First vote: useful
    db.prepare(`
      INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at)
      VALUES (?, ?, ?, 'useful', ?, ?)
    `).run('v-1', suggestionId, voterHash, now, now);

    const firstVote = db.prepare('SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
      .get(suggestionId, voterHash) as { value: string };
    expect(firstVote.value).toBe('useful');

    // Change vote: switch to not_useful
    db.prepare(`
      UPDATE suggestion_votes SET value = 'not_useful', updated_at = ?
      WHERE suggestion_id = ? AND voter_hash = ?
    `).run(now, suggestionId, voterHash);

    const changedVote = db.prepare('SELECT value FROM suggestion_votes WHERE suggestion_id = ? AND voter_hash = ?')
      .get(suggestionId, voterHash) as { value: string };
    expect(changedVote.value).toBe('not_useful');

    // Verify uniqueness: attempting duplicate insert fails
    expect(() => {
      db.prepare(`
        INSERT INTO suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at)
        VALUES (?, ?, ?, 'useful', ?, ?)
      `).run('v-2', suggestionId, voterHash, now, now);
    }).toThrow();
  });

  it('refus d’une troisième suggestion en une heure (limitation de fréquence)', () => {
    const clientIdentifier = `test-client-${Date.now()}`;

    // 1st suggestion: allowed
    const first = checkRateLimit(clientIdentifier);
    expect(first.allowed).toBe(true);

    // 2nd suggestion: allowed
    const second = checkRateLimit(clientIdentifier);
    expect(second.allowed).toBe(true);

    // 3rd suggestion within 1 hour: rejected
    const third = checkRateLimit(clientIdentifier);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('absence d’adresse IP et de données personnelles dans la base et les journaux', () => {
    const db = getDatabase();
    
    // Check column info of suggestions table
    const suggCols = db.prepare("PRAGMA table_info(suggestions)").all() as Array<{ name: string }>;
    const suggColNames = suggCols.map((c) => c.name.toLowerCase());
    expect(suggColNames).not.toContain('ip');
    expect(suggColNames).not.toContain('user_agent');
    expect(suggColNames).not.toContain('email');
    expect(suggColNames).not.toContain('phone');

    // Check column info of suggestion_votes table
    const voteCols = db.prepare("PRAGMA table_info(suggestion_votes)").all() as Array<{ name: string }>;
    const voteColNames = voteCols.map((c) => c.name.toLowerCase());
    expect(voteColNames).not.toContain('ip');
    expect(voteColNames).not.toContain('user_agent');
    expect(voteColNames).not.toContain('email');
    expect(voteColNames).not.toContain('phone');

    // Check column info of audit_log
    const auditCols = db.prepare("PRAGMA table_info(audit_log)").all() as Array<{ name: string }>;
    const auditColNames = auditCols.map((c) => c.name.toLowerCase());
    expect(auditColNames).not.toContain('ip');
    expect(auditColNames).not.toContain('ip_address');
  });

  it('échec de l’accès au Studio sans session valide', () => {
    // 1. Without session token
    expect(getStudioSession(undefined)).toBeNull();
    expect(getStudioSession(null)).toBeNull();
    expect(getStudioSession('invalid-token')).toBeNull();

    // 2. With valid session
    const session = createStudioSession({ id: 'u1', username: 'admin', role: 'admin' });
    const verified = getStudioSession(session.token);
    expect(verified).not.toBeNull();
    expect(verified?.user.username).toBe('admin');
  });
});
