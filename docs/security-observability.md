# COSMIQ Security, Threat Model, and Observability

## Security Architecture

### Identity and Session

- Use HttpOnly, Secure, SameSite cookies for browser sessions.
- Keep access tokens short-lived.
- Rotate refresh tokens on use.
- Store token family metadata for replay detection.
- Enforce RBAC for member, collaborator, admin, and auditor roles.
- Require stronger authentication for audit exports, calendar reconnects, and key-management actions.

### BFF and API Boundary

- Browser calls only same-origin Next.js BFF routes.
- BFF attaches server-to-server proxy token to FastAPI.
- FastAPI rejects direct public requests without the proxy token except health and public docs in non-production.
- CSRF protection is required for state-changing BFF routes.
- Backend revalidates authorization. BFF checks are not treated as sufficient.

### Tenant Isolation

- Every tenant-owned row includes `tenant_id`.
- PostgreSQL row-level security should enforce tenant scope.
- Retrieval filters must include tenant and consent constraints.
- Vector search wrappers must require tenant predicate before similarity query.
- Audit logs must record tenant, actor, target, and request ID.

### Calendar Security

- Request minimal OAuth scopes.
- Store encrypted provider tokens using envelope encryption.
- Store event metadata by default: time, duration, meeting type, participant hashes, and outcome labels.
- Do not store raw event title, description, location, attendees, or attachments unless the user explicitly opts in.
- Allow disconnect, revoke, delete metadata, and export.

### Encryption and Key Management

- Use TLS in transit.
- Use cloud KMS or equivalent for envelope encryption.
- Encrypt calendar tokens, sensitive decision text, notes, outcome comments, relationship annotations, and audit payloads.
- Keep searchable redacted text separate from ciphertext.
- Rotate data encryption keys by tenant or environment.
- Maintain key version references for decryptable records.

### Prompt and Retrieval Security

- Treat user text, calendar metadata, retrieved memory, and relationship notes as untrusted.
- Run prompt-injection checks before embedding and before model context assembly.
- Strip instructions that target the model, system prompt, tools, secrets, retrieval rules, or policy bypass.
- Quarantine suspicious memory chunks from retrieval until reviewed or automatically downgraded.
- Require citation verification before any generated recommendation is accepted.
- Fall back to deterministic-only output if evidence is insufficient.

### Audit Logging

- Record recommendation inputs, deterministic calculation IDs, retrieval run IDs, evidence IDs, policy version, model version, output hash, fallback mode, and cache decision.
- Use hash chaining for audit events.
- Retain raw payloads only when policy permits and encrypt them.
- Provide export bundles with manifest, hashes, timestamps, and policy versions.

## Threat Model

| Threat | Risk | Detection | Mitigation |
| --- | --- | --- | --- |
| Malicious user attempts prompt injection | Unsupported or unsafe synthesis | Injection rule hits, unsupported claim rate | Sanitize, quarantine, citation verifier, deterministic fallback |
| Compromised browser session | Unauthorized actions | Impossible travel, token replay, unusual rate | Short sessions, refresh rotation, step-up auth, revoke all |
| Leaked OAuth token | Calendar exposure | Provider revocation event, failed refresh anomaly | Envelope encryption, scope minimization, rotation, disconnect |
| Cross-tenant retrieval leak | Data breach | Retrieval run tenant mismatch, audit alert | Mandatory tenant filters, RLS, integration tests |
| Poisoned memory entry | Bad recommendations | Low feedback, injection markers, anomaly score | Quarantine, source weighting, outcome-aware ranking |
| Model hallucination | Unsupported advice | Citation verification failure | Reject output, retry strict, fallback deterministic-only |
| Stale cache | Wrong recommendation | Cache version mismatch, stale warnings | Policy-versioned keys, TTL, invalidation on write |
| Redis exposure | Sensitive data leakage | Network alert, auth failure, unusual key scan | Private network, auth, no durable secrets, key segmentation |
| Worker replay | Duplicate forecasts or audits | Duplicate idempotency key | Idempotency locks, durable job table, result reuse |
| Audit tampering | Compliance failure | Chain hash break | Append-only events, hash chaining, immutable export |
| Calendar raw content overcollection | Privacy violation | Data classification scan | Metadata-only default, explicit opt-in, deletion controls |
| SSRF through integrations | Infrastructure access | Egress anomaly | URL allowlists, metadata IP blocks, no arbitrary fetch |

