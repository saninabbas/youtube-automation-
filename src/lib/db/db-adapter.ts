import Database from 'better-sqlite3';
import { Pool, PoolClient } from 'pg';
import path from 'path';
import fs from 'fs';

export interface DbResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

let pgPoolInstance: Pool | null = null;
let sqliteInstance: Database.Database | null = null;

export function getPostgresUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

export function isUsingPostgres(): boolean {
  return !!getPostgresUrl();
}

/**
 * Translates query containing '?' positional placeholders into Postgres '$1, $2, ...' syntax.
 */
export function translateSqlToPostgres(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Initializes and returns the PostgreSQL pool if configured.
 */
export function getPgPool(): Pool {
  if (!pgPoolInstance) {
    const connectionString = getPostgresUrl();
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL is not configured.');
    }

    pgPoolInstance = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    pgPoolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pgPoolInstance;
}

/**
 * Initializes and returns SQLite instance (used for local development / testing).
 */
export function getSqliteDb(): Database.Database {
  if (!sqliteInstance) {
    const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const dataDir = isServerless ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'app.db');
    sqliteInstance = new Database(dbPath);
    if (!isServerless) {
      sqliteInstance.pragma('journal_mode = WAL');
    }
    sqliteInstance.pragma('foreign_keys = ON');
  }
  return sqliteInstance;
}

/**
 * Universal async query function that routes to either PostgreSQL or SQLite.
 */
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const pgSql = translateSqlToPostgres(sql);
    const res = await pool.query(pgSql, params);
    return res.rows as T[];
  } else {
    const sqlite = getSqliteDb();
    const stmt = sqlite.prepare(sql);
    return stmt.all(...params) as T[];
  }
}

/**
 * Universal async queryOne function.
 */
export async function dbQueryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (isUsingPostgres()) {
    const rows = await dbQuery<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } else {
    const sqlite = getSqliteDb();
    const stmt = sqlite.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) || null;
  }
}

/**
 * Universal async execute function (INSERT, UPDATE, DELETE).
 */
export async function dbExecute(sql: string, params: any[] = []): Promise<DbResult> {
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const pgSql = translateSqlToPostgres(sql);
    const res = await pool.query(pgSql, params);
    return {
      changes: res.rowCount || 0,
    };
  } else {
    const sqlite = getSqliteDb();
    const stmt = sqlite.prepare(sql);
    const res = stmt.run(...params);
    return {
      changes: res.changes,
      lastInsertRowid: res.lastInsertRowid,
    };
  }
}

/**
 * Universal transaction runner.
 */
export async function dbTransaction<T>(
  callback: (tx: {
    query: <R = any>(sql: string, params?: any[]) => Promise<R[]>;
    queryOne: <R = any>(sql: string, params?: any[]) => Promise<R | null>;
    execute: (sql: string, params?: any[]) => Promise<DbResult>;
  }) => Promise<T>
): Promise<T> {
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        query: async <R = any>(sql: string, params: any[] = []) => {
          const pgSql = translateSqlToPostgres(sql);
          const res = await client.query(pgSql, params);
          return res.rows as R[];
        },
        queryOne: async <R = any>(sql: string, params: any[] = []) => {
          const pgSql = translateSqlToPostgres(sql);
          const res = await client.query(pgSql, params);
          return res.rows.length > 0 ? (res.rows[0] as R) : null;
        },
        execute: async (sql: string, params: any[] = []) => {
          const pgSql = translateSqlToPostgres(sql);
          const res = await client.query(pgSql, params);
          return { changes: res.rowCount || 0 };
        },
      };

      const result = await callback(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const sqlite = getSqliteDb();
    const runInTx = sqlite.transaction(() => {
      // Synchronous SQLite transaction runner wrapped in promise
      return callback({
        query: async (sql, params = []) => sqlite.prepare(sql).all(...params) as any,
        queryOne: async (sql, params = []) => sqlite.prepare(sql).get(...params) as any,
        execute: async (sql, params = []) => {
          const r = sqlite.prepare(sql).run(...params);
          return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
        },
      });
    });
    return await runInTx();
  }
}
