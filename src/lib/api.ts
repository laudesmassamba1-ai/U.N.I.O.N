import type { Article, AuditEntry, Suggestion, SuggestionSettings } from '../types';
import type { EditionDocument } from './edition';

export interface RoadmapStep {
  id: string;
  stepOrder: number;
  title: string;
  status: 'fait' | 'en_cours' | 'a_venir';
  description?: string;
  updatedAt: string;
}

export interface StudioUser {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'moderator';
}

const API_BASE = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    let errMessage = `Erreur HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json.error) errMessage = json.error;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  async getEdition(): Promise<EditionDocument & { roadmap: RoadmapStep[] }> {
    try {
      return await request('/edition');
    } catch {
      const fallbackUrl = `${import.meta.env.BASE_URL}data/edition.json`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        return fallbackRes.json();
      }
      throw new Error('Impossible de charger l’édition.');
    }
  },

  async submitSuggestion(input: {
    text: string;
    category: string;
    department?: string | null;
    proof?: string;
  }): Promise<{ id: string; status: string; message: string }> {
    return request('/suggestions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async submitVote(
    suggestionId: string,
    value: 'useful' | 'not_useful',
    token: string,
  ): Promise<{
    ok: boolean;
    suggestionId: string;
    myVote: 'useful' | 'not_useful' | null;
    status: Suggestion['status'];
    votesUseful: number;
    votesNotUseful: number;
  }> {
    return request('/votes', {
      method: 'POST',
      body: JSON.stringify({ suggestionId, value, token }),
    });
  },

  async submitReport(suggestionId: string, reason: string): Promise<{ ok: boolean; reportId: string }> {
    return request('/reports', {
      method: 'POST',
      body: JSON.stringify({ suggestionId, reason }),
    });
  },

  async requestMemberCard(input: {
    fullName: string;
    email: string;
    department?: string | null;
    consent: boolean;
  }): Promise<{
    ok: true;
    cardSent: boolean;
    memberNumber: string;
    message?: string;
  }> {
    return request('/members', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getRoadmap(): Promise<{ steps: RoadmapStep[] }> {
    try {
      return await request('/roadmap');
    } catch {
      return { steps: [] };
    }
  },

  async studioLogin(code: string): Promise<{ ok: boolean; user: StudioUser }> {
    return request('/studio/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async studioLogout(): Promise<{ ok: boolean }> {
    return request('/studio/logout', { method: 'POST' });
  },

  async studioGetMe(): Promise<{ user: StudioUser }> {
    return request('/studio/me');
  },

  async studioGetSuggestions(): Promise<{ suggestions: Suggestion[] }> {
    return request('/studio/suggestions');
  },

  async studioModerateSuggestion(
    id: string,
    action: 'approve' | 'archive' | 'status' | 'merge' | 'response',
    payload: { status?: Suggestion['status']; response?: string; duplicateOf?: string } = {},
  ): Promise<{ ok: boolean }> {
    return request(`/studio/suggestions/${encodeURIComponent(id)}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    });
  },

  async studioGetArticles(): Promise<{ articles: Article[] }> {
    return request('/studio/articles');
  },

  async studioSaveArticle(
    article: Partial<Article> & { recordRevision?: boolean; revisionSummary?: string },
  ): Promise<{ ok: boolean; id?: string; article?: Article }> {
    if (article.id) {
      return request(`/studio/articles/${encodeURIComponent(article.id)}`, {
        method: 'PUT',
        body: JSON.stringify(article),
      });
    }
    return request('/studio/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  },

  async studioGetSettings(): Promise<{ settings: SuggestionSettings }> {
    return request('/studio/settings');
  },

  async studioSaveSettings(settings: SuggestionSettings): Promise<{ ok: boolean; settings: SuggestionSettings }> {
    return request('/studio/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async studioGetAudit(): Promise<{ audit: AuditEntry[] }> {
    return request('/studio/audit');
  },

  async studioGetBackup(): Promise<EditionDocument> {
    return request('/studio/backup');
  },

  async studioSaveRoadmap(steps: RoadmapStep[]): Promise<{ ok: boolean }> {
    return request('/studio/roadmap', {
      method: 'PUT',
      body: JSON.stringify({ steps }),
    });
  },
};
