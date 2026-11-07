import { describe, expect, it } from 'vitest';
import {
  SNAPSHOT_CACHE_CONTROL,
  SNAPSHOT_MAX_AGE_MS,
  createSnapshotState,
  loadSnapshot,
  rebuildSnapshot,
  snapshotEtag,
  type SnapshotSource,
} from '../server/snapshot';
import { FileSnapshotSource } from '../server/snapshot-source';
import { buildPublicEdition, serialiseEdition } from '../src/lib/edition';
import { DEFAULT_SETTINGS } from '../src/lib/suggestions';
import type { DatabaseShape, Suggestion } from '../src/types';

const emptyDatabase: DatabaseShape = {
  articles: [],
  suggestions: [],
  votes: [],
  reports: [],
  settings: { ...DEFAULT_SETTINGS },
  audit: [],
};

function suggestion(id: string): Suggestion {
  return {
    id,
    text: 'Une suggestion de test.',
    category: 'Jeunesse',
    department: null,
    status: 'discussion',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    publishedAt: '2026-01-02T10:00:00.000Z',
    archivedAt: null,
    votesUseful: 3,
    votesNotUseful: 0,
    response: null,
    reportCount: 0,
    duplicateOf: null,
  };
}

class MemorySource implements SnapshotSource {
  value: string | null = null;
  writes = 0;

  async read(): Promise<string | null> {
    return this.value;
  }

  async write(body: string): Promise<void> {
    this.writes += 1;
    this.value = body;
  }
}

describe('instantané public', () => {
  it('annonce un cache CDN long et une revalidation en arrière-plan', () => {
    expect(SNAPSHOT_CACHE_CONTROL).toContain('s-maxage=600');
    expect(SNAPSHOT_CACHE_CONTROL).toContain('stale-while-revalidate=86400');
  });

  it('dix lectures consécutives ne construisent qu’une fois', async () => {
    const state = createSnapshotState();
    let builds = 0;
    const build = async () => {
      builds += 1;
      return buildPublicEdition(emptyDatabase, 1);
    };
    for (let index = 0; index < 10; index += 1) {
      await loadSnapshot({ state, build });
    }
    expect(builds).toBe(1);
    expect(state.builds).toBe(1);
  });

  it('dix lectures concurrentes partagent la même reconstruction', async () => {
    const state = createSnapshotState();
    let builds = 0;
    const build = async () => {
      builds += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return buildPublicEdition(emptyDatabase, 2);
    };
    await Promise.all(Array.from({ length: 10 }, () => loadSnapshot({ state, build })));
    expect(builds).toBe(1);
  });

  it('sert l’instantané du stockage sur une instance froide, sans base', async () => {
    const source = new MemorySource();
    const document = buildPublicEdition(emptyDatabase, 3);
    source.value = serialiseEdition({ ...document, updatedAt: '2026-01-02T10:00:00.000Z' });
    const state = createSnapshotState();
    let builds = 0;
    const result = await loadSnapshot({
      state,
      source,
      build: async () => {
        builds += 1;
        return document;
      },
    });
    expect(result.origin).toBe('store');
    expect(builds).toBe(0);
    expect(result.payload.document.revision).toBe(3);
  });

  it('ne reconstruit pas un instantané de moins de dix minutes', async () => {
    const state = createSnapshotState();
    const source = new MemorySource();
    let clock = Date.parse('2026-01-02T11:00:00.000Z');
    let builds = 0;
    const build = async () => {
      builds += 1;
      return buildPublicEdition(emptyDatabase, 4);
    };
    await rebuildSnapshot({ state, source, build, now: () => clock });
    clock += SNAPSHOT_MAX_AGE_MS - 1_000;
    const result = await rebuildSnapshot({ state, source, build, now: () => clock });
    expect(result.rebuilt).toBe(false);
    expect(builds).toBe(1);
  });

  it('reconstruit après dix minutes et publie le fichier', async () => {
    const state = createSnapshotState();
    const source = new MemorySource();
    let clock = Date.parse('2026-01-02T11:00:00.000Z');
    let builds = 0;
    const build = async () => {
      builds += 1;
      return buildPublicEdition(
        { ...emptyDatabase, suggestions: [suggestion(`s${builds}`)] },
        5,
      );
    };
    await rebuildSnapshot({ state, source, build, now: () => clock });
    clock += SNAPSHOT_MAX_AGE_MS + 1_000;
    const result = await rebuildSnapshot({ state, source, build, now: () => clock });
    expect(result.rebuilt).toBe(true);
    expect(builds).toBe(2);
    expect(source.writes).toBe(2);
  });

  it('sert l’ancien instantané quand la base ne répond plus', async () => {
    const state = createSnapshotState();
    const build = async () => buildPublicEdition(emptyDatabase, 6);
    await loadSnapshot({ state, build });
    const result = await rebuildSnapshot({
      state,
      force: true,
      build: async () => {
        throw new Error('compute time quota exceeded');
      },
    });
    expect(result.stale).toBe(true);
    expect(result.payload.document.revision).toBe(6);
  });

  it('change d’ETag quand le contenu change', () => {
    const first = snapshotEtag('{"revision":1}');
    const second = snapshotEtag('{"revision":2}');
    expect(first).not.toBe(second);
    expect(first.startsWith('"') && first.endsWith('"')).toBe(true);
  });

  it('écrit et relit un fichier hors du dépôt', async () => {
    const path = `${process.cwd()}/data/edition.snapshot.test.json`;
    const source = new FileSnapshotSource(path);
    await source.write('{"ok":true}');
    expect(await source.read()).toBe('{"ok":true}');
    const { rm } = await import('node:fs/promises');
    await rm(path, { force: true });
  });
});
