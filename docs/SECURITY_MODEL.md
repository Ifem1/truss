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
16. The registry emits a finalized admission notification containing the exact candidate, sequence, policy digest, commit and assessment digest. The gate authenticates the immutable registry address and frozen lineage/policy, enforces the next sequence and active predecessor, and permits only the designated operator to activate the pending admission. It emits a finalized acknowledgment; the registry will not queue another admission until that acknowledgment is received. There is no unconditional activation method.

## Evidence retrieval limits

The contract uses the pinned SDK's `gl.nondet.web.get(url, headers=...)` interface. GitHub REST calls include an explicit user agent and GitHub JSON media type; a finalized Studionet probe showed HTTP 200 for GitHub API, raw GitHub, jsDelivr and Actions API endpoints. An unqualified request previously returned 403 from GitHub API. The API does not expose a redirect-disable option or final response URL. TRUSS rejects observed 3xx responses and requires exact issuer-committed bytes for admission-critical evidence; missing commitments and digest mismatches are unavailable. Frozen evidence host/path scopes restrict which endpoints can be committed. A matching digest authenticates content to the designated issuer, not the final HTTP origin.

Sources are fetched again by each validator. Every validator must agree on each source's HTTP status and full-content SHA-256 as well as on the bounded classifications. A mutable source that changes between validator fetches blocks that assessment instead of letting one validator's bytes stand for all. Once consensus succeeds, the contract carries the agreed retrieval commitments forward instead of refetching mutable URLs. The digest commits to fetched bytes but does not establish who published the source or whether its claims are true.

The Direct Mode suite now runs against the installed `genlayer-test` harness with no skipped cases. Its local fixtures are synthetic and do not establish production evidence or Studionet behavior.

## Issuer-bound policies

An adopter can freeze a separate publisher address and one designated issuer address per required evidence role. The publisher wallet alone opens candidates. Each issuer submits a transaction attesting the SHA-256 digest of one frozen URL's exact bytes for a particular candidate coordinate, policy digest and evidence-round digest. The bundle can be sealed by any caller only after every required role has its attestation. Assessment of an unsealed round fails. A validator fetch that differs from an issuer's committed digest is unusable for admission. Old policy creation remains available as a legacy self-declared mode and has no issuer-authentication claim.

These transactions authenticate control of the designated wallet at submission time. The adopter selects the addresses, so they do not prove that distinct wallets have independent owners or that the attested content is factually true. The application displays that trust assumption. For `TEST_STATUS`, validators check the issuer-committed body for completion, success, exact commit, repository, workflow path and push event. The SDK's redirect opacity means this is not proof that the body originated at GitHub. The recorded assurance is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`; repository maintainers still control workflow content and test quality. Issuer-bound policies still need external governance of issuer identities before being described as third-party verified.

Issuer-bound `TEST_STATUS` is now restricted to one canonical Actions run API resource for the configured repository and cannot be supplied as arbitrary issuer-attested prose. The recorded assurance is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`; the protocol does not prove GitHub origin, independent workflow authorship, test design, or test quality. Legacy unbound policies are explicitly classified as adopter-asserted content and cannot admit without issuer commitments.

## Remaining authentication boundary

Policy-selected URL scopes are adopter assertions. A URL and a SHA-256 digest do not prove GitHub repository membership, CI authority or true independence. Legacy issuer-bound mode authenticates the submitting wallet through a GenLayer transaction but does not verify an external signature or organizational identity. Its GitHub API provenance checks remain diagnostic and cannot satisfy the authenticated provenance gate. The separate signed-manifest mode verifies a policy-frozen RSA signature and exact candidate bindings and can admit when those checks pass, but it still does not establish the signer's human or organizational identity. The pinned web API also hides the final redirect origin. Existing finalized records remain historical and are not changed. See [Independent provenance gate](INDEPENDENT_PROVENANCE_REQUIREMENTS.md) for the external signed credential and verifier requirements. Legacy adopter-asserted policy mode remains a separate, lower-assurance trust model and must not be described as independently authenticated.

The original frozen policy permits `RELEASE_IDENTITY` only below `/repos/Ifem1/truss/git/ref/tags/`; it remains unchanged as historical policy state. The production successor policy preserves the same lineage, repository, publisher, issuer roles and admission criteria while allowing the exact GitHub tag-ref and annotated-tag-object scopes plus the canonical Actions-run API scope. Policy creation and issuer commitments remain immutable and SHA-256-bound. The policy editor validates those exact evidence routes in both structured and Advanced JSON inputs before a wallet transaction. Issuer wallet control still does not prove organizational independence, GitHub Actions API metadata does not independently establish workflow authorship or test quality, and SDK-observed response bytes cannot establish the final redirect origin.

The policy-authoring UI now checks the exact canonical tag-ref, annotated-tag-object and Actions-run API URLs against the selected repository and configured role scopes before enabling publication. It applies the same preflight to Advanced JSON and repeats the check immediately before requesting the wallet signature. This is a usability guard only; the registry remains authoritative and validates submitted evidence scopes on-chain.
