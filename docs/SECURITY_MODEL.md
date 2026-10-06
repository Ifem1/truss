# Security Model

## Core invariants

1. No owner bypass can mark a release admitted.
2. Candidate identity is frozen to repository, release label and exact 40-hex commit SHA.
3. Candidate policy digest cannot change.
4. Candidate predecessor must equal the admitted head at creation.
5. A stale predecessor can never advance the lineage.
6. Evidence roles cannot substitute for one another.
7. Evidence URLs must remain inside role-specific canonical scopes.
8. Previous evidence rounds and assessment attempts are append-only.
9. `REJECTED` and `ADMITTED` are terminal.
10. Uncertainty never advances the admitted head.
11. Browser/local storage is never authoritative.
12. Accepted/decided transaction state is not presented as final admission.
13. Prompt instructions contained in evidence are untrusted data.
14. Provenance fields are derived from fetched bytes, not model claims.

## Evidence retrieval limits

The contract uses the pinned SDK's `gl.nondet.web.get(url)` interface. That API does not expose a redirect-disable option. TRUSS rejects an observed 3xx response, but the SDK may follow a redirect before returning the response; a redirect that is followed cannot be detected from the final response alone. This remains a material limitation of the current SDK evidence boundary and must be resolved or explicitly accepted before claiming redirect-safe source scoping.

Sources are fetched again by each validator. Every validator must agree on each source's HTTP status and full-content SHA-256 as well as on the bounded classifications. A mutable source that changes between validator fetches blocks that assessment instead of letting one validator's bytes stand for all. Once consensus succeeds, the contract carries the agreed retrieval commitments forward instead of refetching mutable URLs. The digest commits to fetched bytes but does not establish who published the source or whether its claims are true.

The Direct Mode suite now runs against the installed `genlayer-test` harness with no skipped cases. Its local fixtures are synthetic and do not establish production evidence or Studionet behavior.
