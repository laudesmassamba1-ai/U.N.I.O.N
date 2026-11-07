import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  EDITION_FORMAT,
  buildBackup,
  buildPublicEdition,
  mergeEdition,
  parseEditionDocument,
  serialiseEdition,
} from '../src/lib/edition';
import { articleFromDraft } from '../src/lib/store';
import { DEFAULT_SETTINGS } from '../src/lib/suggestions';
import type { Article, DatabaseShape, Suggestion } from '../src/types';

function article(overrides: Partial<Article> = {}): Article {
  return articleFromDraft({
    id: 'article-1',
    slug: 'article-1',
    title: 'Article de test',
    standfirst: 'Chapô de test.',
    body: [{ id: 'block-1', type: 'paragraph', text: 'Texte.' }],
    category: 'Institutions',
    status: 'published',
    publishedAt: '2026-01-05T10:00:00.000Z',
    weekNumber: 2,
    weekStart: '2026-01-05',
    weekEnd: '2026-01-11',
    revisions: [
      {
        id: 'revision-1',
        savedAt: '2026-01-05T09:00:00.000Z',
        title: 'Ancien titre',
        standfirst: '',
        body: [],
        leadImage: null,
        sources: [],
      },
    ],
    ...overrides,
  });
}

function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    id: 'suggestion-1',
    text: 'Créer une permanence administrative dans chaque chef-lieu.',
    category: 'Départements et services',
    department: 'Pool',
    status: 'discussion',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    publishedAt: '2026-01-02T10:00:00.000Z',
    archivedAt: null,
    votesUseful: 4,
    votesNotUseful: 1,
    response: null,
    reportCount: 0,
    duplicateOf: null,
    ...overrides,
  };
}

function database(overrides: Partial<DatabaseShape> = {}): DatabaseShape {
  return {
    articles: [article()],
    suggestions: [suggestion()],
    votes: [
      {
        suggestionId: 'suggestion-1',
        voterHash: 'hash',
        value: 'useful',
        createdAt: '2026-01-03T10:00:00.000Z',
        updatedAt: '2026-01-03T10:00:00.000Z',
      },
    ],
    reports: [
      {
        id: 'report-1',
        suggestionId: 'suggestion-1',
        reason: 'Test',
        createdAt: '2026-01-03T10:00:00.000Z',
      },
    ],
    settings: { ...DEFAULT_SETTINGS },
    audit: [
      {
        id: 'audit-1',
        at: '2026-01-03T10:00:00.000Z',
        actor: 'Fondateur',
        action: 'Test',
        target: 'Article',
      },
    ],
    ...overrides,
  };
}

describe('édition statique', () => {
  it('construit une édition publique sans brouillon ni vote local', () => {
    const source = database({
      articles: [article(), article({ id: 'article-2', slug: 'brouillon', status: 'draft' })],
      suggestions: [
        suggestion(),
        suggestion({ id: 'suggestion-2', status: 'pending' }),
        suggestion({ id: 'suggestion-3', status: 'archived' }),
      ],
    });
    const document = buildPublicEdition(source, 12);
    expect(document.format).toBe(EDITION_FORMAT);
    expect(document.revision).toBe(12);
    expect(document.articles.map((item) => item.id)).toEqual(['article-1']);
    expect(document.articles[0]?.revisions).toEqual([]);
    expect(document.suggestions.map((item) => item.id)).toEqual(['suggestion-1']);
    expect(document.votes).toEqual([]);
    expect(document.reports).toEqual([]);
    expect(document.audit).toEqual([]);
  });

  it('construit une sauvegarde complète', () => {
    const source = database();
    const document = buildBackup(source, 40);
    expect(document.format).toBe(BACKUP_FORMAT);
    expect(document.votes).toHaveLength(1);
    expect(document.reports).toHaveLength(1);
    expect(document.audit).toHaveLength(1);
    expect(document.articles[0]?.revisions).toHaveLength(1);
  });

  it('relit un fichier sérialisé', () => {
    const document = buildPublicEdition(database(), 8);
    const parsed = parseEditionDocument(JSON.parse(serialiseEdition(document)));
    expect(parsed.revision).toBe(8);
    expect(parsed.articles[0]?.title).toBe('Article de test');
    expect(parsed.settings.retainedVotes).toBe(DEFAULT_SETTINGS.retainedVotes);
  });

  it('refuse un format inconnu', () => {
    expect(() => parseEditionDocument({ format: 'autre', version: 1 })).toThrow(
      /Format inconnu/,
    );
  });

  it('refuse un article sans identifiant', () => {
    const document = buildPublicEdition(database(), 2);
    const raw = JSON.parse(serialiseEdition(document)) as Record<string, unknown>;
    raw.articles = [{ title: 'Sans identifiant' }];
    expect(() => parseEditionDocument(raw)).toThrow(/id/);
  });

  it('applique une édition publique en gardant les suggestions en attente et les votes locaux', () => {
    const current = database({
      suggestions: [
        suggestion(),
        suggestion({ id: 'local-pending', status: 'pending' }),
      ],
    });
    const edition = buildPublicEdition(
      database({
        suggestions: [suggestion({ text: 'Texte publié à jour.' })],
      }),
      15,
    );
    const merged = mergeEdition(current, edition);
    expect(merged.suggestions.map((item) => item.id)).toEqual([
      'local-pending',
      'suggestion-1',
    ]);
    expect(merged.suggestions[1]?.text).toBe('Texte publié à jour.');
    expect(merged.votes).toHaveLength(1);
    expect(merged.reports).toHaveLength(1);
  });

  it('applique une sauvegarde complète en remplaçant tout', () => {
    const current = database({ suggestions: [] });
    const backup = buildBackup(database({ audit: [] }), 20);
    const merged = mergeEdition(current, backup);
    expect(merged.suggestions).toHaveLength(1);
    expect(merged.votes).toHaveLength(1);
    expect(merged.audit).toEqual([]);
  });
});
