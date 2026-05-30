import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cosmiq_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

export function createSessionToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: createSubject(normalizedEmail),
    email: normalizedEmail,
    name: normalizedEmail.split("@")[0] || "COSMIQ User",
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createSubject(email: string) {
  return createHmac("sha256", getSecret()).update(email).digest("hex").slice(0, 24);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.COSMIQ_SESSION_SECRET || "cosmiq-development-session-secret-change-me";
}
