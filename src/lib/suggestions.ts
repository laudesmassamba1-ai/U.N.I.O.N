import type { SuggestionSettings } from '../types';

export const DEFAULT_SETTINGS: SuggestionSettings = {
  retainedVotes: 25,
  retainedShare: 65,
  archivedVotes: 25,
  archivedShare: 70,
  expiryDays: 60,
  retentionDays: 90,
};

export const VOTE_WINDOW_MS = 60 * 60 * 1000;
export const VOTE_LIMIT = 2;
export const SUGGESTION_MIN = 20;
export const SUGGESTION_MAX = 600;

export function canSubmit(
  attempts: number[],
  now: number,
  limit = VOTE_LIMIT,
  windowMs = VOTE_WINDOW_MS,
): boolean {
  const recent = attempts.filter((time) => now - time < windowMs);
  return recent.length < limit;
}

export function recordAttempt(attempts: number[], now: number): number[] {
  return [...attempts.filter((time) => now - time < VOTE_WINDOW_MS), now];
}

export function votePercent(useful: number, notUseful: number): number {
  const total = useful + notUseful;
  if (total === 0) return 0;
  return Math.round((useful / total) * 100);
}

export function evaluateStatus(
  suggestion: {
    status: string;
    createdAt: string;
    votesUseful: number;
    votesNotUseful: number;
    archivedAt: string | null;
  },
  settings: SuggestionSettings,
  now: number,
): { status: string; archivedAt: string | null } {
  if (
    ['pending', 'adapted', 'integrated', 'archived', 'expired'].includes(suggestion.status)
  ) {
    return { status: suggestion.status, archivedAt: suggestion.archivedAt };
  }
  const total = suggestion.votesUseful + suggestion.votesNotUseful;
  const usefulShare = total > 0 ? (suggestion.votesUseful / total) * 100 : 0;
  const notUsefulShare = total > 0 ? (suggestion.votesNotUseful / total) * 100 : 0;

  if (total >= settings.archivedVotes && notUsefulShare >= settings.archivedShare) {
    return {
      status: 'archived',
      archivedAt: suggestion.archivedAt ?? new Date(now).toISOString(),
    };
  }
  if (total >= settings.retainedVotes && usefulShare >= settings.retainedShare) {
    return { status: 'retained', archivedAt: suggestion.archivedAt };
  }
  const age = now - new Date(suggestion.createdAt).getTime();
  if (age > settings.expiryDays * 24 * 60 * 60 * 1000) {
    return { status: 'expired', archivedAt: suggestion.archivedAt };
  }
  return { status: 'discussion', archivedAt: suggestion.archivedAt };
}

export function toggleVote(
  current: 'useful' | 'not_useful' | null,
  next: 'useful' | 'not_useful',
  counts: { useful: number; notUseful: number },
): {
  vote: 'useful' | 'not_useful' | null;
  useful: number;
  notUseful: number;
} {
  let { useful, notUseful } = counts;
  if (current === next) {
    if (next === 'useful') useful = Math.max(0, useful - 1);
    else notUseful = Math.max(0, notUseful - 1);
    return { vote: null, useful, notUseful };
  }
  if (current === 'useful') useful = Math.max(0, useful - 1);
  if (current === 'not_useful') notUseful = Math.max(0, notUseful - 1);
  if (next === 'useful') useful += 1;
  else notUseful += 1;
  return { vote: next, useful, notUseful };
}

export function statusTone(status: string): 'neutral' | 'attention' | 'validated' | 'closed' {
  switch (status) {
    case 'retained':
    case 'adapted':
    case 'integrated':
      return 'validated';
    case 'discussion':
    case 'pending':
      return 'attention';
    case 'archived':
    case 'expired':
      return 'closed';
    default:
      return 'neutral';
  }
}
