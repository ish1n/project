# COSMIQ

Initial Sprint 1 scaffold for the COSMIQ platform described in
`/Users/jatinsrivastava/Downloads/COSMIQ_Architecture_Security.docx`.

## Layout

- `cosmiq-api/`: FastAPI backend with `/health`, `/chart`, and `/insight`
- `cosmiq-web/`: Next.js App Router workbench with a backend-for-frontend proxy

## Backend quick start

```bash
cd cosmiq-api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn main:app --reload
```

## Frontend quick start

```bash
cd cosmiq-web
npm install
npm run dev
```

## Current scope

This repo currently implements the Sprint 1 backend critical path from the
spec:

- FastAPI scaffold
- `/health` endpoint
- `/chart` endpoint with Swiss Ephemeris integration hooks
- `/insight` endpoint with deterministic fallback advice and source passages
- Next.js chart workbench with animated wheel, aspect filters, insight cards,
  planet table, local chart history, and JSON export

## Frontend (Ishan-owned) additions

- CSP + security headers via Next.js middleware (`Content-Security-Policy` with per-request nonce, clickjacking/XSS hardening defaults)
- Backend-for-frontend proxy uses `COSMIQ_API_URL` and forwards `CF-Worker-Token` server-to-server
- PWA shell: `public/manifest.json`, offline page (`/offline`), service worker (`public/sw.js`), and app-side SW registration
- Basic CI workflow for `cosmiq-web`: `npm ci`, `npm audit --audit-level=high`, `npm run build`
