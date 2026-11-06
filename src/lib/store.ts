import type {
  Article,
  ArticleBlock,
  ArticleRevision,
  AuditEntry,
  DatabaseShape,
  Suggestion,
  SuggestionInput,
  SuggestionReport,
  SuggestionSettings,
  SuggestionVote,
  VoteValue,
} from '../types';
import { createId } from './id';
import { nowIso } from './dates';
import { DEFAULT_SETTINGS, evaluateStatus, toggleVote } from './suggestions';

const STORAGE_KEY = 'union.db.v1';
const SETTINGS_KEY = 'union.settings.v1';
const VOTER_TOKEN_KEY = 'union.voter.token.v1';
const ATTEMPTS_KEY = 'union.suggestion.attempts.v1';
const STUDIO_SESSION_KEY = 'union.studio.session.v1';

export function emptyDatabase(): DatabaseShape {
  return {
    articles: [],
    suggestions: [],
    votes: [],
    reports: [],
    settings: { ...DEFAULT_SETTINGS },
    audit: [],
  };
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normaliseDatabase(raw: Partial<DatabaseShape> | null): DatabaseShape {
  if (!raw) return emptyDatabase();
  return {
    articles: Array.isArray(raw.articles) ? raw.articles : [],
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    votes: Array.isArray(raw.votes) ? raw.votes : [],
    reports: Array.isArray(raw.reports) ? raw.reports : [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
    audit: Array.isArray(raw.audit) ? raw.audit : [],
  };
}

function readDatabase(): DatabaseShape {
  if (typeof window === 'undefined') return emptyDatabase();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse<Partial<DatabaseShape> | null>(stored, null);
    return normaliseDatabase(parsed);
  } catch {
    return emptyDatabase();
  }
}

let snapshot: DatabaseShape = readDatabase();
const listeners = new Set<() => void>();
let storageBound = false;

function emit(): void {
  listeners.forEach((listener) => listener());
}

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota exceeded: the in-memory state remains usable for the session.
  }
}

function bindStorage(): void {
  if (storageBound || typeof window === 'undefined') return;
  storageBound = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readDatabase();
    emit();
  });
}

export const dbStore = {
  subscribe(listener: () => void): () => void {
    bindStorage();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): DatabaseShape {
    bindStorage();
    return snapshot;
  },
  update(mutator: (current: DatabaseShape) => DatabaseShape): void {
    snapshot = mutator(snapshot);
    persist();
    emit();
  },
  replace(next: DatabaseShape): void {
    snapshot = normaliseDatabase(next);
    persist();
    emit();
  },
  reset(): void {
    snapshot = emptyDatabase();
    persist();
    emit();
  },
};

export function appendAudit(
  database: DatabaseShape,
  action: string,
  target: string,
  actor = 'Fondateur',
): DatabaseShape {
  const entry: AuditEntry = {
    id: createId('audit'),
    at: nowIso(),
    actor,
    action,
    target,
  };
  return { ...database, audit: [entry, ...database.audit].slice(0, 300) };
}

export function getSettings(): SuggestionSettings {
  const fromDb = snapshot.settings;
  if (typeof window === 'undefined') return fromDb;
  try {
    const stored = safeParse<Partial<SuggestionSettings> | null>(
      window.localStorage.getItem(SETTINGS_KEY),
      null,
    );
    return { ...fromDb, ...(stored ?? {}) };
  } catch {
    return fromDb;
  }
}

export function saveSettings(settings: SuggestionSettings): void {
  dbStore.update((current) => appendAudit({ ...current, settings }, 'Réglages des seuils', 'Boîte à suggestions'));
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failure.
  }
}

export function getVoterToken(): string {
  if (typeof window === 'undefined') return 'server-token';
  try {
    const existing = window.localStorage.getItem(VOTER_TOKEN_KEY);
    if (existing) return existing;
    const token =
      globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VOTER_TOKEN_KEY, token);
    return token;
  } catch {
    return 'ephemeral-token';
  }
}

export function readSuggestionAttempts(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = safeParse<number[]>(window.localStorage.getItem(ATTEMPTS_KEY), []);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'number') : [];
  } catch {
    return [];
  }
}

export function writeSuggestionAttempts(attempts: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore storage failure.
  }
}

export function getStudioSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STUDIO_SESSION_KEY) === 'open';
  } catch {
    return false;
  }
}

export function setStudioSession(open: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (open) window.sessionStorage.setItem(STUDIO_SESSION_KEY, 'open');
    else window.sessionStorage.removeItem(STUDIO_SESSION_KEY);
  } catch {
    // Ignore storage failure.
  }
}

export function articleFromDraft(partial?: Partial<Article>): Article {
  const timestamp = nowIso();
  return {
    id: createId('article'),
    slug: '',
    title: '',
    standfirst: '',
    body: [],
    leadImage: null,
    category: '',
    department: null,
    nature: 'info',
    status: 'draft',
    featured: false,
    weekNumber: 0,
    weekStart: '',
    weekEnd: '',
    sources: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: null,
    archivedAt: null,
    deletedAt: null,
    revisions: [],
    ...partial,
  };
}

