import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const baseUrl = process.env.COSMIQ_API_BASE_URL;
  const params = await context.params;

  if (!baseUrl) {
    return NextResponse.json(
      { detail: "COSMIQ_API_BASE_URL is not configured." },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL(params.path.join("/"), ensureTrailingSlash(baseUrl));
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  if (process.env.CF_WORKER_TOKEN) {
    headers.set("CF-Worker-Token", process.env.CF_WORKER_TOKEN);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: canSendBody(request.method) ? await request.text() : undefined,
    cache: "no-store"
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-length");
  responseHeaders.delete("content-encoding");

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

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
