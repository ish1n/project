# COSMIQ Data, RAG, and Cache Design

## PostgreSQL Schema Outline

All tenant-owned tables include `tenant_id`, `created_at`, `updated_at`, and row-level security policies. Sensitive fields are encrypted at the application layer before storage when marked below.

### Identity and Profile

`users`

- `id uuid primary key`
- `tenant_id uuid not null`
- `email_hash text unique not null`
- `role text not null`
- `status text not null`
- `last_login_at timestamptz`

Indexes: `(tenant_id, status)`, unique `(tenant_id, email_hash)`.

`profiles`

- `user_id uuid primary key references users(id)`
- `display_name text`
- `timezone text not null`
- `retention_policy text not null`
- `consent_flags jsonb not null`

Encryption: optional display name if tenant policy requires.

### Chart and Deterministic Math

`birth_contexts`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `birth_date date not null`
- `birth_time time with time zone not null`
- `birth_lat numeric(9,6) not null`
- `birth_lng numeric(9,6) not null`
- `chart_system text not null`
- `birth_context_hash text not null`

Indexes: unique `(tenant_id, user_id, birth_context_hash)`.

`chart_snapshots`

- `id uuid primary key`
- `tenant_id uuid not null`
- `birth_context_id uuid references birth_contexts(id)`
- `chart_hash text not null`
- `policy_version text not null`
- `julian_day numeric not null`
- `planet_payload jsonb not null`
- `nakshatra_payload jsonb`

Indexes: unique `(tenant_id, chart_hash, policy_version)`.

`deterministic_aspects`

- `id uuid primary key`
- `tenant_id uuid not null`
- `chart_snapshot_id uuid references chart_snapshots(id)`
- `planet_1 text not null`
- `planet_2 text not null`
- `aspect_name text not null`
- `exact_angle numeric not null`
- `orb numeric not null`
- `applying boolean not null`
- `tension_score integer not null`
- `math_str text not null`
- `calculation_id text not null`

Indexes: `(tenant_id, chart_snapshot_id)`, `(tenant_id, calculation_id)`.

### Decisions and Outcomes

`decisions`

- `id uuid primary key`
- `tenant_id uuid not null`
- `owner_user_id uuid references users(id)`
- `title text not null`
- `description_ciphertext text`
- `decision_type text not null`
- `expected_outcome_ciphertext text`
- `confidence numeric(4,3)`
- `made_at timestamptz not null`
- `tags text[]`
- `recommendation_id uuid`

Encryption: description and expected outcome.

Indexes: `(tenant_id, owner_user_id, made_at desc)`, GIN `(tags)`.

`decision_outcomes`

- `id uuid primary key`
- `tenant_id uuid not null`
- `decision_id uuid references decisions(id)`
- `actual_outcome_ciphertext text`
- `outcome_score numeric(4,3)`
- `lessons_ciphertext text`
- `reviewed_at timestamptz not null`

Encryption: actual outcome and lessons.

### Collaboration and Relationships

`collaborators`

- `id uuid primary key`
- `tenant_id uuid not null`
- `owner_user_id uuid references users(id)`
- `collaborator_user_id uuid references users(id)`
- `display_name_ciphertext text`
- `consent_status text not null`

Indexes: unique `(tenant_id, owner_user_id, collaborator_user_id)`.

