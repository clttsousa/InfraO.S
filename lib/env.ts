import { URL } from "node:url";

type EnvConfig = {
  databaseUrl: string;
  authSecret: string;
  dbPoolMax: number;
  dbIdleTimeoutMs: number;
  dbConnectionTimeoutMs: number;
};

let cachedEnv: EnvConfig | null = null;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDatabaseUrl(value: string) {
  const normalized = value.trim();
  const parsed = new URL(normalized);

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL deve começar com postgresql://");
  }

  if (!parsed.hostname || parsed.hostname === "base") {
    throw new Error("DATABASE_URL inválida: host do Neon não foi identificado.");
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    throw new Error("DATABASE_URL inválida: nome do banco não foi informado.");
  }

  if (!parsed.searchParams.get("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  if (!parsed.searchParams.get("channel_binding")) {
    parsed.searchParams.set("channel_binding", "require");
  }

  if (!parsed.searchParams.get("uselibpqcompat")) {
    parsed.searchParams.set("uselibpqcompat", "true");
  }

  return parsed.toString();
}

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  const databaseRaw = process.env.DATABASE_URL;
  const authSecret = process.env.AUTH_SECRET?.trim();

  if (!databaseRaw) {
    throw new Error("DATABASE_URL não configurada. Copie a connection string completa do Neon para o .env.local.");
  }

  if (!authSecret) {
    throw new Error("AUTH_SECRET não configurada. Defina uma chave longa e segura no .env.local.");
  }

  cachedEnv = {
    databaseUrl: normalizeDatabaseUrl(databaseRaw),
    authSecret,
    dbPoolMax: parsePositiveInt(process.env.DB_POOL_MAX, 10),
    dbIdleTimeoutMs: parsePositiveInt(process.env.DB_IDLE_TIMEOUT_MS, 30_000),
    dbConnectionTimeoutMs: parsePositiveInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10_000)
  };

  return cachedEnv;
}

export function getPublicRuntimeChecks() {
  try {
    getEnv();
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao validar variáveis de ambiente.";
    return { ok: false as const, message };
  }
}
