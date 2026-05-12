export function isNextRedirectError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const digest = "digest" in error ? String((error as Error & { digest?: unknown }).digest ?? "") : "";
  return error.message === "NEXT_REDIRECT" || digest.startsWith("NEXT_REDIRECT");
}

export function getSafeActionErrorMessage(error: unknown, fallback = "Não foi possível concluir. Tente novamente.") {
  if (!(error instanceof Error)) return fallback;

  const raw = error.message?.trim();
  if (!raw || raw === "NEXT_REDIRECT" || raw.includes("NEXT_REDIRECT")) return fallback;

  if (/duplicate key|unique constraint|violates unique/i.test(raw)) {
    return "Já existe um registro com estes dados.";
  }

  if (/violates foreign key|insert or update on table/i.test(raw)) {
    return "Não foi possível concluir porque há dados relacionados pendentes ou inválidos.";
  }

  if (/relation .* does not exist|column .* does not exist|syntax error at or near|pg_|postgres|sql/i.test(raw)) {
    return fallback;
  }

  if (/timeout|connection|ECONN|database|banco/i.test(raw)) {
    return "Não foi possível conectar ao banco agora. Tente novamente em instantes.";
  }

  return raw.slice(0, 280);
}
