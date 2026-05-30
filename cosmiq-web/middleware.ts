import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "cosmiq_session";
const SESSION_SECRET =
  process.env.COSMIQ_SESSION_SECRET || "cosmiq-development-session-secret-change-me";

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function buildCsp(nonce: string, isProd: boolean) {
  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isProd ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  return directives.join("; ");
}

export async function middleware(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const nonce = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const hasValidSession = await verifySession(session);

  if (request.nextUrl.pathname.startsWith("/api/proxy") && !hasValidSession) {
    return withSecurityHeaders(
      NextResponse.json({ detail: "Authentication required." }, { status: 401 }),
      nonce,
      isProd
    );
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && !hasValidSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), nonce, isProd);
  }

  if (request.nextUrl.pathname === "/login" && hasValidSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard/chart";
    dashboardUrl.search = "";
    return withSecurityHeaders(NextResponse.redirect(dashboardUrl), nonce, isProd);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  return withSecurityHeaders(response, nonce, isProd);
}

function withSecurityHeaders(response: NextResponse, nonce: string, isProd: boolean) {
  response.headers.set("Content-Security-Policy", buildCsp(nonce, isProd));
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

async function verifySession(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { exp?: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    return crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
  } catch {
    return false;
  }
}

function base64UrlDecode(value: string) {
  const bytes = base64UrlToBytes(value);
  return new TextDecoder().decode(bytes);
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
