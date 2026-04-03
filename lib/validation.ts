const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanText(value: FormDataEntryValue | string | null | undefined) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

export function normalizeUuid(value: string | null | undefined) {
  return isUuid(value) ? value : null;
}

export function ensureUuid(value: string | null | undefined, field = "Registro") {
  if (!isUuid(value)) {
    throw new Error(`${field} inválido.`);
  }
  return value;
}

export function isEmail(value: string | null | undefined) {
  return Boolean(value && EMAIL_REGEX.test(value));
}

export function ensureEmail(value: string | null | undefined) {
  if (!isEmail(value)) {
    throw new Error("E-mail inválido.");
  }
  return String(value).trim().toLowerCase();
}

export function ensurePasswordStrength(value: string | null | undefined) {
  const password = String(value ?? "").trim();
  if (password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  return password;
}

export function ensureDateTime(value: string | null | undefined, fieldLabel: string) {
  if (!value) return value;
  const inputDate = new Date(value);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error(`${fieldLabel} inválido.`);
  }
  return value;
}

export function ensureNotPastDateTime(value: string | null | undefined, fieldLabel: string) {
  if (!value) return value;
  const inputDate = new Date(value);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error(`${fieldLabel} inválido.`);
  }
  if (inputDate.getTime() < Date.now() - 60_000) {
    throw new Error(`${fieldLabel} não pode ficar no passado.`);
  }
  return value;
}

export function ensureEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fieldLabel: string): T {
  if (!value || !allowed.includes(value as T)) {
    throw new Error(`${fieldLabel} inválido.`);
  }
  return value as T;
}
