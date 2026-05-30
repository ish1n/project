# ADR 0006: Encryption and Key Management Approach

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ stores sensitive decision text, relationship annotations, outcome notes, calendar tokens, and audit payloads. Database encryption at rest is necessary but insufficient because application-level compromise and backups remain risks.

## Options Considered

- Rely only on managed database encryption at rest.
- Use application-level field encryption with envelope encryption.
- Avoid storing sensitive text entirely.

## Decision

Use application-level field encryption for sensitive fields with envelope encryption backed by cloud KMS or equivalent. Store key version references with encrypted records. Keep redacted searchable text separate from encrypted originals.

## Trade-Offs

- Adds complexity to search, debugging, and migrations.
- Requires key rotation procedures.
- Reduces impact of database snapshot exposure.

## Security Impact

- Protects OAuth tokens, notes, outcomes, relationship annotations, and audit payloads.
- Enables per-tenant or per-environment data encryption keys.
- Requires strict secrets management and rotation.

## Operational Impact

- Decrypt errors need dashboards and alerts.
- Key rotation must be staged and reversible.
- Backups must preserve key version references.

## Consequences

Sensitive fields cannot be casually queried in plaintext. Retrieval uses redacted chunks and encrypted originals only when needed and authorized.

## Rollback/Superseding Path

This ADR can be superseded by a stronger customer-managed-key architecture or a dedicated secrets platform.
