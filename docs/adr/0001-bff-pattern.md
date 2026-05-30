# ADR 0001: BFF Pattern Between Frontend and Backend

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ has a browser-based Next.js frontend and a FastAPI backend that will eventually handle sensitive user memory, calendar metadata, recommendations, and audit evidence. Direct browser access to backend APIs would expose backend origin details, complicate CORS, and make session and CSRF handling weaker.

## Options Considered

- Browser calls FastAPI directly.
- Browser calls Next.js BFF routes, which proxy to FastAPI.
- Fully merge backend domain logic into Next.js.

## Decision

Use a Backend-for-Frontend pattern. Browser requests go to same-origin Next.js routes. The BFF forwards requests to FastAPI with a server-to-server proxy token. FastAPI remains the domain authority.

## Trade-Offs

- Adds an extra hop and operational surface.
- Simplifies browser security and keeps backend origin private.
- Lets the frontend own UI-specific aggregation without moving domain logic into the browser.

## Security Impact

- Enables HttpOnly cookie sessions.
- Reduces direct backend exposure.
- Supports CSRF enforcement at same-origin boundary.
- Prevents public clients from attaching privileged server-to-server headers.

## Operational Impact

- Requires BFF health checks and tracing.
- Requires shared request IDs between BFF and backend.
- Requires careful timeout and error mapping.

## Consequences

Frontend code must never call FastAPI directly from client components. The backend still revalidates auth and authorization because BFF checks are not sufficient.

## Rollback/Superseding Path

This ADR can be superseded if COSMIQ moves to a unified backend platform or a managed API gateway with equivalent session, CSRF, and origin protection.