`relationship_pairs`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_a_id uuid references users(id)`
- `user_b_id uuid references users(id)`
- `pair_hash text not null`
- `status text not null`

Indexes: unique `(tenant_id, pair_hash)`.

`relationship_events`

- `id uuid primary key`
- `tenant_id uuid not null`
- `relationship_pair_id uuid references relationship_pairs(id)`
- `event_type text not null`
- `occurred_at timestamptz not null`
- `annotation_ciphertext text`
- `outcome_score numeric(4,3)`
- `decision_id uuid references decisions(id)`

Encryption: annotation.

### Calendar

`calendar_connections`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `provider text not null`
- `provider_account_hash text not null`
- `access_token_ciphertext text not null`
- `refresh_token_ciphertext text`
- `scope text not null`
- `expires_at timestamptz`
- `revoked_at timestamptz`

Encryption: access and refresh tokens with envelope encryption.

`calendar_event_metadata`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `provider_event_hash text not null`
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `meeting_type text`
- `participant_hashes text[]`
- `duration_minutes integer`
- `outcome_score numeric(4,3)`
- `raw_content_stored boolean default false`

Indexes: `(tenant_id, user_id, starts_at)`, unique `(tenant_id, user_id, provider_event_hash)`.

Default policy: no raw title, description, or notes.

### Recommendations and Evidence

`recommendations`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `intent text not null`
- `summary_ciphertext text`
- `actions jsonb not null`
- `confidence jsonb not null`
- `policy_version text not null`
- `retrieval_run_id uuid`
- `fallback_mode text not null`
- `output_hash text not null`

Encryption: summary when user-specific.

`recommendation_evidence`

- `id uuid primary key`
- `tenant_id uuid not null`
- `recommendation_id uuid references recommendations(id)`
- `evidence_type text not null`
- `evidence_ref_id text not null`
- `claim_hash text not null`
- `support_status text not null`

Indexes: `(tenant_id, recommendation_id)`, `(tenant_id, evidence_ref_id)`.

`feedback`

- `id uuid primary key`
- `tenant_id uuid not null`
- `recommendation_id uuid references recommendations(id)`
- `user_id uuid references users(id)`
- `useful boolean`
- `confidence_delta numeric(4,3)`
- `comment_ciphertext text`
- `selected_action_id uuid`

### Retrieval and Memory

`memory_chunks`

- `id uuid primary key`
- `tenant_id uuid not null`
- `source_type text not null`
- `source_id uuid not null`
- `chunk_text_ciphertext text not null`
- `redacted_chunk_text text not null`
- `embedding vector(1536)`
- `metadata jsonb not null`
- `sensitivity text not null`
- `policy_version text not null`

Indexes: IVFFlat or HNSW on `embedding`, GIN on `metadata`, `(tenant_id, source_type)`.

`retrieval_runs`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `intent text not null`
- `normalized_query_hash text not null`
- `indices_used text[] not null`
- `filters jsonb not null`
- `reranker_version text`
- `result_ids text[] not null`
- `rejected_result_ids text[]`
- `latency_ms integer not null`
- `policy_version text not null`

`policy_versions`

- `id uuid primary key`
- `policy_type text not null`
- `version text not null`
- `body jsonb not null`
- `status text not null`
- `effective_at timestamptz not null`

`async_jobs`

- `id uuid primary key`
- `tenant_id uuid not null`
- `user_id uuid references users(id)`
- `job_type text not null`
- `status text not null`
- `idempotency_key text not null`
- `input_hash text not null`
- `result_ref_id uuid`
- `error_code text`
- `queued_at timestamptz not null`
- `started_at timestamptz`
- `finished_at timestamptz`

Unique index: `(tenant_id, idempotency_key)`.

`audit_events`

- `id uuid primary key`
- `tenant_id uuid not null`
- `actor_user_id uuid`
- `event_type text not null`
- `target_type text not null`
- `target_id text not null`
- `payload_hash text not null`
- `payload_ciphertext text`
- `prev_hash text`
- `chain_hash text not null`
- `occurred_at timestamptz not null`

Indexes: `(tenant_id, occurred_at desc)`, `(tenant_id, target_type, target_id)`.

## Multi-Index RAG Design

### Collections

`deterministic_kb`

- Rules, aspect interpretations, scoring policy, math documentation, fallback templates.
- Lower sensitivity; versioned by policy.
- Used for explaining chart math and score policy.

`user_memory`

- Decisions, retrospectives, notes, outcomes, playbooks.
- Highest sensitivity.
- Tenant and user filtered.

`relationship_memory`

- Pairwise collaboration annotations, sprint retrospectives, friction/support events.
- Requires consent or owner authorization.

`calendar_metadata`

- Meeting type, participant hashes, time blocks, duration, density, outcomes.
- No raw content by default.

### Retrieval Pipeline

1. Normalize request and assign `request_id`.
2. Run prompt-injection and PII checks on user query and supplied notes.
3. Intent classifier chooses one or more retrieval collections.
4. Policy resolver loads tenant policy, sensitivity allowance, retention class, and model policy version.
5. Metadata filters apply tenant, user, relationship consent, date window, tags, and sensitivity.
6. Hybrid retrieval runs vector search plus lexical fallback.
7. Recency and outcome-aware ranker boosts recent, high-signal, outcome-confirmed records.
8. Cross-encoder reranker orders top-k candidate passages.
9. Evidence packer limits tokens, deduplicates sources, and labels passage IDs.
10. Citation verifier requires each generated claim to map to a passage ID or deterministic calculation ID.
11. Unsupported synthesis is rejected. The system either regenerates with stricter context or falls back to deterministic-only mode.
12. Retrieval run is written to `retrieval_runs` with filters, indices, rejected IDs, policy version, and latency.

### Guardrails

- LLM never receives raw calendar content by default.
- Retrieved content is treated as untrusted input.
- Indirect prompt injection markers are stripped or quarantined.
- Claims about dates, scores, planets, and windows must cite deterministic calculation IDs.
- Claims about user history must cite memory passage IDs.
- Claims about collaboration patterns must cite relationship passage IDs.
- Compliance-sensitive workflows disable semantic caching.

## Redis Keyspace and Caching Plan

Redis is segmented by prefix, tenant, environment, and sensitivity. Use separate logical databases or clusters for high-sensitivity production deployments when operationally feasible.

### Key Prefixes

`chart:exact:{tenant_id}:{chart_hash}:{policy_version}`

- Exact deterministic chart output.
- TTL: 24h.
- Safe because key includes chart hash and policy version.

`transit:exact:{tenant_id}:{chart_hash}:{window_hash}:{policy_version}`

- Deterministic transit windows.
- TTL: 24h for stable windows, shorter for live dashboards.

`rag:result:{tenant_id}:{query_hash}:{indices_hash}:{model}:{policy_version}`

- Retrieval result IDs and scores only.
- TTL: 15m.

`semantic:advice:{tenant_id}:{intent_hash}:{risk}:{model}:{policy_version}`

- Low-risk advisory summaries only.
- TTL: 5m to 30m depending on risk.
- Disabled for audit mode, compliance-sensitive, authoritative, or user-specific high-risk output.

`calendar:agg:{tenant_id}:{user_id}:{window_hash}:{policy_version}`

- Aggregated metadata only.
- TTL: 5m.

`policy:config:{tenant_id}:{policy_type}:{version}`

- Policy/config cache.
- TTL: 1h.

`rate:{tenant_id}:{user_or_ip}:{bucket}:{window}`

- Sliding-window or token-bucket rate limiting.
- TTL: bucket window plus grace.

`job:status:{tenant_id}:{job_id}`

- Async job progress and status.
- TTL: 24h after completion, 7d for audit export jobs.

`presence:{tenant_id}:{session_id}`

- WebSocket/session presence.
- TTL: 30s heartbeat.

`pubsub:insights:{tenant_id}:{user_id}`

- Live insight updates.
- Pub/sub channel, no persistence.

`idem:{tenant_id}:{idempotency_key}`

- Idempotency lock/result reference.
- TTL: 10m for recommendations, 24h for forecast jobs.

`oauth:state:{tenant_id}:{state_hash}`

- Calendar OAuth state and PKCE verifier.
- TTL: 10m.

### Cache Safety Rules

- Never semantic-cache audit-mode outputs.
- Never semantic-cache user-specific compliance-sensitive advice.
- Never cache OAuth tokens outside encrypted durable storage.
- Never use Redis as the only source for decisions, outcomes, audit logs, or policy versions.
- Include policy version in every cache key that can affect output.
- Include model version in every AI or retrieval cache key.
- Invalidate memory and relationship retrieval caches after decision outcome, relationship annotation, or consent changes.

## Outcome Learning Loop

The loop learns from feedback and outcomes without altering deterministic math.

Inputs:

- Recommendation feedback.
- Selected action.
- Decision retrospective.
- Calendar outcome metadata.
- Relationship event outcomes.

Tunable outputs:

- Retrieval ranking weights.
- Advisory score calibration.
- Playbook promotion thresholds.
- Confidence calibration.
- Recommended action templates.

Non-tunable outputs:

- Planet positions.
- Aspect detection.
- Orb calculation.
- Deterministic calculation IDs.
- Policy versions already used in audit records.
