import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { getEnv } from "@/lib/env";

declare global {
  var __infraosPool: Pool | undefined;
}

function getPool() {
  if (global.__infraosPool) {
    return global.__infraosPool;
  }

  const env = getEnv();
  const pool = new Pool({
    connectionString: env.databaseUrl,
    max: env.dbPoolMax,
    idleTimeoutMillis: env.dbIdleTimeoutMs,
    connectionTimeoutMillis: env.dbConnectionTimeoutMs,
    allowExitOnIdle: true
  });

  if (process.env.NODE_ENV !== "production") {
    global.__infraosPool = pool;
  }

  return pool;
}

export const db = new Proxy({} as Pool, {
  get(_target, prop) {
    const pool = getPool();
    return Reflect.get(pool, prop);
  }
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params) as Promise<QueryResult<T>>;
}
