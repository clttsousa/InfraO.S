const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

function normalizeCandidate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^maps\.app\.goo\.gl\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function sanitizeExternalHttpUrl(value: string | null | undefined) {
  const candidate = normalizeCandidate(String(value ?? ""));
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function ensureExternalHttpUrl(value: string | null | undefined, fieldLabel = "URL") {
  const sanitized = sanitizeExternalHttpUrl(value);
  const rawValue = String(value ?? "").trim();
  if (rawValue && !sanitized) {
    throw new Error(`${fieldLabel} inválida. Use apenas links http:// ou https://.`);
  }
  return sanitized;
}
