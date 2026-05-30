# ADR 0003: Vector Retrieval Strategy

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ recommendations rely on deterministic knowledge, user memory, relationship history, and calendar metadata. A single flat vector index would increase leakage risk, reduce controllability, and make evidence quality harder to audit.

## Options Considered

- One flat vector collection for all content.
- Four logical retrieval collections in PostgreSQL with pgvector.
- External managed vector database with separate namespaces.

## Decision

Use a multi-index retrieval design with at least four collections: deterministic knowledge base, user memory, relationship index, and calendar/event metadata index. Store vectors in PostgreSQL with pgvector for initial production planning, with the option to move to a managed vector database if scale requires it.

## Trade-Offs

- Multi-index retrieval is more complex than a single vector search.
- PostgreSQL simplifies transactions, tenancy, and audit joins.
- External vector databases may outperform pgvector at larger scale but add another security and operational boundary.

## Security Impact

- Enforces tenant, user, consent, and sensitivity filters per collection.
- Reduces chance of cross-domain evidence mixing.
- Supports retrieval audit logs with explicit collection provenance.

## Operational Impact

- Requires vector index tuning and query latency monitoring.
- Requires retrieval quality metrics per collection.
- Requires backfill jobs when embedding models or chunking policies change.

## Consequences

The retrieval pipeline must include intent routing, hybrid retrieval, reranking, evidence packing, and citation verification. Generated claims must map to retrieved passage IDs or deterministic calculation IDs.

## Rollback/Superseding Path

This ADR can be superseded by a managed vector database decision if pgvector cannot meet latency, scale, or operational goals.
