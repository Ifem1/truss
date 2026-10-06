# State Machine

Candidate starts `OPEN`.

Assessment produces:

- `ADMITTED` — terminal, advances lineage only if predecessor is still current.
- `REJECTED` — terminal, never advances lineage.
- `INSUFFICIENT_EVIDENCE` — retryable while limits remain.
- `CONFLICTING_EVIDENCE` — retryable while limits remain.

A retryable result returns to `OPEN` only by appending a new immutable evidence round.

A candidate whose predecessor becomes stale must fail closed and never advance the head.
