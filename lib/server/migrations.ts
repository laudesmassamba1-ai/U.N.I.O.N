import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Database } from './db.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');
const MIGRATIONS_TABLE = '__union_migrations';

export interface Migration {
  name: string;
  statements: string[];
}

export function loadMigrations(directory = MIGRATIONS_DIR): Migration[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      name: file,
      statements: readFileSync(path.join(directory, file), 'utf8')
        .split(/-->\s*statement-breakpoint/g)
        .map((statement) => statement.trim())
        .filter(Boolean),
    }));
}

/** Applique les fichiers SQL dans l’ordre, sans jamais afficher de connexion. */
export async function applyMigrations(db: Database, directory = MIGRATIONS_DIR): Promise<string[]> {
  await db.exec(`
    create table if not exists ${MIGRATIONS_TABLE} (
      name text primary key,
      applied_at text not null
    )
  `);

  const existing = await db.prepare(`select name from ${MIGRATIONS_TABLE}`).all<{ name: string }>();
  const applied = new Set(existing.map((row) => row.name));
  const ready: string[] = [];

  for (const migration of loadMigrations(directory)) {
    if (applied.has(migration.name)) continue;
    for (const statement of migration.statements) {
      await db.exec(statement);
    }
    await db
      .prepare(`insert into ${MIGRATIONS_TABLE} (name, applied_at) values (?, ?)`)
      .run(migration.name, new Date().toISOString());
    ready.push(migration.name);
  }

  return ready;
}