export function makeRevision(article: Article): ArticleRevision {
  return {
    id: createId('revision'),
    savedAt: nowIso(),
    title: article.title,
    standfirst: article.standfirst,
    body: article.body.map((block) => ({ ...block })),
    leadImage: article.leadImage ? { ...article.leadImage } : null,
    sources: [...article.sources],
  };
}

export function upsertArticle(
  database: DatabaseShape,
  article: Article,
  action = 'Article sauvegardé',
  options: { revision?: boolean } = {},
): DatabaseShape {
  const existingIndex = database.articles.findIndex((item) => item.id === article.id);
  const previous = existingIndex >= 0 ? database.articles[existingIndex] : null;
  const shouldRevise = options.revision !== false;
  const withRevision: Article = {
    ...article,
    updatedAt: nowIso(),
    revisions:
      previous && shouldRevise
        ? [makeRevision(previous), ...article.revisions].slice(0, 20)
        : article.revisions,
  };
  const articles =
    existingIndex >= 0
      ? database.articles.map((item) => (item.id === article.id ? withRevision : item))
      : [withRevision, ...database.articles];
  return appendAudit({ ...database, articles }, action, article.title || article.id);
}

export function saveDraft(database: DatabaseShape, article: Article): DatabaseShape {
  return upsertArticle(database, article, 'Brouillon sauvegardé', { revision: false });
}

export function publishArticle(database: DatabaseShape, article: Article): DatabaseShape {
  const timestamp = nowIso();
  const published: Article = {
    ...article,
    status: 'published',
    publishedAt: article.publishedAt ?? timestamp,
    archivedAt: null,
    deletedAt: null,
    updatedAt: timestamp,
  };
  let next = upsertArticle(database, published, 'Article publié');
  if (published.featured && published.weekStart) {
    next = {
      ...next,
      articles: next.articles.map((item) =>
        item.id !== published.id &&
        item.weekStart === published.weekStart &&
        item.status === 'published'
          ? { ...item, featured: false }
          : item,
      ),
    };
  }
  return next;
}

export function unpublishArticle(database: DatabaseShape, article: Article): DatabaseShape {
  return upsertArticle(
    database,
    { ...article, status: 'draft', updatedAt: nowIso() },
    'Article dépublié',
  );
}

export function archiveArticle(database: DatabaseShape, article: Article): DatabaseShape {
  return upsertArticle(
    database,
    { ...article, status: 'archived', archivedAt: nowIso(), updatedAt: nowIso() },
    'Article archivé',
  );
}

export function softDeleteArticle(database: DatabaseShape, article: Article): DatabaseShape {
  return upsertArticle(
    database,
    {
      ...article,
      status: 'archived',
      deletedAt: nowIso(),
      archivedAt: article.archivedAt ?? nowIso(),
      updatedAt: nowIso(),
    },
    'Article supprimé',
  );
}

export function restoreArticle(database: DatabaseShape, article: Article): DatabaseShape {
  return upsertArticle(
    database,
    { ...article, status: 'draft', deletedAt: null, archivedAt: null, updatedAt: nowIso() },
    'Article restauré',
  );
}

export function createSuggestion(
  database: DatabaseShape,
  input: SuggestionInput,
): { database: DatabaseShape; suggestion: Suggestion } {
  const timestamp = nowIso();
  const suggestion: Suggestion = {
    id: createId('suggestion'),
    text: input.text.trim(),
    category: input.category,
    department: input.department,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: null,
    archivedAt: null,
    votesUseful: 0,
    votesNotUseful: 0,
    response: null,
    reportCount: 0,
    duplicateOf: null,
  };
  return {
    database: appendAudit(
      { ...database, suggestions: [suggestion, ...database.suggestions] },
      'Suggestion reçue',
      suggestion.id,
    ),
    suggestion,
  };
}

export function approveSuggestion(database: DatabaseShape, id: string): DatabaseShape {
  const timestamp = nowIso();
  return appendAudit(
    {
      ...database,
      suggestions: database.suggestions.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'discussion',
              publishedAt: item.publishedAt ?? timestamp,
              updatedAt: timestamp,
            }
          : item,
      ),
    },
    'Suggestion publiée',
    id,
  );
}

export function setSuggestionStatus(
  database: DatabaseShape,
  id: string,
  status: Suggestion['status'],
  action: string,
): DatabaseShape {
  const timestamp = nowIso();
  return appendAudit(
    {
      ...database,
      suggestions: database.suggestions.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              archivedAt:
                status === 'archived' ? item.archivedAt ?? timestamp : item.archivedAt,
              updatedAt: timestamp,
            }
          : item,
      ),
    },
    action,
    id,
  );
}

export function respondToSuggestion(
  database: DatabaseShape,
  id: string,
  text: string,
): DatabaseShape {
  const timestamp = nowIso();
  return appendAudit(
    {
      ...database,
      suggestions: database.suggestions.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'adapted',
              response: { text: text.trim(), createdAt: timestamp },
              updatedAt: timestamp,
            }
          : item,
      ),
    },
    'Réponse du bureau publiée',
    id,
  );
}

