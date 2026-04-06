import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];
const ADMIN_ONLY_PATHS = ["/technicians", "/users", "/settings"];

type SessionPayload = { role: "ADMIN" | "OPERADOR" } | null;

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

function isStaticPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function getSessionPayload(request: NextRequest): Promise<SessionPayload> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { role: payload.role === "ADMIN" ? "ADMIN" : "OPERADOR" };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const session = await getSessionPayload(request);
  const authenticated = Boolean(session);

  if (!authenticated && !isPublic) {
    if (isApiPath(pathname)) {
      return hasToken
        ? clearAuthCookie(NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 }))
        : NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    return hasToken ? clearAuthCookie(response) : response;
  }

  if (session && session.role !== "ADMIN" && isAdminOnlyPath(pathname)) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ message: "Acesso restrito a administradores." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard?forbidden=1", request.url));
  }

  if (!authenticated && isPublic && hasToken) {
    return clearAuthCookie(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
