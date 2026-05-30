import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/session";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ detail: "Expected application/json." }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase() || "";
  const password = body?.password || "";

  if (!emailPattern.test(email) || password.length < 8) {
    return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
  }

  const configuredPassword = process.env.COSMIQ_DEMO_PASSWORD;
  if (configuredPassword && password !== configuredPassword) {
    return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      email,
      name: email.split("@")[0] || "COSMIQ User"
    }
  });

  response.cookies.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
