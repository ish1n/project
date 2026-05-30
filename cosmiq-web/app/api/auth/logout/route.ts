import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ revoked: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/"
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
