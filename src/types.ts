export type ArticleStatus = 'draft' | 'published' | 'archived';
export type ArticleNature = 'info' | 'analyse' | 'opinion';

export type ArticleBlock =
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'quote'; text: string; attribution?: string }
  | { id: string; type: 'list'; items: string[] }
  | { id: string; type: 'separator' }
  | {
      id: string;
      type: 'image';
      src: string;
      alt: string;
      caption: string;
      credit: string;
    };

export interface MediaImage {
  src: string;
  alt: string;
  caption: string;
  credit: string;
}

export interface ArticleRevision {
  id: string;
  savedAt: string;
  title: string;
  standfirst: string;
  body: ArticleBlock[];
  leadImage: MediaImage | null;
  sources: string[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  standfirst: string;
  body: ArticleBlock[];
  leadImage: MediaImage | null;
  category: string;
  department: string | null;
  nature: ArticleNature;
  status: ArticleStatus;
  featured: boolean;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  sources: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  revisions: ArticleRevision[];
}

export type SuggestionStatus =
  | 'pending'
  | 'discussion'
  | 'retained'
  | 'adapted'
  | 'integrated'
  | 'archived'
  | 'expired';

export type VoteValue = 'useful' | 'not_useful';

export interface SuggestionResponse {
  text: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  text: string;
  category: string;
  department: string | null;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  votesUseful: number;
  votesNotUseful: number;
  response: SuggestionResponse | null;
  reportCount: number;
  duplicateOf: string | null;
}

export interface SuggestionVote {
  suggestionId: string;
  voterHash: string;
  value: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionSettings {
  retainedVotes: number;
  retainedShare: number;
  archivedVotes: number;
  archivedShare: number;
  expiryDays: number;
  retentionDays: number;
}

export interface SuggestionReport {
  id: string;
  suggestionId: string;
  reason: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

export interface StudioUser {
  id: string;
  displayName: string;
  role: 'admin' | 'editor' | 'moderator';
}

export interface DatabaseShape {
  articles: Article[];
  suggestions: Suggestion[];
  votes: SuggestionVote[];
  reports: SuggestionReport[];
  settings: SuggestionSettings;
  audit: AuditEntry[];
}

export interface SuggestionInput {
  text: string;
  category: string;
  department: string | null;
}

export interface MemberRegistration {
  id?: string;
  text: string;
  category: string;
  department: string | null;
  status?: 'pending';
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
}