export function mergeSuggestion(
  database: DatabaseShape,
  sourceId: string,
  targetId: string,
): DatabaseShape {
  const source = database.suggestions.find((item) => item.id === sourceId);
  if (!source) return database;
  const timestamp = nowIso();
  return appendAudit(
    {
      ...database,
      suggestions: database.suggestions.map((item) => {
        if (item.id === sourceId) {
          return {
            ...item,
            status: 'archived',
            archivedAt: timestamp,
            duplicateOf: targetId,
            updatedAt: timestamp,
          };
        }
        if (item.id === targetId) {
          return {
            ...item,
            votesUseful: item.votesUseful + source.votesUseful,
            votesNotUseful: item.votesNotUseful + source.votesNotUseful,
            updatedAt: timestamp,
          };
        }
        return item;
      }),
    },
    'Doublon fusionné',
    `${sourceId} vers ${targetId}`,
  );
}

export function applyVote(
  database: DatabaseShape,
  suggestionId: string,
  voterHash: string,
  value: VoteValue,
): DatabaseShape {
  const suggestion = database.suggestions.find((item) => item.id === suggestionId);
  if (!suggestion) return database;
  const existing = database.votes.find(
    (vote) => vote.suggestionId === suggestionId && vote.voterHash === voterHash,
  );
  const result = toggleVote(existing?.value ?? null, value, {
    useful: suggestion.votesUseful,
    notUseful: suggestion.votesNotUseful,
  });
  const timestamp = nowIso();
  const votes = existing
    ? result.vote
      ? database.votes.map((vote) =>
          vote.suggestionId === suggestionId && vote.voterHash === voterHash
            ? { ...vote, value: result.vote as VoteValue, updatedAt: timestamp }
            : vote,
        )
      : database.votes.filter(
          (vote) => !(vote.suggestionId === suggestionId && vote.voterHash === voterHash),
        )
    : result.vote
      ? [
          ...database.votes,
          {
            suggestionId,
            voterHash,
            value: result.vote as VoteValue,
            createdAt: timestamp,
            updatedAt: timestamp,
          } satisfies SuggestionVote,
        ]
      : database.votes;
  return {
    ...database,
    votes,
    suggestions: database.suggestions.map((item) =>
      item.id === suggestionId
        ? {
            ...item,
            votesUseful: result.useful,
            votesNotUseful: result.notUseful,
            updatedAt: timestamp,
          }
        : item,
    ),
  };
}

export function addReport(
  database: DatabaseShape,
  suggestionId: string,
  reason: string,
): DatabaseShape {
  const report: SuggestionReport = {
    id: createId('report'),
    suggestionId,
    reason: reason.slice(0, 200),
    createdAt: nowIso(),
  };
  return appendAudit(
    {
      ...database,
      reports: [report, ...database.reports],
      suggestions: database.suggestions.map((item) =>
        item.id === suggestionId
          ? { ...item, reportCount: item.reportCount + 1 }
          : item,
      ),
    },
    'Suggestion signalée',
    suggestionId,
  );
}

export function refreshSuggestionStatuses(
  database: DatabaseShape,
  now = Date.now(),
): DatabaseShape {
  const settings = getSettings();
  let changed = false;
  const suggestions = database.suggestions.map((suggestion) => {
    const evaluated = evaluateStatus(suggestion, settings, now);
    if (evaluated.status !== suggestion.status) changed = true;
    return {
      ...suggestion,
      status: evaluated.status as Suggestion['status'],
      archivedAt: evaluated.archivedAt,
    };
  });
  const retentionMs = settings.retentionDays * 24 * 60 * 60 * 1000;
  const retained = suggestions.filter((suggestion) => {
    if (suggestion.status !== 'archived') return true;
    if (!suggestion.archivedAt) return true;
    return now - new Date(suggestion.archivedAt).getTime() < retentionMs;
  });
  if (retained.length !== suggestions.length) changed = true;
  if (!changed) return database;
  return appendAudit(
    { ...database, suggestions: retained },
    'Seuils et conservation appliqués',
    'Boîte à suggestions',
  );
}

export function diagnoseDatabase(database: DatabaseShape): string[] {
  const issues: string[] = [];
  const forbidden = ['ip', 'userAgent', 'user_agent', 'email', 'phone', 'telephone'];
  database.suggestions.forEach((suggestion) => {
    forbidden.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(suggestion, key)) {
        issues.push(`Champ identifiant présent sur une suggestion : ${key}`);
      }
    });
  });
  database.votes.forEach((vote) => {
    forbidden.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(vote, key)) {
        issues.push(`Champ identifiant présent sur un vote : ${key}`);
      }
    });
  });
  return issues;
}

export function countByStatus(database: DatabaseShape): Record<string, number> {
  return database.suggestions.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function blockText(block: ArticleBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
      return block.text;
    case 'list':
      return block.items.join(' ');
    case 'image':
      return `${block.alt} ${block.caption} ${block.credit}`;
    case 'separator':
      return '';
    default:
      return '';
  }
}
