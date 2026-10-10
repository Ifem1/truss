# State Machine

Candidate starts `OPEN`.

Assessment produces:

- `ADMITTED` — terminal, advances lineage only if predecessor is still current.
- `REJECTED` — terminal, never advances lineage.
- `INSUFFICIENT_EVIDENCE` — retryable while limits remain.
- `CONFLICTING_EVIDENCE` — retryable while limits remain.
- `EXHAUSTED` — terminal after a retryable third attempt or the final evidence round.
- `ABANDONED` — terminal by candidate owner, or by any caller after 30 days from opening.

A retryable result returns to `OPEN` only by appending a new immutable evidence round.

A candidate whose predecessor becomes stale must fail closed and never advance the head.

Any wallet may initiate an assessment of an `OPEN` candidate. The caller supplies only its key; the contract reads the frozen question and latest committed evidence round. An abandoned or exhausted candidate cannot be reopened. Candidate keys and release coordinates remain reserved. Under the same policy and predecessor, a commit SHA cannot be proposed again under another release label; a new attempt needs a new commit or a successor policy. An in-flight transaction is not canceled by a browser timeout. Contract execution order decides whether assessment or abandonment finalized first; the later operation sees the terminal state and fails.

Issuer-bound rounds begin unsealed. Designated issuers append exact-byte digests through signed transactions; any caller may seal after all required attestations are present. Only a sealed round may be assessed. The evidence round record remains immutable; attestations and the sealed-round marker are appended separately. A new evidence round after a retryable verdict repeats this process.
