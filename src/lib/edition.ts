import type {
  Article,
  ArticleBlock,
  ArticleRevision,
  AuditEntry,
  DatabaseShape,
  MediaImage,
  Suggestion,
  SuggestionReport,
  SuggestionSettings,
  SuggestionVote,
} from '../types';
import { DEFAULT_SETTINGS } from './suggestions';
import { nowIso } from './dates';

export const EDITION_FORMAT = 'union-edition';
export const BACKUP_FORMAT = 'union-backup';
export const EDITION_VERSION = 1;
export const EDITION_PATH = 'data/edition.json';

const EDITION_REVISION_KEY = 'union.edition.revision.v1';

export type EditionFormat = typeof EDITION_FORMAT | typeof BACKUP_FORMAT;

export interface EditionDocument extends DatabaseShape {
  format: EditionFormat;
  version: typeof EDITION_VERSION;
  revision: number;
  updatedAt: string;
}

export class EditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditionError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function requiredText(value: unknown, field: string, index: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EditionError(`Champ « ${field} » manquant (élément ${index + 1}).`);
  }
  return value;
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function imageValue(value: unknown, index: number): MediaImage | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) throw new EditionError(`Image invalide (élément ${index + 1}).`);
  return {
    src: requiredText(value.src, 'image.src', index),
    alt: text(value.alt),
    caption: text(value.caption),
    credit: text(value.credit),
  };
}

function blockValue(value: unknown, index: number): ArticleBlock {
  if (!isRecord(value)) throw new EditionError(`Bloc invalide (élément ${index + 1}).`);
  const id = text(value.id, `block-${index + 1}`);
  const type = text(value.type);
  switch (type) {
    case 'paragraph':
    case 'heading':
      return { id, type, text: text(value.text) };
    case 'quote':
      return { id, type, text: text(value.text), attribution: text(value.attribution) };
    case 'list':
      return { id, type, items: stringList(value.items) };
    case 'separator':
      return { id, type };
    case 'image':
      return {
        id,
        type,
        src: text(value.src),
        alt: text(value.alt),
        caption: text(value.caption),
        credit: text(value.credit),
      };
    default:
      throw new EditionError(`Type de bloc inconnu : « ${type || 'vide'} ».`);
  }
}

function revisionValue(value: unknown, index: number): ArticleRevision {
  if (!isRecord(value)) throw new EditionError(`Version invalide (élément ${index + 1}).`);
  return {
    id: text(value.id, `revision-${index + 1}`),
    savedAt: text(value.savedAt, nowIso()),
    title: text(value.title),
    standfirst: text(value.standfirst),
    body: Array.isArray(value.body) ? value.body.map(blockValue) : [],
    leadImage: imageValue(value.leadImage, index),
    sources: stringList(value.sources),
  };
}

function articleValue(value: unknown, index: number): Article {
  if (!isRecord(value)) throw new EditionError(`Article invalide (élément ${index + 1}).`);
  const nature = text(value.nature, 'info');
  const status = text(value.status, 'draft');
  return {
    id: requiredText(value.id, 'id', index),
    slug: text(value.slug),
    title: text(value.title),
    standfirst: text(value.standfirst),
    body: Array.isArray(value.body) ? value.body.map(blockValue) : [],
    leadImage: imageValue(value.leadImage, index),
    category: text(value.category),
    department: nullableText(value.department),
    nature: nature === 'analyse' || nature === 'opinion' ? nature : 'info',
    status: status === 'published' || status === 'archived' ? status : 'draft',
    featured: booleanValue(value.featured),
    weekNumber: numberValue(value.weekNumber, 0),
    weekStart: text(value.weekStart),
    weekEnd: text(value.weekEnd),
    sources: stringList(value.sources),
    createdAt: text(value.createdAt, nowIso()),
    updatedAt: text(value.updatedAt, nowIso()),
    publishedAt: nullableText(value.publishedAt),
    archivedAt: nullableText(value.archivedAt),
    deletedAt: nullableText(value.deletedAt),
    revisions: Array.isArray(value.revisions) ? value.revisions.map(revisionValue) : [],
  };
}

function suggestionStatus(value: unknown): Suggestion['status'] {
  const status = text(value, 'pending');
  return [
    'pending',
    'discussion',
    'retained',
    'adapted',
    'integrated',
    'archived',
    'expired',
  ].includes(status)
    ? (status as Suggestion['status'])
    : 'pending';
}

