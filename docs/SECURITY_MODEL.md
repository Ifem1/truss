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
15. Assessment initiation is permissionless and cannot supply replacement policy, release coordinates or evidence.
16. The release activation gate reads the configured registry's latest finalized state and checks exact head, lineage, repository, frozen policy digest, terminal admitted status and final admitted attempt before an operator may persist activation. It has no unconditional activation method.

## Evidence retrieval limits

The contract uses the pinned SDK's `gl.nondet.web.get(url)` interface. That API does not expose a redirect-disable option. TRUSS rejects an observed 3xx response, but the SDK may follow a redirect before returning the response; a redirect that is followed cannot be detected from the final response alone. This remains a material limitation of the current SDK evidence boundary and must be resolved or explicitly accepted before claiming redirect-safe source scoping.

Sources are fetched again by each validator. Every validator must agree on each source's HTTP status and full-content SHA-256 as well as on the bounded classifications. A mutable source that changes between validator fetches blocks that assessment instead of letting one validator's bytes stand for all. Once consensus succeeds, the contract carries the agreed retrieval commitments forward instead of refetching mutable URLs. The digest commits to fetched bytes but does not establish who published the source or whether its claims are true.

The Direct Mode suite now runs against the installed `genlayer-test` harness with no skipped cases. Its local fixtures are synthetic and do not establish production evidence or Studionet behavior.

## Issuer-bound policies

An adopter can freeze a separate publisher address and one designated issuer address per required evidence role. The publisher wallet alone opens candidates. Each issuer submits a transaction attesting the SHA-256 digest of one frozen URL's exact bytes for a particular candidate coordinate, policy digest and evidence-round digest. The bundle can be sealed by any caller only after every required role has its attestation. Assessment of an unsealed round fails. A validator fetch that differs from an issuer's committed digest is unusable for admission. Old policy creation remains available as a legacy self-declared mode and has no issuer-authentication claim.

These transactions authenticate control of the designated wallet at submission time. The adopter selects the addresses, so they do not prove that distinct wallets have independent owners or that the attested content is factually true. The application displays that trust assumption. Issuer-bound policies still need external governance of issuer identities before being described as third-party verified.

## Remaining authentication boundary

Policy-selected URL scopes are adopter assertions. A URL and a SHA-256 digest do not prove GitHub repository membership, CI authority or true independence. Issuer-bound mode authenticates the submitting wallet through a GenLayer transaction but does not verify an external signature or organizational identity. `ADMITTED` remains a decision under the adopter's frozen trust model. The consumer enforces that registry decision but cannot increase its provenance assurance. No new registry or consumer deployment should be represented as satisfying independent third-party provenance without external issuer governance and live proof.
