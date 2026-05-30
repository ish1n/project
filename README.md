# COSMIQ

COSMIQ is an AI-native decision intelligence platform that treats planetary
geometry as a deterministic upstream signal for productivity tools, decision
logging, relationship analysis, calendar-aware recommendations, and operational
memory.

It is not an astrology-content app. The product goal is an enterprise-grade
system where every recommendation is explainable, scored, auditable, and tied
to concrete workflow action.

## Layout

- `cosmiq-api/`: FastAPI backend with `/health`, `/chart`, `/insight`,
  `/transits`, `/forecast`, and `/moon`
- `cosmiq-web/`: Next.js App Router workbench with a backend-for-frontend proxy

## Backend quick start

```bash
cd cosmiq-api
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend quick start

```bash
cd cosmiq-web
npm install
COSMIQ_API_URL=http://127.0.0.1:8000 npm run dev
```

Open `http://127.0.0.1:3000/login`, sign in with a valid email and an
8-character-or-longer local password, then use the protected dashboard routes.

## Current scope

This repo currently implements the Sprint 1 backend critical path:

- FastAPI scaffold
- `/health` endpoint
- `/chart` endpoint with Swiss Ephemeris integration hooks
- `/insight` endpoint with deterministic fallback advice and source passages
- `/transits`, `/forecast`, and `/moon` deterministic signal endpoints
- Next.js chart workbench with animated wheel, aspect filters, insight cards,
  planet table, local chart history, and JSON export
- Working Transits, Forecast, and Moon dashboard pages
- Signed HttpOnly session cookie login/logout flow protecting dashboard pages
  and BFF proxy calls

## Production planning docs

The production architecture and senior engineering planning package lives under
`docs/`:

- `docs/COSMIQ_MASTER_PROMPT.md`: master prompt for architecture and planning workflows
- `docs/architecture.md`: executive architecture, C4-style boundaries, data flow, and ownership
- `docs/api-contracts.md`: API contract catalog with request/response shapes and failure modes
- `docs/data-rag-cache.md`: PostgreSQL schema, multi-index RAG, Redis keyspace, and caching plan
- `docs/security-observability.md`: threat model, security architecture, SLOs, telemetry, and incident response
- `docs/delivery-plan.md`: 6-sprint delivery plan for Jatin and Ishan
- `docs/risk-and-moat.md`: risk register and unique product moat analysis
- `docs/adr/`: ADR baseline for the production architecture

## Frontend (Ishan-owned) additions

- CSP + security headers via Next.js middleware (`Content-Security-Policy` with per-request nonce, clickjacking/XSS hardening defaults)
- Backend-for-frontend proxy uses `COSMIQ_API_URL`, forwards `CF-Worker-Token` server-to-server, allowlists upstream paths, caps request body size, and requires a valid session
- PWA shell: `public/manifest.json`, offline page (`/offline`), service worker (`public/sw.js`), and app-side SW registration
- Basic CI workflow for `cosmiq-web`: `npm ci`, `npm audit --audit-level=high`, `npm run build`
