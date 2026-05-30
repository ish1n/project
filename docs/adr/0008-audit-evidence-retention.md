# ADR 0008: Audit Logging and Evidence Retention Policy

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ promises explainable and auditable recommendations. Users and auditors need to reconstruct which math, evidence, policy, model, cache state, and fallback path produced an output.

## Options Considered

- Log only application events.
- Store complete raw prompts and outputs.
- Store structured evidence chains with hashes, policy versions, and encrypted sensitive payloads.

## Decision

Store structured audit events and evidence chains. Record calculation IDs, retrieval run IDs, evidence IDs, policy version, model version, output hash, cache decision, fallback mode, actor, target, and request ID. Encrypt sensitive payloads and use retention policy controls.

## Trade-Offs

- More storage and schema complexity.
- Less debugging convenience than raw prompt logging.
- Stronger privacy and reproducibility.

## Security Impact

- Reduces sensitive logging risk.
- Supports tamper detection through hash chaining.
- Requires export authorization and retention enforcement.

## Operational Impact

- Audit log write failures should fail closed for audit-mode actions.
- Export jobs require worker processing and manifest validation.
- Retention deletion must preserve compliance-safe tombstones where required.

## Consequences

Every recommendation must be reproducible by its recorded policy version and evidence references. Audit exports include manifests and hashes.

## Rollback/Superseding Path

This ADR can be superseded by immutable ledger storage or an external compliance archive if enterprise requirements increase.
