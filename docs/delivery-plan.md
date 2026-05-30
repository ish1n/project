# COSMIQ Delivery Plan

## Sprint 1: Contracts, Mocks, Design System, ADR Baseline

Goal: make the product implementable before expanding feature depth.

Jatin tasks:

- Define FastAPI route contracts for chart, insight, decisions, relationships, memory, calendar, forecasts, and audit.
- Create Pydantic schema drafts and error envelope standard.
- Draft PostgreSQL schema and Redis keyspace plan.
- Establish ADR template and mandatory ADR baseline.
- Define retrieval collection contracts and evidence ID format.

Ishan tasks:

- Build dashboard navigation model and design tokens.
- Create mock surfaces for explainability console, decision log, relationship analyzer, heatmap, scenario sandbox, and audit center.
- Define BFF proxy conventions and frontend API client contracts.
- Create loading, empty, stale, fallback, and unsupported-evidence UI states.

Shared sync points:

- Contract review.
- Design state review.
- ADR decision review.
- Demo script review.

Blockers:

- Ambiguous ownership of generated evidence fields.
- Missing consent states for collaborator and calendar workflows.
- Unclear cache semantics for advisory output.

Acceptance criteria:

- API contract catalog is approved.
- Design system supports all planned surfaces.
- ADRs exist for BFF, Redis, RAG, deterministic/RAG boundary, calendar minimization, encryption, async forecasts, and audit retention.
- Mock UI can demonstrate end-to-end recommendation explainability without live services.

Demo scope:

- Navigate dashboard.
- Show mocked recommendation and evidence chain.
- Show mocked decision log and heatmap.
- Show ADR index.

Security checklist:

- BFF-only browser access documented.
- CSRF and session strategy documented.
- Data classification labels defined.
- Calendar minimization policy documented.

ADRs to write:

- BFF pattern.
- Redis cache segmentation.
- Vector retrieval strategy.
- Deterministic engine plus RAG synthesis boundary.
- Calendar data minimization.
- Encryption/key management.
- Async forecast workflow.
- Audit evidence retention.

Production readiness notes:

- Do not ship AI generation until citation verification exists.
- Do not connect real calendar accounts until OAuth token encryption exists.

## Sprint 2: Core Chart Engine and Chart Viewer

Goal: create reliable deterministic foundation and visible math.

Jatin tasks:

- Harden chart endpoint validation.
- Version chart calculation policy.
- Add exact chart cache and cache hit metadata.
- Persist chart snapshots and deterministic aspects.
- Add tests for timezone, coordinates, aspect math, and cache key versioning.

Ishan tasks:

- Upgrade chart viewer into an enterprise math console.
- Add calculation ID display, policy version display, stale-state badges, and export controls.
- Improve accessibility and responsive layout.
- Add visual differentiation for deterministic facts versus generated text.

Shared sync points:

- Math formatting review.
- Error semantics review.
- Chart export review.

Blockers:

- Ephemeris file availability in deployment.
- Timezone ambiguity.
- Calculation policy version naming.

Acceptance criteria:

- Chart endpoint returns deterministic calculation IDs.
- Viewer shows positions, aspects, orbs, score, policy version, and cache state.
- Test coverage includes date/time edge cases.
- No LLM needed for chart math.

Demo scope:

- Submit chart.
- Inspect math.
- Toggle deterministic evidence.
- Export chart JSON.

Security checklist:

- No birth context logged in plaintext.
- Cache key uses hash, not raw birth data.
- Rate limit chart endpoint.

ADRs to write:

- Chart policy versioning ADR if calculation policy changes.

Production readiness notes:

- Keep chart engine stateless where possible.
- Store enough calculation evidence for audit reconstruction.

## Sprint 3: Relationship Analyzer and Decision Log

Goal: add operational memory primitives.

Jatin tasks:

- Implement decision and outcome schemas.
- Implement relationship pair, collaborator consent, and relationship event models.
- Create memory chunk generation from decisions and outcomes.
- Add authorization checks for collaborator access.
- Add audit events for decision and relationship writes.

Ishan tasks:

- Build decision log UI with expected outcome and retrospective capture.
- Build relationship analyzer shell with pair selection, timeline, and evidence placeholders.
- Add feedback controls and empty states.
- Add consent and privacy affordances.

Shared sync points:

- Consent workflow review.
- Decision taxonomy review.
- Memory chunk redaction review.

Blockers:

- Collaborator consent model.
- Retention policy for relationship annotations.

Acceptance criteria:

- Users can create decisions and later attach outcomes.
- Relationship pairs respect consent.
- Memory chunks are created with redacted searchable text and encrypted original text.
- Audit log records all writes.

Demo scope:

- Create decision.
- Add outcome.
- View relationship timeline.
- Show audit event.

Security checklist:

- Encrypt sensitive decision text.
- Enforce tenant and user ownership.
- Invalidate retrieval caches after memory writes.

