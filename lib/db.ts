import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { getEnv } from "@/lib/env";

declare global {
  var __infraosPool: Pool | undefined;
  var __infraosPoolSignature: string | undefined;
}

function getPoolSignature() {
  const env = getEnv();
  return [env.databaseUrl, env.dbPoolMax, env.dbIdleTimeoutMs, env.dbConnectionTimeoutMs].join("|");
}

function createPool() {
  const env = getEnv();
  return new Pool({
    connectionString: env.databaseUrl,
    max: env.dbPoolMax,
    idleTimeoutMillis: env.dbIdleTimeoutMs,
    connectionTimeoutMillis: env.dbConnectionTimeoutMs,
    allowExitOnIdle: true
  });
}

function getPool() {
  const signature = getPoolSignature();
  if (!global.__infraosPool) {
    global.__infraosPool = createPool();
    global.__infraosPoolSignature = signature;
    return global.__infraosPool;
  }
  if (process.env.NODE_ENV !== "production" && global.__infraosPoolSignature !== signature) {
    void global.__infraosPool.end().catch(() => undefined);
    global.__infraosPool = createPool();
    global.__infraosPoolSignature = signature;
  }
  return global.__infraosPool;
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
