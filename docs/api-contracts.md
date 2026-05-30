# COSMIQ API Contract Catalog

All browser requests should flow through the Next.js BFF. Backend routes listed here are FastAPI domain contracts. Error responses should use a consistent envelope:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "request_id": "string",
    "details": {}
  }
}
```

## Auth and Session

### `POST /auth/session`

Purpose: create or refresh an authenticated session.

Request:

```json
{
  "provider": "email|oauth",
  "credential": "opaque",
  "csrf_token": "string"
}
```

Response:

```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "session_expires_at": "datetime",
  "roles": ["member"]
}
```

Auth: public plus CSRF. Rate limit: strict anonymous bucket. Cache: never. Failure modes: invalid credential, locked account, missing CSRF, rate limited.

### `DELETE /auth/session`

Purpose: terminate session and revoke refresh token.

Request: empty. Response: `{ "revoked": true }`. Auth: session. Cache: never.

## User Profile

### `GET /profile`

Purpose: fetch user profile and consent state.

Response:

```json
{
  "user_id": "uuid",
  "display_name": "string",
  "timezone": "Asia/Kolkata",
  "calendar_connected": true,
  "retention_policy": "standard"
}
```

Auth: session. Rate limit: normal authenticated. Cache: private BFF cache max 30s only.

### `PATCH /profile`

Purpose: update non-sensitive profile preferences.

Request:

```json
{
  "display_name": "string",
  "timezone": "Asia/Kolkata",
  "retention_policy": "standard|minimal|audit"
}
```

Auth: session. Cache: invalidate profile cache.

## Chart and Transit

### `POST /chart`

Purpose: compute deterministic natal chart.

Request:

```json
{
  "birth_date": "1990-06-15",
  "birth_time": "08:30:00+05:30",
  "birth_lat": 26.8467,
  "birth_lng": 80.9462,
  "system": "tropical",
  "policy_version": "chart-v1"
}
```

Response:

```json
{
  "chart_id": "uuid",
  "chart_hash": "sha256",
  "julian_day": 2448057.625,
  "planets": {},
  "aspects": [],
  "calculation_ids": ["calc_abc"],
  "policy_version": "chart-v1"
}
```

Auth: session for persistence; anonymous allowed only for non-persistent demo if enabled. Rate limit: chart bucket. Cache: exact Redis chart cache for 24h keyed by chart hash and policy version. Failure modes: ambiguous timezone, invalid coordinate, unsupported date, ephemeris unavailable.

### `POST /transits`

Purpose: compute current or requested transit windows against a chart.

Request:

```json
{
  "chart_id": "uuid",
  "from": "datetime",
  "to": "datetime",
  "granularity": "hour|day",
  "policy_version": "transit-v1"
}
```

Response:

```json
{
  "windows": [],
  "calculation_ids": ["calc_def"],
  "cache_status": "hit|miss|bypass"
}
```

Auth: session. Cache: exact deterministic cache 24h for stable windows; shorter cache for near-real-time transit dashboards.

## Relationship Analysis

### `POST /relationships/compare`

Purpose: compare two collaborators using chart facts, decision history, and annotated interactions.

Request:

```json
{
  "subject_user_id": "uuid",
  "collaborator_id": "uuid",
  "window": {
    "from": "datetime",
    "to": "datetime"
  },
  "include_memory": true
}
```

Response:

```json
{
  "relationship_pair_id": "uuid",
  "support_windows": [],
  "friction_windows": [],
  "retrieval_run_id": "uuid",
  "confidence": {
    "deterministic": 0.91,
    "memory": 0.74,
    "synthesis": 0.68
  },
  "evidence_ids": ["mem_1", "rel_1"]
}
```

Auth: session plus relationship authorization. Rate limit: AI advisory bucket. Cache: retrieval cache 15m if policy permits. Failure modes: collaborator consent missing, insufficient evidence, cross-tenant access denied.

## Decision Logging

### `POST /decisions`

Purpose: create a decision record with temporal and collaborator context.

Request:

```json
{
  "title": "string",
  "description": "string",
  "decision_type": "hiring|launch|architecture|relationship|other",
  "collaborator_ids": ["uuid"],
  "expected_outcome": "string",
  "confidence": 0.72,
  "made_at": "datetime",
  "tags": ["sprint"]
}
```

Response:

```json
{
  "decision_id": "uuid",
  "memory_chunk_ids": ["uuid"],
  "audit_event_id": "uuid"
}
```

Auth: session. Cache: never. Failure modes: validation, unauthorized collaborator, retention policy conflict.

### `POST /decisions/{decision_id}/outcome`

Purpose: attach retrospective outcome and feedback.

Request:

```json
{
  "actual_outcome": "string",
  "outcome_score": 0.8,
  "reviewed_at": "datetime",
  "lessons": "string"
}
```

Response:

```json
{
  "outcome_id": "uuid",
  "recalibration_job_id": "uuid"
}
```

Auth: session. Cache: invalidate memory and relationship retrieval keys.

## Memory Search

### `POST /memory/search`

Purpose: retrieve similar historical decisions, retrospectives, notes, and playbooks.

Request:

```json
{
  "query": "string",
  "filters": {
    "tags": ["sprint"],
    "collaborator_ids": ["uuid"],
    "from": "datetime",
    "to": "datetime"
  },
  "top_k": 8
}
```

Response:

```json
{
  "retrieval_run_id": "uuid",
  "results": [
    {
      "passage_id": "mem_123",
      "source_type": "decision",
      "snippet": "string",
      "score": 0.87
    }
  ]
}
```

Auth: session. Cache: retrieval cache 15m keyed by normalized query, tenant, filters, model, policy version. Failure modes: prompt injection rejected, unsupported filters, retrieval unavailable.

## Recommendation Generation

### `POST /recommendations`

Purpose: generate an explainable recommendation for a decision, relationship, calendar, or scenario workflow.

Request:

```json
{
  "intent": "schedule_review|make_decision|relationship_check|scenario_compare",
  "subject": {
    "decision_id": "uuid",
    "collaborator_ids": ["uuid"],
    "calendar_window": {
      "from": "datetime",
      "to": "datetime"
    }
  },
  "risk_level": "low|medium|high",
  "require_audit_mode": true
}
```

Response:

```json
{
  "recommendation_id": "uuid",
  "summary": "string",
  "actions": [],
  "confidence": {},
  "calculation_ids": [],
  "evidence_ids": [],
  "retrieval_run_id": "uuid",
  "policy_version": "rec-v1",
  "fallback_mode": "none|deterministic_only|insufficient_evidence"
}
```

Auth: session. Rate limit: AI advisory bucket. Cache: semantic cache only for low-risk advisory summaries; never for audit mode, compliance-sensitive, or authoritative outputs. Failure modes: insufficient evidence, unsupported claims, model unavailable, policy rejected.

## Explainability Evidence

### `GET /recommendations/{recommendation_id}/evidence`

Purpose: fetch evidence chain for a recommendation.

Response:

```json
{
  "recommendation_id": "uuid",
  "deterministic_math": [],
  "retrieved_evidence": [],
  "claim_map": [],
  "confidence_breakdown": {},
  "policy_version": "rec-v1",
  "output_hash": "sha256"
}
```

Auth: owner, collaborator with consent, or auditor role. Cache: never in audit mode.

## Calendar

### `POST /calendar/connect`

Purpose: start OAuth flow.

Request:

```json
{
  "provider": "google",
  "requested_scope": "metadata_only"
}
```

Response:

```json
{
  "authorization_url": "https://...",
  "state_expires_at": "datetime"
}
```

Auth: session. Cache: short-lived Redis OAuth state only. Failure modes: provider unavailable, consent policy rejected.

### `POST /calendar/aggregate`

Purpose: aggregate event metadata for a planning window.

Request:

```json
{
  "from": "datetime",
  "to": "datetime",
  "include_raw_content": false
}
```

Response:

```json
{
  "aggregation_id": "uuid",
  "meeting_type_counts": {},
  "participant_hashes": [],
  "density_score": 0.6,
  "cache_status": "hit|miss"
}
```

Auth: session. Cache: calendar aggregation cache 5m. Failure modes: token expired, provider error, user revoked consent.

## Async Forecast Jobs

### `POST /forecasts`

Purpose: enqueue forecast windows, collaboration heatmaps, or scenario computations.

Request:

```json
{
  "forecast_type": "transit|relationship|scenario",
  "from": "datetime",
  "to": "datetime",
  "inputs": {}
}
```

Response:

```json
{
  "job_id": "uuid",
  "status": "queued",
  "idempotency_key": "string",
  "poll_after_ms": 1500
}
```

Auth: session. Cache: job status in Redis; final output persisted in PostgreSQL. Failure modes: duplicate job, quota exceeded, invalid horizon.

### `GET /forecasts/{job_id}`

Purpose: poll forecast job status.

Response:

```json
{
  "job_id": "uuid",
  "status": "queued|running|complete|failed",
  "progress": 0.7,
  "result": {},
  "error": null
}
```

Auth: session. Cache: Redis job status. Failure modes: not found, not owner, expired job status.

## Scenario Sandbox

### `POST /scenarios/compare`

Purpose: simulate schedule, meeting, or collaborator changes.

Request:

```json
{
  "baseline": {},
  "variants": [
    {
      "label": "Move review to Friday morning",
      "changes": {}
    }
  ]
}
```

Response:

```json
{
  "scenario_id": "uuid",
  "ranked_variants": [],
  "evidence_ids": [],
  "confidence": {}
}
```

Auth: session. Cache: exact deterministic components; semantic output only if low risk and not audit mode.

## Audit Export

### `POST /audit/exports`

Purpose: generate a signed evidence bundle.

Request:

```json
{
  "scope": "recommendation|decision|date_range|tenant",
  "scope_id": "uuid",
  "format": "json|pdf|markdown"
}
```

Response:

```json
{
  "job_id": "uuid",
  "export_id": "uuid",
  "status": "queued"
}
```

Auth: owner or auditor. Cache: never. Failure modes: insufficient role, retention period expired, export too large.

## Feedback and Outcome Loop

### `POST /recommendations/{recommendation_id}/feedback`

Purpose: collect user judgment immediately after recommendation.

Request:

```json
{
  "useful": true,
  "confidence_delta": 0.1,
  "comment": "string",
  "selected_action_id": "uuid"
}
```

Response:

```json
{
  "feedback_id": "uuid",
  "learning_event_id": "uuid"
}
```

Auth: session. Cache: invalidate affected recommendation quality aggregates.
