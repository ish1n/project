# ADR 0007: Async Forecast Workflow Design

## Status

Accepted

## Date

2026-05-30

## Context

Forecasts, collaboration heatmaps, scenario comparisons, calendar aggregation, embeddings, and audit exports can exceed normal request latency budgets. Synchronous execution would create poor UX and increase timeout risk.

## Options Considered

- Run all computations synchronously.
- Use background tasks inside the API process.
- Use a dedicated worker queue with durable job records and Redis job state.

## Decision

Use a dedicated worker queue. FastAPI creates durable `async_jobs` rows and Redis job status entries. Workers process jobs with idempotency keys and write final results to PostgreSQL.

## Trade-Offs

- Requires worker deployment and queue monitoring.
- Adds eventual consistency.
- Improves latency and reliability for long-running tasks.

## Security Impact

- Job payloads must be scoped by tenant and user.
- Workers must not bypass authorization assumptions in persisted inputs.
- Idempotency prevents replay and duplicate execution.

## Operational Impact

- Requires queue lag, retry, dead-letter, and job age dashboards.
- Requires job status TTL policy.
- Requires runbooks for stuck jobs.

## Consequences

Frontend should show queued, running, complete, failed, and stale states. Forecast APIs should return `202 Accepted` when computation is not ready.

## Rollback/Superseding Path

If queue complexity is too high early, limited non-sensitive jobs can run synchronously behind strict timeouts, but production forecast workflows should stay async.