function suggestionValue(value: unknown, index: number): Suggestion {
  if (!isRecord(value)) throw new EditionError(`Suggestion invalide (élément ${index + 1}).`);
  const response = isRecord(value.response)
    ? { text: text(value.response.text), createdAt: text(value.response.createdAt, nowIso()) }
    : null;
  return {
    id: requiredText(value.id, 'id', index),
    text: requiredText(value.text, 'text', index),
    category: text(value.category),
    department: nullableText(value.department),
    status: suggestionStatus(value.status),
    createdAt: text(value.createdAt, nowIso()),
    updatedAt: text(value.updatedAt, nowIso()),
    publishedAt: nullableText(value.publishedAt),
    archivedAt: nullableText(value.archivedAt),
    votesUseful: Math.max(0, Math.floor(numberValue(value.votesUseful, 0))),
    votesNotUseful: Math.max(0, Math.floor(numberValue(value.votesNotUseful, 0))),
    response,
    reportCount: Math.max(0, Math.floor(numberValue(value.reportCount, 0))),
    duplicateOf: nullableText(value.duplicateOf),
  };
}

function voteValue(value: unknown, index: number): SuggestionVote {
  if (!isRecord(value)) throw new EditionError(`Vote invalide (élément ${index + 1}).`);
  const vote = text(value.value);
  if (vote !== 'useful' && vote !== 'not_useful') {
    throw new EditionError(`Valeur de vote invalide (élément ${index + 1}).`);
  }
  return {
    suggestionId: requiredText(value.suggestionId, 'suggestionId', index),
    voterHash: text(value.voterHash),
    value: vote,
    createdAt: text(value.createdAt, nowIso()),
    updatedAt: text(value.updatedAt, nowIso()),
  };
}

function reportValue(value: unknown, index: number): SuggestionReport {
  if (!isRecord(value)) throw new EditionError(`Signalement invalide (élément ${index + 1}).`);
  return {
    id: text(value.id, `report-${index + 1}`),
    suggestionId: requiredText(value.suggestionId, 'suggestionId', index),
    reason: text(value.reason),
    createdAt: text(value.createdAt, nowIso()),
  };
}

function auditValue(value: unknown, index: number): AuditEntry {
  if (!isRecord(value)) throw new EditionError(`Entrée d’audit invalide (élément ${index + 1}).`);
  return {
    id: text(value.id, `audit-${index + 1}`),
    at: text(value.at, nowIso()),
    actor: text(value.actor),
    action: text(value.action),
    target: text(value.target),
  };
}

function settingsValue(value: unknown): SuggestionSettings {
  const raw = isRecord(value) ? value : {};
  const share = (input: unknown, fallback: number) =>
    Math.min(100, Math.max(1, numberValue(input, fallback)));
  return {
    retainedVotes: Math.max(1, numberValue(raw.retainedVotes, DEFAULT_SETTINGS.retainedVotes)),
    retainedShare: share(raw.retainedShare, DEFAULT_SETTINGS.retainedShare),
    archivedVotes: Math.max(1, numberValue(raw.archivedVotes, DEFAULT_SETTINGS.archivedVotes)),
    archivedShare: share(raw.archivedShare, DEFAULT_SETTINGS.archivedShare),
    expiryDays: Math.max(1, numberValue(raw.expiryDays, DEFAULT_SETTINGS.expiryDays)),
    retentionDays: Math.max(1, numberValue(raw.retentionDays, DEFAULT_SETTINGS.retentionDays)),
  };
}

export function parseEditionDocument(raw: unknown): EditionDocument {
  if (!isRecord(raw)) throw new EditionError('Le fichier ne contient pas un objet JSON.');
  const format = text(raw.format);
  if (format !== EDITION_FORMAT && format !== BACKUP_FORMAT) {
    throw new EditionError('Format inconnu. Attendu : union-edition ou union-backup.');
  }
  if (numberValue(raw.version, 0) !== EDITION_VERSION) {
    throw new EditionError(`Version non prise en charge. Attendu : ${EDITION_VERSION}.`);
  }
  const revision = numberValue(raw.revision, 0);
  if (revision < 0) throw new EditionError('La révision doit être positive.');
  const articles = Array.isArray(raw.articles) ? raw.articles.map(articleValue) : [];
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.map(suggestionValue)
    : [];
  return {
    format,
    version: EDITION_VERSION,
    revision,
    updatedAt: text(raw.updatedAt, nowIso()),
    articles,
    suggestions,
    votes: Array.isArray(raw.votes) ? raw.votes.map(voteValue) : [],
    reports: Array.isArray(raw.reports) ? raw.reports.map(reportValue) : [],
    settings: settingsValue(raw.settings),
    audit: Array.isArray(raw.audit) ? raw.audit.map(auditValue) : [],
  };
}

