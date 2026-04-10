import { NextRequest, NextResponse } from "next/server";
import { authenticateInternalUser, getSessionCookie, signSessionToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureEmail, ensurePasswordStrength } from "@/lib/validation";

type Bucket = { count: number; resetAt: number };
type RateLimitRow = { bucket_key: string; attempt_count: number; window_started_at: string; blocked_until: string | null; };

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const fallbackBuckets = new Map<string, Bucket>();

function getClientKey(request: NextRequest, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const fallback = request.headers.get("x-real-ip")?.trim() || "local";
  return `${forwarded || fallback}:${email}`;
}

function isMissingTableError(error: unknown) {
  return error instanceof Error && /auth_login_attempts|does not exist|relation .* does not exist/i.test(error.message);
}

function checkRateLimitFallback(key: string) {
  const now = Date.now();
  const current = fallbackBuckets.get(key);
  if (!current || current.resetAt < now) {
    fallbackBuckets.set(key, { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS };
  }
  if (current.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: current.resetAt - now };
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - current.count };
}

function registerAttemptFallback(key: string, success: boolean) {
  const now = Date.now();
  const current = fallbackBuckets.get(key) ?? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (success) {
    fallbackBuckets.delete(key);
    return;
  }
  current.count += 1;
  if (current.resetAt < now) {
    current.count = 1;
    current.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  fallbackBuckets.set(key, current);
}

async function checkRateLimitDb(key: string) {
  const result = await query<RateLimitRow>(`select bucket_key, attempt_count, window_started_at, blocked_until from auth_login_attempts where bucket_key = $1 limit 1`, [key]);
  const row = result.rows[0];
  if (!row) return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS };

  const now = Date.now();
  const windowStartedAt = new Date(row.window_started_at).getTime();
  const blockedUntil = row.blocked_until ? new Date(row.blocked_until).getTime() : 0;

  if (blockedUntil > now) return { allowed: false, retryAfterMs: blockedUntil - now };

  if (windowStartedAt + RATE_LIMIT_WINDOW_MS < now) {
    await query(`delete from auth_login_attempts where bucket_key = $1`, [key]);
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS };
  }

  if (row.attempt_count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: windowStartedAt + RATE_LIMIT_WINDOW_MS - now };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - row.attempt_count };
}

async function registerAttemptDb(key: string, success: boolean) {
  if (success) {
    await query(`delete from auth_login_attempts where bucket_key = $1`, [key]);
    return;
  }

  await query(
    `
      insert into auth_login_attempts (bucket_key, attempt_count, window_started_at, blocked_until, updated_at)
      values ($1, 1, now(), null, now())
      on conflict (bucket_key) do update
      set
        attempt_count = case
          when auth_login_attempts.window_started_at < now() - make_interval(secs => $2::double precision / 1000) then 1
          else auth_login_attempts.attempt_count + 1
        end,
        window_started_at = case
          when auth_login_attempts.window_started_at < now() - make_interval(secs => $2::double precision / 1000) then now()
          else auth_login_attempts.window_started_at
        end,
        blocked_until = case
          when (
            case
              when auth_login_attempts.window_started_at < now() - make_interval(secs => $2::double precision / 1000) then 1
              else auth_login_attempts.attempt_count + 1
            end
          ) >= $3 then now() + make_interval(secs => $2::double precision / 1000)
          else null
        end,
        updated_at = now()
    `,
    [key, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_ATTEMPTS]
  );

  await query(`delete from auth_login_attempts where updated_at < now() - interval '2 days'`);
}

async function checkRateLimit(key: string) {
  try {
    return await checkRateLimitDb(key);
  } catch (error) {
    if (isMissingTableError(error)) return checkRateLimitFallback(key);
    throw error;
  }
}

async function registerAttempt(key: string, success: boolean) {
  try {
    await registerAttemptDb(key, success);
  } catch (error) {
    if (isMissingTableError(error)) {
      registerAttemptFallback(key, success);
      return;
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";
    const passwordRaw = typeof body?.password === "string" ? body.password : "";

    if (!emailRaw || !passwordRaw) {
      return NextResponse.json({ message: "Informe e-mail e senha." }, { status: 400 });
    }

    let email = "";
    try {
      email = ensureEmail(emailRaw);
      ensurePasswordStrength(passwordRaw);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Credenciais inválidas.";
      return NextResponse.json({ message }, { status: 400 });
    }

    const rateKey = getClientKey(request, email);
    const rateState = await checkRateLimit(rateKey);
    if (!rateState.allowed) {
      return NextResponse.json({ message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rateState.retryAfterMs ?? 0) / 1000)) } });
    }

    const user = await authenticateInternalUser(email, passwordRaw);
    if (!user) {
      await registerAttempt(rateKey, false);
      return NextResponse.json({ message: "Usuário ou senha inválidos, ou usuário inativo." }, { status: 401 });
    }

    await registerAttempt(rateKey, true);
    const token = await signSessionToken(user);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(getSessionCookie(token));
    return response;
  } catch (error) {
    console.error("[infraos] login error", error);
    return NextResponse.json({ message: "Não foi possível autenticar agora. Revise a configuração do ambiente e a conexão com o banco." }, { status: 500 });
  }
}
