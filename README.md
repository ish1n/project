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
