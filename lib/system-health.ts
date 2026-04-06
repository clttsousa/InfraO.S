import { query } from "@/lib/db";
import { getPublicRuntimeChecks } from "@/lib/env";
import type { SystemHealth } from "@/types";

export async function getSystemHealth(): Promise<SystemHealth> {
  const environmentCheck = getPublicRuntimeChecks();
  let database = { ok: false, message: "Banco não verificado." };

  if (environmentCheck.ok) {
    try {
      const result = await query<{ now: string }>("select now()::text as now");
      database = {
        ok: true,
        message: `Conexão válida. Banco respondeu em ${result.rows[0]?.now ? "tempo real" : "modo mínimo"}.`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao consultar o banco.";
      database = { ok: false, message };
    }
  } else {
    database = { ok: false, message: "Ambiente inválido. O banco não foi testado." };
  }

  return {
    ok: environmentCheck.ok && database.ok,
    environment: {
      ok: environmentCheck.ok,
      message: environmentCheck.ok ? "Variáveis de ambiente válidas." : environmentCheck.message
    },
    database,
    checkedAt: new Date().toISOString()
  };
}
