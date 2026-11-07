import fs from 'node:fs/promises';
import path from 'node:path';
import type { SnapshotSource } from './snapshot';

/**
 * Développement et tests : un fichier hors du dépôt (data/ est ignoré).
 * Production : SNAPSHOT_URL pointe l’objet public servi par le CDN et
 * SNAPSHOT_WRITE_URL reçoit les écritures (URL de put signée, R2 ou B2).
 */
export class FileSnapshotSource implements SnapshotSource {
  constructor(readonly file: string) {}

  async read(): Promise<string | null> {
    try {
      return await fs.readFile(this.file, 'utf8');
    } catch {
      return null;
    }
  }

  async write(body: string): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(temporary, body);
    await fs.rename(temporary, this.file);
  }
}

export class RemoteSnapshotSource implements SnapshotSource {
  constructor(
    private readonly readUrl: string,
    private readonly writeUrl?: string,
  ) {}

  async read(): Promise<string | null> {
    try {
      const response = await fetch(this.readUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2_500),
      });
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  async write(body: string): Promise<void> {
    if (!this.writeUrl) {
      throw new Error('SNAPSHOT_WRITE_URL absent : instantané non publié.');
    }
    const response = await fetch(this.writeUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      throw new Error(`Écriture de l’instantané refusée (${response.status}).`);
    }
  }
}

export function createSnapshotSource(env: NodeJS.ProcessEnv = process.env): SnapshotSource {
  if (env.SNAPSHOT_URL) {
    return new RemoteSnapshotSource(env.SNAPSHOT_URL, env.SNAPSHOT_WRITE_URL || undefined);
  }
  return new FileSnapshotSource(
    env.SNAPSHOT_PATH || path.join(process.cwd(), 'data', 'edition.snapshot.json'),
  );
}
