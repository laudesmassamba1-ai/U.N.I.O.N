import crypto from 'node:crypto';
import { parseEditionDocument, type EditionDocument } from '../src/lib/edition';

/**
 * Instantané public de l’édition.
 *
 * Les lectures ne doivent pas réveiller la base : l’API sert cet instantané
 * (mémoire, puis stockage d’objets) avec un cache CDN long. Une reconstruction
 * n’a lieu qu’après une écriture, si l’instantané a plus de dix minutes, ou si
 * aucun instantané n’existe.
 */

export const SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000;
export const SNAPSHOT_CACHE_CONTROL =
  'public, max-age=60, s-maxage=600, stale-while-revalidate=86400';

export interface SnapshotSource {
  read(): Promise<string | null>;
  write(body: string): Promise<void>;
}

export interface SnapshotPayload {
  document: EditionDocument;
  body: string;
  etag: string;
  loadedAt: number;
}

export interface SnapshotState {
  payload: SnapshotPayload | null;
  pending: Promise<{ payload: SnapshotPayload; stale: boolean }> | null;
  builds: number;
}

export function createSnapshotState(): SnapshotState {
  return { payload: null, pending: null, builds: 0 };
}

export function snapshotEtag(body: string): string {
  return `"${crypto.createHash('sha256').update(body).digest('hex').slice(0, 32)}"`;
}

function toPayload(document: EditionDocument, loadedAt: number): SnapshotPayload {
  const body = JSON.stringify(document);
  return { document, body, etag: snapshotEtag(body), loadedAt };
}

export function snapshotAgeMs(state: SnapshotState, now = Date.now()): number | null {
  if (!state.payload) return null;
  return Math.max(0, now - state.payload.loadedAt);
}

export function snapshotUpdatedAt(state: SnapshotState): string | null {
  return state.payload?.document.updatedAt ?? null;
}

export function isSnapshotStale(state: SnapshotState, now = Date.now()): boolean {
  if (!state.payload) return true;
  return now - state.payload.loadedAt >= SNAPSHOT_MAX_AGE_MS;
}

function parseSaved(raw: string | null): EditionDocument | null {
  if (!raw) return null;
  try {
    return parseEditionDocument(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

async function readSaved(source: SnapshotSource | null | undefined): Promise<EditionDocument | null> {
  if (!source) return null;
  try {
    return parseSaved(await source.read());
  } catch {
    return null;
  }
}

async function writeSaved(source: SnapshotSource | null | undefined, body: string): Promise<void> {
  if (!source) return;
  try {
    await source.write(body);
  } catch (error) {
    console.warn('Instantané non publié sur le stockage :', (error as Error)?.message);
  }
}

export interface SnapshotOptions {
  state: SnapshotState;
  build: () => Promise<EditionDocument>;
  source?: SnapshotSource | null;
  now?: () => number;
}

/**
 * Sert l’instantané disponible sans interroger la base. Sur une instance
 * froide, tente d’abord le stockage d’objets, puis reconstruit une seule fois.
 */
export async function loadSnapshot(
  options: SnapshotOptions,
): Promise<{ payload: SnapshotPayload; origin: 'memory' | 'store' | 'build' }> {
  const now = options.now ?? Date.now;
  const { state } = options;
  if (state.payload) return { payload: state.payload, origin: 'memory' };
  if (state.pending) {
    const result = await state.pending;
    return { payload: result.payload, origin: 'build' };
  }

  const saved = await readSaved(options.source);
  if (saved) {
    const savedAt = Date.parse(saved.updatedAt);
    const payload = toPayload(saved, Number.isFinite(savedAt) ? savedAt : now());
    state.payload = payload;
    return { payload, origin: 'store' };
  }

  const result = await rebuildSnapshot({ ...options, force: true });
  return { payload: result.payload, origin: 'build' };
}

/**
 * Reconstruit l’instantané si nécessaire. Après une écriture, la base est déjà
 * éveillée : c’est le seul moment où l’on paie la reconstruction sans coût
 * supplémentaire de réveil.
 */
export async function rebuildSnapshot(
  options: SnapshotOptions & { force?: boolean },
): Promise<{ payload: SnapshotPayload; rebuilt: boolean; stale: boolean }> {
  const now = options.now ?? Date.now;
  const { state } = options;

  if (!options.force && state.payload && !isSnapshotStale(state, now())) {
    return { payload: state.payload, rebuilt: false, stale: false };
  }
  if (state.pending) {
    const result = await state.pending;
    return { payload: result.payload, rebuilt: false, stale: result.stale };
  }

  state.pending = (async () => {
    try {
      const document = await options.build();
      const payload = toPayload(document, now());
      state.payload = payload;
      state.builds += 1;
      await writeSaved(options.source, payload.body);
      return { payload, stale: false };
    } catch (error) {
      const saved = await readSaved(options.source);
      const fallback = saved ? toPayload(saved, now()) : state.payload;
      if (fallback) {
        state.payload = fallback;
        return { payload: fallback, stale: true };
      }
      throw error;
    } finally {
      state.pending = null;
    }
  })();

  const result = await state.pending;
  return { payload: result.payload, rebuilt: result.stale === false, stale: result.stale };
}
