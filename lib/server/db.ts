import path from 'node:path';
import { neon, neonConfig, Pool, type PoolClient } from '@neondatabase/serverless';
import { applyMigrations } from './migrations.js';

export type DbRow = Record<string, unknown>;

export interface RunResult {
  changes: number;
}

export interface PreparedStatement {
  get<T extends DbRow = DbRow>(...params: unknown[]): Promise<T | undefined>;
  all<T extends DbRow = DbRow>(...params: unknown[]): Promise<T[]>;
  run(...params: unknown[]): Promise<RunResult>;
}

export interface Database {
  prepare(sql: string): PreparedStatement;
  query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
  transaction<T>(operation: (tx: Database) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  readonly driver: 'neon-http' | 'pglite';
}

interface QueryRunner {
  query<T extends DbRow>(sql: string, params: unknown[]): Promise<T[]>;
  execute(sql: string, params: unknown[]): Promise<number>;
}

interface DatabaseOptions {
  driver: Database['driver'];
  close: () => Promise<void>;
  transaction?: <T>(operation: (tx: Database) => Promise<T>) => Promise<T>;
}

/**
 * Traduit les `?` historiques en paramètres PostgreSQL `$1`, `$2`… sans
 * toucher aux chaînes SQL entre guillemets.
 */
export function postgresPlaceholders(sql: string): string {
  let index = 0;
  let inString = false;
  let out = '';

  for (let cursor = 0; cursor < sql.length; cursor += 1) {
    const char = sql[cursor];
    if (char === "'") {
      if (inString && sql[cursor + 1] === "'") {
        out += "''";
        cursor += 1;
        continue;
      }
      inString = !inString;
      out += char;
      continue;
    }
    if (char === '?' && !inString) {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += char;
  }

  return out;
}

function createDatabase(runner: QueryRunner, options: DatabaseOptions): Database {
  const database: Database = {
    driver: options.driver,
    prepare(sql) {
      const text = postgresPlaceholders(sql);
      return {
        async get<T extends DbRow>(...params: unknown[]) {
          const rows = await runner.query<T>(text, params);
          return rows[0];
        },
        async all<T extends DbRow>(...params: unknown[]) {
          return runner.query<T>(text, params);
        },
        async run(...params: unknown[]) {
          return { changes: await runner.execute(text, params) };
        },
      };
    },
    query<T extends DbRow>(sql: string, params: unknown[] = []) {
      return runner.query<T>(postgresPlaceholders(sql), params);
    },
    async exec(sql: string) {
      const statements = sql
        .split(/-->\s*statement-breakpoint/g)
        .map((statement) => statement.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await runner.execute(postgresPlaceholders(statement), []);
      }
    },
    async transaction<T>(operation: (tx: Database) => Promise<T>) {
      if (options.transaction) return options.transaction(operation);
      return operation(database);
    },
    close: options.close,
  };

  return database;
}

interface PGliteResult<T> {
  rows: T[];
  affectedRows?: number;
}

interface PGliteQueryable {
  query<T>(sql: string, params?: unknown[]): Promise<PGliteResult<T>>;
}

interface PGliteClient extends PGliteQueryable {
  exec(sql: string): Promise<unknown>;
  transaction<T>(operation: (tx: PGliteQueryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

function pgliteRunner(client: PGliteQueryable): QueryRunner {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[]) {
      const result = await client.query<T>(sql, params);
      return result.rows;
    },
    async execute(sql: string, params: unknown[]) {
      const result = await client.query(sql, params);
      return result.affectedRows ?? 0;
    },
  };
}

function neonRunner(client: PoolClient): QueryRunner {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[]) {
      const result = await client.query(sql, params);
      return result.rows as T[];
    },
    async execute(sql: string, params: unknown[]) {
      const result = await client.query(sql, params);
      return result.rowCount ?? 0;
    },
  };
}

async function createPgliteDatabase(): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  const memory =
    process.env.PGLITE_MEMORY === '1' ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true';
  const location = memory
    ? 'memory://'
    : process.env.PGLITE_PATH || path.join(process.cwd(), 'data', 'pglite');

