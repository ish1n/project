import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name
    }
  });
}