## SLOs and Operational Targets

### API Latency

- `POST /chart`: p95 under 350ms on warm cache, p95 under 1200ms cold.
- `POST /recommendations`: p95 under 4s for non-async low-risk recommendations.
- `POST /memory/search`: p95 under 900ms.
- `GET /forecasts/{job_id}`: p95 under 100ms.

### Reliability

- Core API availability: 99.9 percent monthly.
- BFF availability: 99.9 percent monthly.
- Worker job completion: 99 percent within declared job window.
- Calendar aggregation success: 98 percent excluding provider outages.

### AI and Retrieval Quality

- Unsupported-claim rate below 1 percent.
- Citation verification pass rate above 98 percent after retry.
- Retrieval p95 latency below 700ms.
- Reranker timeout fallback below 3 percent.
- User feedback useful rate tracked by workflow and model version.

### Cache and Queue

- Chart exact cache hit rate above 70 percent after normal usage.
- Retrieval cache hit rate above 30 percent for repeated dashboard queries.
- Redis memory saturation alert at 75 percent.
- Worker queue lag alert at 60s for normal forecasts, 5m for exports.

## Observability

### Traces

Use OpenTelemetry spans:

- `bff.request`
- `api.auth`
- `chart.compute`
- `cache.get`
- `cache.set`
- `retrieval.intent_classify`
- `retrieval.vector_search`
- `retrieval.lexical_search`
- `retrieval.rerank`
- `llm.synthesize`
- `citation.verify`
- `audit.write`
- `worker.forecast`
- `calendar.aggregate`

Trace attributes should include request ID, tenant ID hash, user ID hash, policy version, model version, cache status, fallback mode, and job ID.

### Metrics

- Request count, latency, and error rate by route.
- Chart compute latency and ephemeris errors.
- Redis hit rate, memory, evictions, and command latency.
- pgvector query latency and result count.
- Retrieval pass/fail and reranker timeout.
- Citation verification pass/fail.
- LLM token usage, cost, fallback rate, and refusal/error rate.
- Recommendation feedback and outcome score.
- Worker queue depth and job age.
- Calendar sync success and token refresh failures.
- Audit export count, duration, and failures.

### Logs

Use structured JSON logs. Never log raw tokens, raw calendar content, sensitive notes, or full prompts. Log hashes, IDs, policy versions, and failure codes.

## Incident Response

Severity levels:

- SEV1: confirmed data leak, cross-tenant access, audit integrity break, or production outage.
- SEV2: sustained recommendation failures, auth degradation, calendar token issue, severe latency.
- SEV3: partial feature degradation, cache outage with working fallback, worker backlog.
- SEV4: minor bug, documentation issue, non-critical metric regression.

Runbook outline:

1. Declare incident and assign owner.
2. Freeze risky deploys.
3. Identify blast radius by tenant, route, model, policy version, and time window.
4. Disable affected feature flag or switch to deterministic-only fallback.
5. Rotate secrets or revoke OAuth tokens if exposed.
6. Export and preserve audit records.
7. Patch, canary, monitor, and expand rollout.
8. Publish post-incident review with root cause, customer impact, detection gaps, and prevention work.

## Canary and Rollback

- Ship recommendation policy changes behind versioned policy flags.
- Canary new retrieval ranking to internal tenant first.
- Keep previous policy versions active for rollback.
- Store output policy version with every recommendation.
- Roll back model prompts by policy version, not by editing historical records.
- Disable semantic cache during risky releases.