function publicArticle(article: Article): Article {
  return { ...article, revisions: [] };
}

export function buildPublicEdition(
  database: DatabaseShape,
  revision = Date.now(),
): EditionDocument {
  const publicStatuses: Suggestion['status'][] = [
    'discussion',
    'retained',
    'adapted',
    'integrated',
    'expired',
  ];
  return {
    format: EDITION_FORMAT,
    version: EDITION_VERSION,
    revision,
    updatedAt: nowIso(),
    articles: database.articles
      .filter((article) => article.status === 'published' && !article.deletedAt)
      .map(publicArticle),
    suggestions: database.suggestions
      .filter((suggestion) => publicStatuses.includes(suggestion.status))
      .map((suggestion) => ({ ...suggestion })),
    votes: [],
    reports: [],
    settings: { ...database.settings },
    audit: [],
  };
}

export function buildBackup(database: DatabaseShape, revision = Date.now()): EditionDocument {
  return {
    format: BACKUP_FORMAT,
    version: EDITION_VERSION,
    revision,
    updatedAt: nowIso(),
    articles: database.articles.map((article) => ({
      ...article,
      body: article.body.map((block) => ({ ...block })),
      leadImage: article.leadImage ? { ...article.leadImage } : null,
      sources: [...article.sources],
      revisions: article.revisions.map((revisionItem) => ({
        ...revisionItem,
        body: revisionItem.body.map((block) => ({ ...block })),
        leadImage: revisionItem.leadImage ? { ...revisionItem.leadImage } : null,
        sources: [...revisionItem.sources],
      })),
    })),
    suggestions: database.suggestions.map((suggestion) => ({
      ...suggestion,
      response: suggestion.response ? { ...suggestion.response } : null,
    })),
    votes: database.votes.map((vote) => ({ ...vote })),
    reports: database.reports.map((report) => ({ ...report })),
    settings: { ...database.settings },
    audit: database.audit.map((entry) => ({ ...entry })),
  };
}

export function mergeEdition(current: DatabaseShape, document: EditionDocument): DatabaseShape {
  if (document.format === BACKUP_FORMAT) {
    return {
      articles: document.articles,
      suggestions: document.suggestions,
      votes: document.votes,
      reports: document.reports,
      settings: document.settings,
      audit: document.audit,
    };
  }
  const editionIds = new Set(document.suggestions.map((suggestion) => suggestion.id));
  const localPending = current.suggestions.filter(
    (suggestion) => suggestion.status === 'pending' && !editionIds.has(suggestion.id),
  );
  return {
    articles: document.articles,
    suggestions: [...localPending, ...document.suggestions],
    votes: [],
    reports: [],
    settings: document.settings,
    audit: current.audit,
  };
}

export function editionFileName(format: EditionFormat): string {
  return format === BACKUP_FORMAT ? 'union-sauvegarde.json' : 'edition.json';
}

export function serialiseEdition(document: EditionDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function downloadEdition(document: EditionDocument): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([serialiseEdition(document)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = editionFileName(document.format);
  link.click();
  URL.revokeObjectURL(url);
}

export async function readEditionFile(file: File): Promise<EditionDocument> {
  const content = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new EditionError('Le fichier n’est pas un JSON valide.');
  }
  return parseEditionDocument(parsed);
}

export function editionUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base.endsWith('/') ? base : `${base}/`}${EDITION_PATH}`;
}

export async function fetchRemoteEdition(): Promise<EditionDocument | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  const response = await fetch(editionUrl(), { cache: 'no-cache' });
  if (!response.ok) return null;
  const raw = (await response.json()) as unknown;
  return parseEditionDocument(raw);
}

export function getAppliedEditionRevision(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = window.localStorage.getItem(EDITION_REVISION_KEY);
    if (!stored) return 0;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function setAppliedEditionRevision(revision: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EDITION_REVISION_KEY, String(revision));
  } catch {
    // Ignore storage failure.
  }
}
