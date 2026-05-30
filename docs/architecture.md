# COSMIQ Production Architecture

## Executive Overview

COSMIQ is an AI-native decision intelligence platform that treats planetary geometry as a deterministic upstream signal, then combines that signal with user memory, relationship history, calendar metadata, and auditable retrieval. The product value is operational: it helps users decide when to schedule sensitive work, how to review recurring collaboration patterns, and how to learn from past decisions.

The core engineering challenge is separating stable math from probabilistic synthesis. Planet positions, aspects, windows, and scores are deterministic outputs from the chart engine. RAG retrieves supporting policy, memory, relationship, and calendar evidence. The LLM can only synthesize explanations and actions from those inputs. It must not invent dates, chart values, scores, memories, or evidence.

Primary production goals:

- Explainability first: every recommendation exposes math, retrieved evidence, confidence, policy version, and fallback path.
- Enterprise posture: tenant isolation, auditable evidence chains, data minimization, retention controls, and incident-ready observability.
- Hard AI boundary: deterministic facts are computed by services; generated text is treated as advisory synthesis.
- Operational performance: Redis segmentation, async forecasts, vector retrieval controls, and cache freshness policies.
- Portfolio-level clarity: service contracts, ADRs, delivery ownership, risk register, and measurable acceptance criteria.

## Architecture Principles

- Deterministic core: chart math and scoring are pure service outputs with versioned policies.
- BFF mediation: browsers talk to Next.js server routes; backend APIs are not directly exposed to the browser.
- Multi-index retrieval: retrieval is routed by intent and constrained by tenant, policy, time, and sensitivity.
- Evidence before synthesis: no generation without deterministic facts or retrieved passage IDs.
- Data minimization: calendar integrations store metadata by default, not raw content.
- Cache segmentation: Redis keys are separated by data class, tenant, sensitivity, and policy version.
- Outcome learning without core corruption: user feedback tunes ranking and advisory weights, not ephemeris calculations.
- Auditability: recommendation inputs, policy versions, retrieval runs, and generated outputs are retained according to explicit policy.

## C4-Style Logical Architecture

### System Context

Actors:

- Founder/operator: logs decisions, reviews recommendations, provides outcomes.
- Collaborator: participates in relationship analysis and shared planning.
- Admin/auditor: exports evidence chains, ADRs, policy logs, and compliance reports.
- Calendar provider: supplies OAuth access to event metadata.
- LLM provider: synthesizes grounded explanations and action suggestions.

External systems:

- Google Calendar or equivalent calendar provider.
- LLM and embedding provider.
- Managed PostgreSQL with pgvector.
- Redis.
- Observability stack.
- CI/CD and deployment provider.

### Containers

- `cosmiq-web`: Next.js 14 App Router frontend, PWA shell, design system, dashboard surfaces, BFF proxy routes.
- `cosmiq-api`: FastAPI backend exposing typed domain APIs for chart, relationship, decision, memory, calendar, forecast, and audit workflows.
- Worker service: async forecast generation, calendar aggregation, embedding jobs, audit export generation, outcome recalibration.
- PostgreSQL plus pgvector: transactional system of record and vector collections.
- Redis: segmented cache, rate limits, job state, session presence, pub/sub, idempotency, OAuth state.
- Object storage: export artifacts, signed audit bundles, optional generated reports.
- Observability stack: traces, metrics, logs, dashboards, alerts.

### Backend Components

- Chart Engine: validates birth context, computes chart snapshots, deterministic aspects, scoring windows.
- Insight Orchestrator: builds recommendation requests, loads policies, calls retrieval, invokes LLM synthesis, verifies citations.
- Retrieval Service: routes query intent to vector collections, applies filters, hybrid search, reranking, and evidence packing.
- Memory Service: records decisions, retrospectives, notes, outcomes, and playbook candidates.
- Relationship Service: maintains pairwise collaborator state, interaction annotations, and support/tension heatmaps.
- Calendar Service: handles OAuth, token refresh, metadata extraction, aggregation, and deletion.
- Forecast Service: schedules async chart-window and collaboration-window jobs.
- Audit Service: persists evidence chains, policy versions, retrieval runs, output hashes, exports, and retention events.

## Service Boundaries

### Frontend

Owns:

- Dashboard, chart viewer, explainability console, decision log, relationship analyzer, scenario sandbox, calendar view, audit center.
- Client-side interaction state and local non-authoritative preferences.
- PWA shell and offline page.

