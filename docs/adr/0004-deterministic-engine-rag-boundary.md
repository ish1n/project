# ADR 0004: Deterministic Engine Plus RAG Synthesis Boundary

## Status

Accepted

## Date

2026-05-30

## Context

COSMIQ combines deterministic chart calculations with AI-generated explanations. Without a strict boundary, the LLM could invent planetary positions, scores, windows, evidence, or historical patterns.

## Options Considered

- Let the LLM calculate and explain everything.
- Use deterministic services for math and LLM only for synthesis.
- Avoid LLMs and use templates only.

## Decision

Use deterministic services for chart math, aspects, scores, windows, and stable facts. Use RAG to retrieve evidence. Use the LLM only to synthesize explanations and action suggestions from deterministic facts and retrieved evidence.

## Trade-Offs

- Requires more engineering than prompt-only generation.
- Reduces flexibility in generated output.
- Provides auditability and user trust.

## Security Impact

- Limits hallucination blast radius.
- Prevents model-generated factual calculations.
- Enables citation verification and deterministic-only fallback.

## Operational Impact

- Requires policy versioning for deterministic calculations.
- Requires output validation and claim mapping.
- Requires audit storage for calculation IDs and evidence IDs.

## Consequences

LLM output is advisory. If citations fail, the system retries with stricter context or falls back to deterministic-only output.

## Rollback/Superseding Path

This ADR should only be superseded if COSMIQ removes LLM synthesis or replaces it with a formally verified rules engine.