  const client = new PGlite(location) as unknown as PGliteClient;
  const database = createDatabase(pgliteRunner(client), {
    driver: 'pglite',
    close: () => client.close(),
    transaction: <T>(operation: (tx: Database) => Promise<T>) =>
      client.transaction((tx) =>
        operation(
          createDatabase(pgliteRunner(tx), {
            driver: 'pglite',
            close: async () => {},
          }),
        ),
      ),
  });

  await applyMigrations(database);
  return database;
}

const pools = new Map<string, Pool>();

function neonPool(connectionString: string): Pool {
  let pool = pools.get(connectionString);
  if (!pool) {
    if (!neonConfig.webSocketConstructor && typeof globalThis.WebSocket === 'function') {
      neonConfig.webSocketConstructor = globalThis.WebSocket as unknown as typeof WebSocket;
    }
    pool = new Pool({ connectionString });
    pools.set(connectionString, pool);
  }
  return pool;
}

function createNeonDatabase(connectionString: string): Database {
  const http = neon(connectionString);
  const httpRunner: QueryRunner = {
    async query<T extends DbRow>(sql: string, params: unknown[]) {
      const rows = await http.query(sql, params);
      return rows as T[];
    },
    async execute(sql: string, params: unknown[]) {
      await http.query(sql, params);
      return 0;
    },
  };

  return createDatabase(httpRunner, {
    driver: 'neon-http',
    close: async () => {
      const pool = pools.get(connectionString);
      if (pool) {
        await pool.end();
        pools.delete(connectionString);
      }
    },
    transaction: async <T>(operation: (tx: Database) => Promise<T>) => {
      const client = await neonPool(connectionString).connect();
      try {
        await client.query('begin');
        const result = await operation(
          createDatabase(neonRunner(client), {
            driver: 'neon-http',
            close: async () => {},
          }),
        );
        await client.query('commit');
        return result;
      } catch (error) {
        await client.query('rollback').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  });
}

export type DatabaseRole = 'app' | 'studio' | 'backup' | 'owner';

const ROLE_VARIABLES: Record<DatabaseRole, string> = {
  app: 'DATABASE_URL_APP',
  studio: 'DATABASE_URL_STUDIO',
  backup: 'DATABASE_URL_BACKUP_RO',
  owner: 'DATABASE_URL',
};

function connectionString(role: DatabaseRole): string | null {
  const roleUrl = process.env[ROLE_VARIABLES[role]];
  if (roleUrl) return roleUrl;
  if (process.env.NODE_ENV !== 'production') {
    return process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || null;
  }
  return null;
}

const instances = new Map<DatabaseRole, Promise<Database>>();
let pgliteInstance: Promise<Database> | null = null;

/**
 * En production, chaque rôle utilise sa propre chaîne. En développement et en
 * test, une seule base PGlite partagée reproduit PostgreSQL sans consommer de
 * calcul Neon ; les rôles SQL ne sont donc pas simulés localement.
 */
export function getDatabase(role: DatabaseRole = 'app'): Promise<Database> {
  const url = connectionString(role);
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      return Promise.reject(
        new Error(`${ROLE_VARIABLES[role]} manquant en production.`),
      );
    }
    pgliteInstance ??= createPgliteDatabase();
    return pgliteInstance;
  }

  const existing = instances.get(role);
  if (existing) return existing;
  const created = Promise.resolve(createNeonDatabase(url));
  instances.set(role, created);
  return created;
}

export async function closeDatabase(): Promise<void> {
  for (const [role, pending] of instances) {
    const database = await pending.catch(() => null);
    if (database) await database.close();
    instances.delete(role);
  }
  if (pgliteInstance) {
    const database = await pgliteInstance.catch(() => null);
    pgliteInstance = null;
    if (database) await database.close();
  }
}

export async function resetDatabaseForTests(): Promise<void> {
  await closeDatabase();
}
