# ADR 0005: Calendar Data Minimization Policy

## Status

Accepted

## Date

2026-05-30

## Context

Calendar data can contain sensitive titles, descriptions, participants, locations, and attachments. COSMIQ needs scheduling context but does not need raw event content by default.

## Options Considered

- Store full calendar event content.
- Store only derived metadata by default.
- Do not integrate calendars.

## Decision

Store calendar metadata by default: time blocks, duration, meeting type, participant hashes, density, and optional outcome labels. Do not store raw titles, descriptions, locations, attendees, or attachments unless explicit opt-in is added later.

## Trade-Offs

- Metadata-only storage may reduce recommendation detail.
- Privacy posture is stronger and easier to explain.
- Users can still get scheduling and density insights.

## Security Impact

- Reduces breach impact.
- Simplifies retention and deletion.
- Requires encrypted OAuth tokens and consent logging.

## Operational Impact

- Calendar aggregation must classify events without persisting raw content.
- Provider token refresh and disconnect flows must be monitored.
- Cache TTL for calendar aggregation is 5m.

## Consequences

Calendar recommendations must state when they are based on metadata only. Raw content features require a new ADR and explicit user consent.

## Rollback/Superseding Path

If raw content becomes required, this ADR must be superseded with a stricter consent, encryption, retention, and redaction policy.
