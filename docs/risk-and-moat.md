# COSMIQ Risk Register and Product Moat

## Risk Register

| Risk | Probability | Impact | Detection Signal | Mitigation | Owner | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| LLM generates unsupported claims | Medium | High | Citation verifier failure, user reports | Claim mapping, strict JSON schema, deterministic fallback | Jatin | Remove synthesis and show math-only output |
| Cross-tenant vector leak | Low | Critical | Retrieval run with tenant mismatch | Mandatory tenant filters, RLS, tests | Jatin | Disable retrieval service |
| Calendar overcollection | Medium | High | Data classification scan finds raw content | Metadata-only default, explicit opt-in, deletion | Jatin | Disconnect provider and purge metadata |
| Redis serves stale policy output | Medium | Medium | Policy mismatch in response | Versioned cache keys, invalidation | Jatin | Bypass Redis for recommendations |
| Relationship analysis feels too speculative | Medium | Medium | Low usefulness feedback | Evidence thresholds, confidence display, deterministic fallback | Ishan | Hide low-confidence synthesis |
| Prompt injection via notes | High | High | Injection classifier hit | Sanitize, quarantine, untrusted evidence labeling | Jatin | Exclude suspicious memory chunk |
| Reranker latency exceeds budget | Medium | Medium | Retrieval p95 alert | Timeout, lexical/vector fallback, smaller candidate set | Jatin | Skip reranker with confidence warning |
| Forecast worker backlog | Medium | Medium | Queue lag alert | Idempotency, scaling workers, job priority | Jatin | Return stale previous forecast |
| UI overwhelms users | Medium | Medium | Drop-off, support feedback | Progressive disclosure, explainability tabs | Ishan | Default to summary with expandable evidence |
| Audit export incomplete | Low | High | Export validation failure | Manifest and hash checks | Jatin | Block export and alert admin |
| Model/provider outage | Medium | Medium | Provider error rate | Deterministic-only mode, provider abstraction | Jatin | No-AI recommendations |
| Security key rotation breaks decrypt | Low | Critical | Decrypt error spike | Key versioning, staged rotation tests | Jatin | Pause writes, restore previous key version |
| Outcome learning corrupts deterministic core | Low | High | Policy diff tries to alter math | Hard architectural boundary | Jatin | Disable learning jobs |
| PWA offline state misleads user | Medium | Medium | Stale data warnings missing | Staleness badges, no offline AI actions | Ishan | Read-only offline mode |

## Unique Product Moat

COSMIQ is stronger than a generic RAG app because it has a deterministic signal engine at the center. Retrieval and generation do not float freely over documents; they are anchored to chart calculations, aspect math, policy versions, calendar metadata, and historical outcomes.

COSMIQ is stronger than ordinary astrology apps because it does not sell mystical content. It converts geometry into auditable operational context: when to review a decision, how to schedule a difficult conversation, what historical pattern resembles the current situation, and what evidence supports the suggestion.

COSMIQ is stronger than calendar assistants because it does not only optimize availability. It combines timing, relationship history, decision outcomes, user memory, and deterministic windows into explainable scheduling recommendations.

COSMIQ is stronger than productivity dashboards because it remembers outcomes. The system learns which recommendations helped, which patterns repeated, and which collaboration contexts produced friction or support.

Defensible advantages:

- Deterministic geometry as a structured signal, not content decoration.
- Multi-index RAG that separates rules, user memory, relationship history, and calendar metadata.
- Strict boundary between math and synthesis.
- Explainability console with deterministic math, retrieved evidence, confidence, and policy version.
- Outcome learning loop that tunes advisory behavior without corrupting the calculation core.
- Relationship-aware collaboration heatmaps.
- Scenario sandbox for operational planning.
- Enterprise audit mode with reproducible evidence chains.
- Redis-backed cache segmentation that supports performance without weakening privacy.
- Portfolio-ready architecture with ADRs, SLOs, threat model, and sprint ownership.

## Positioning Statement

COSMIQ is a decision intelligence platform that transforms deterministic temporal geometry, private memory, and collaboration history into explainable operational recommendations. Its moat is not the model; the moat is the evidence chain, the deterministic core, the outcome loop, and the product discipline around auditability.
