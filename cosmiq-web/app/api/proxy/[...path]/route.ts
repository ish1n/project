import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const allowedUpstreamPaths = new Set(["health", "chart", "insight", "transits", "forecast", "moon"]);
const maxBodyBytes = 64 * 1024;

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const baseUrl = process.env.COSMIQ_API_URL;
  const params = await context.params;
  const upstreamPath = params.path.join("/");

  if (!baseUrl) {
    return NextResponse.json(
      { detail: "COSMIQ_API_URL is not configured." },
      { status: 500 }
    );
  }

  if (!allowedUpstreamPaths.has(upstreamPath)) {
    return NextResponse.json({ detail: "Proxy path is not allowed." }, { status: 404 });
  }

  const body = canSendBody(request.method) ? await request.text() : undefined;
  if (body && new TextEncoder().encode(body).byteLength > maxBodyBytes) {
    return NextResponse.json({ detail: "Request body is too large." }, { status: 413 });
  }

  const upstreamUrl = new URL(upstreamPath, ensureTrailingSlash(baseUrl));
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const passthrough = [
    "accept",
    "accept-language",
    "content-type",
    "user-agent",
    "authorization"
  ];

  for (const name of passthrough) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (process.env.CF_WORKER_TOKEN) {
    headers.set("CF-Worker-Token", process.env.CF_WORKER_TOKEN);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store"
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-length");
  responseHeaders.delete("content-encoding");
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-COSMIQ-Proxy", "bff");

  return new NextResponse(await upstreamResponse.text(), {
    status: upstreamResponse.status,
    headers: responseHeaders
  });
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function canSendBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
