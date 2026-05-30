# ADR 0002: Redis Multi-Purpose Architecture and Cache Segmentation

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ needs Redis for deterministic chart caching, retrieval result caching, low-risk semantic caching, rate limits, job status, WebSocket presence, pub/sub, idempotency, OAuth state, and policy/config cache. These data classes have different sensitivity and freshness requirements.

## Options Considered

- Use one undifferentiated Redis keyspace.
- Use segmented key prefixes in one Redis deployment.
- Use separate Redis deployments for every function.

## Decision

Use explicit key segmentation with prefixes, tenant IDs, environment labels, policy versions, and TTLs. Start with one Redis deployment for simplicity, while preserving the option to split high-sensitivity or high-volume workloads later.

## Trade-Offs

- Prefix discipline must be enforced in code review and tests.
- One deployment is simpler and cheaper early.
- Segmentation makes future split-by-workload possible.

## Security Impact

- Prevents accidental semantic caching of sensitive outputs through explicit cache classes.
- Avoids storing durable secrets in Redis.
- Requires Redis private networking, authentication, and restricted access.

## Operational Impact

- Redis dashboards must track memory, evictions, hit rate, and command latency by key prefix.
- TTLs must be documented and tested.
- Cache invalidation must fire after memory, consent, policy, and calendar changes.

## Consequences

Every cache key that can affect output must include tenant, model when applicable, and policy version. Audit-mode, authoritative, user-specific high-risk, and compliance-sensitive outputs bypass semantic cache.

## Rollback/Superseding Path

If Redis saturation or sensitivity requires stronger isolation, split workloads into separate Redis clusters for cache, queue/job state, presence/pubsub, and rate limiting.