Does not own:

- Deterministic calculations.
- API secrets.
- OAuth token storage.
- Authorization decisions.
- Evidence verification.

### BFF

Owns:

- Same-origin browser API surface.
- HttpOnly session cookie handling.
- CSRF validation.
- Server-to-server proxy token forwarding.
- Request shape normalization before backend calls.

Does not own:

- Business policy decisions.
- Long-running jobs.
- Vector retrieval.

### Backend API

Owns:

- Auth enforcement.
- Domain validation.
- Deterministic chart and scoring APIs.
- Recommendation orchestration.
- Calendar, memory, relationship, and audit workflows.
- Typed contracts and error semantics.

### Worker

Owns:

- Forecast computation.
- Calendar aggregation.
- Embedding refreshes.
- Outcome recalibration.
- Audit export generation.
- Retry and idempotency policy for long-running tasks.

### Data Stores

PostgreSQL is the source of truth. Redis is never the system of record for user decisions, calendar authorization, audit events, policy versions, or compliance evidence.

## Data Flow: UI to Insight Generation

1. User submits an action from the dashboard, such as "generate sprint planning recommendation."
2. Browser calls a same-origin BFF route.
3. BFF validates CSRF/session state, attaches server-to-server proxy token, and forwards to FastAPI.
4. FastAPI authenticates the user, resolves tenant, loads policy version, and validates request schema.
5. Chart Engine loads or computes deterministic chart and transit facts. Exact math cache may be used if the key includes tenant, chart hash, timestamp bucket, and policy version.
6. Intent classifier determines which retrieval collections are required: deterministic knowledge base, user memory, relationship history, calendar metadata, or a combination.
7. Retrieval Service applies tenant and sensitivity filters, runs metadata-constrained vector search, lexical fallback, and reranking.
8. Evidence pack is assembled with passage IDs, deterministic calculation IDs, source type, retention class, and confidence features.
9. Insight Orchestrator builds a constrained synthesis request. It includes only sanitized evidence, deterministic facts, output schema, unsupported-claim policy, and citation requirements.
10. LLM returns structured synthesis.
11. Citation verifier maps each generated claim to evidence IDs. Unsupported claims are removed or the response falls back to deterministic-only mode.
12. Recommendation, evidence chain, retrieval run, policy version, cache decision, and output hash are written to the audit log.
13. Backend returns recommendation, actions, confidence, math, evidence, and fallback status.
14. Frontend renders the recommendation with explainability console and feedback controls.
15. Feedback and eventual outcomes enter the outcome learning loop.

## Responsibility Matrix

| Area | Jatin | Ishan | Shared |
| --- | --- | --- | --- |
| Backend APIs | Owner | Contract consumer | Contract review |
| Chart engine | Owner | Viewer integration | Math display acceptance |
| RAG pipeline | Owner | Evidence UI | Explainability semantics |
| Redis architecture | Owner | BFF cache headers | Freshness UX |
| PostgreSQL schema | Owner | Form/API mapping | Schema naming |
| Calendar OAuth | Owner | Connect/disconnect UI | Consent copy |
| Decision log | API/data owner | UI owner | Workflow acceptance |
| Relationship analyzer | Service owner | UX owner | Heatmap interpretation |
| Design system | API state support | Owner | Accessibility review |
| Security controls | Backend owner | Frontend owner | Threat modeling |
| Observability | Backend and worker owner | Web vitals and UX telemetry | SLO review |
| ADRs | Backend/system ADRs | Frontend/BFF ADRs | Final decisions |

## Feature Surfaces

- Executive dashboard: recommendation queue, upcoming windows, open decisions, risk flags, system confidence.
- Chart math viewer: deterministic positions, aspects, orbs, applying/separating state, scoring policy.
- Explainability console: math, evidence, synthesis, confidence, policy, cache state, fallback reason.
- Decision log: decisions, owners, context, hypothesis, expected outcome, retrospective.
- Relationship analyzer: pairwise style, friction patterns, collaboration windows, history-backed recommendations.
- Collaboration heatmap: sprint day/time support and tension visualization.
- Scenario sandbox: compare changed timing, meeting type, or collaborators.
- Calendar insight view: metadata-only recommendations, stale-data warnings, consent controls.
- Memory playbook library: reusable patterns learned from outcomes.
- Audit export center: evidence bundles, ADRs, policy logs, retention reports.
- Admin/observability console: model fallback, cache hit rate, retrieval quality, queue lag, incidents.
