import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
