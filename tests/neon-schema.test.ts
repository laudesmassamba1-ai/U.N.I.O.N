import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const migrations = readdirSync(path.join(process.cwd(), 'drizzle'))
  .filter((file) => file.endsWith('.sql'))
  .sort();

const db = new PGlite();

beforeAll(async () => {
  for (const file of migrations) {
    const sql = readFileSync(path.join(process.cwd(), 'drizzle', file), 'utf8');
    await db.exec(sql);
  }
}, 60_000);

afterAll(async () => {
  await db.close();
}, 30_000);

describe('schéma PostgreSQL', () => {
  it('applique toutes les tables de référence', async () => {
    const result = await db.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      'article_revisions',
      'articles',
      'audit_log',
      'backup_log',
      'media',
      'members',
      'reports',
      'roadmap',
      'settings',
      'snapshot_meta',
      'studio_users',
      'suggestion_responses',
      'suggestion_votes',
      'suggestions',
    ]);
  });

  it('refuse un texte de suggestion hors bornes', { timeout: 20_000 }, async () => {
    await expect(
      db.query(
        "insert into suggestions (id, text, category, created_at, updated_at) values ('court', 'trop court', 'Jeunesse', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
      ),
    ).rejects.toThrow();
  });

  it('refuse deux votes du même jeton sur la même suggestion', async () => {
    await db.query(
      "insert into suggestions (id, text, category, status, created_at, updated_at) values ('s1', 'Une suggestion assez longue pour passer la contrainte.', 'Jeunesse', 'discussion', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
    );
    await db.query(
      "insert into suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at) values ('v1', 's1', 'hash-1', 'useful', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
    );
    await expect(
      db.query(
        "insert into suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at) values ('v2', 's1', 'hash-1', 'not_useful', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
      ),
    ).rejects.toThrow();
  });

  it('refuse une valeur de vote hors useful et not_useful', async () => {
    await expect(
      db.query(
        "insert into suggestion_votes (id, suggestion_id, voter_hash, value, created_at, updated_at) values ('v3', 's1', 'hash-2', 'maybe', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
      ),
    ).rejects.toThrow();
  });

  it('ne contient aucune colonne identifiante dans suggestions, votes et signalements', async () => {
    const result = await db.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name from information_schema.columns
       where table_schema = 'public'
         and table_name in ('suggestions', 'suggestion_votes', 'reports')`,
    );
    const forbidden = ['ip', 'user_agent', 'email', 'phone'];
    for (const row of result.rows) {
      expect(forbidden).not.toContain(row.column_name);
    }
  });

  it('impose une seule ligne d’instantané', async () => {
    await db.query("insert into snapshot_meta (id, built_at, etag) values (1, '2026-01-01T00:00:00.000Z', 'e')");
    await expect(
      db.query("insert into snapshot_meta (id, built_at, etag) values (2, '2026-01-01T00:00:00.000Z', 'e')"),
    ).rejects.toThrow();
  });
});