ADRs to write:

- Memory redaction and encryption ADR if implementation differs from baseline.

Production readiness notes:

- Keep outcome learning asynchronous.
- Avoid tuning deterministic scores from outcomes.

## Sprint 4: RAG, Explainability Console, and Memory Retrieval

Goal: ship grounded synthesis with evidence controls.

Jatin tasks:

- Implement multi-index retrieval.
- Add intent classifier, hybrid retrieval, reranker, evidence packer, and citation verifier.
- Store retrieval runs.
- Add deterministic-only fallback.
- Add LLM schema validation and unsupported-claim rejection.

Ishan tasks:

- Build explainability console.
- Show deterministic math, retrieved evidence, generated synthesis, confidence, policy, model, and fallback status.
- Build memory search UI and evidence preview.
- Add unsupported-evidence and deterministic-only UI states.

Shared sync points:

- Evidence display review.
- Hallucination test review.
- Prompt injection red-team review.

Blockers:

- Embedding provider choice.
- Reranker latency budget.
- Evidence token budget.

Acceptance criteria:

- Every recommendation claim has evidence ID or calculation ID.
- Unsupported synthesis is rejected.
- Retrieval runs are auditable.
- Prompt injection attempts do not override system behavior.

Demo scope:

- Search memory.
- Generate recommendation.
- Inspect evidence chain.
- Trigger deterministic-only fallback.

Security checklist:

- Treat retrieved text as untrusted.
- No cross-tenant vector retrieval.
- Disable semantic cache for high-risk outputs.

ADRs to write:

- Supersede vector ADR only if retrieval approach changes.

Production readiness notes:

- Monitor unsupported-claim rate before broad launch.
- Keep strict fallbacks visible to users.

## Sprint 5: Calendar Integration, Async Forecasts, and Collaboration Heatmap

Goal: combine time, collaboration, and async computation.

Jatin tasks:

- Implement calendar OAuth with metadata-only storage.
- Add encrypted token storage.
- Add calendar aggregation worker.
- Add forecast job queue with idempotency.
- Add collaboration heatmap computation.

Ishan tasks:

- Build calendar connect/disconnect UI.
- Build calendar density and insight views.
- Build collaboration heatmap visualization.
- Add forecast job progress and live update states.
- Build scenario sandbox comparison UI.

Shared sync points:

- Consent copy review.
- Heatmap interpretation review.
- Async job state review.

Blockers:

- OAuth provider review.
- Worker deployment.
- Redis production sizing.

Acceptance criteria:

- Calendar metadata aggregates without storing raw content by default.
- Forecast jobs are idempotent and observable.
- Heatmap displays support and tension windows with explainability links.
- Scenario sandbox compares at least three variants.

Demo scope:

- Connect calendar.
- Generate metadata aggregate.
- Run forecast job.
- Compare scenario variants.
- View heatmap.

Security checklist:

- Encrypt OAuth tokens.
- Store OAuth state in short-lived Redis key.
- Allow calendar disconnect and metadata delete.
- Avoid raw calendar content by default.

ADRs to write:

- Calendar provider scope ADR if scopes change.

Production readiness notes:

- Provider outage should degrade gracefully.
- Forecast results must show stale state and policy version.

## Sprint 6: Hardening, Load Testing, Observability, Canary Release, Docs

Goal: make the platform production-operable.

Jatin tasks:

- Add OpenTelemetry traces, Prometheus metrics, structured logs, and runbooks.
- Add load tests for chart, retrieval, recommendation, and forecast routes.
- Add security tests for tenant isolation, prompt injection, CSRF, and cache versioning.
- Add backup/restore validation.
- Add canary deployment and rollback plan.

Ishan tasks:

- Add web vitals, frontend error boundaries, offline/stale UX, and accessibility audit fixes.
- Add admin observability screens for system status and recommendation quality.
- Complete documentation polish and demo data.
- Add responsive QA across desktop and mobile.

Shared sync points:

- Production readiness review.
- Incident simulation.
- Canary checklist.
- Portfolio demo rehearsal.

Blockers:

- Observability provider credentials.
- Production secrets and KMS setup.
- Load testing environment.

Acceptance criteria:

- SLO dashboards exist.
- Incident runbooks exist.
- Load tests meet latency targets.
- Security regression tests pass.
- Canary release can be rolled back by policy and deployment version.

Demo scope:

- Show live dashboards.
- Run audit export.
- Show canary flag.
- Show incident runbook.

Security checklist:

- Secrets scanning enabled.
- Dependency scanning enabled.
- KMS configured.
- Audit log tamper check tested.
- Backup restore tested.

ADRs to write:

- Observability stack ADR.
- Canary release ADR.

Production readiness notes:

- No release should depend on manual DB edits.
- Every recommendation must remain reproducible by policy version and evidence references.
