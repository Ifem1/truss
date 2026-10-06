# Evidence Model

TRUSS uses role-bound evidence.

## Roles

- RELEASE_IDENTITY
- TEST_STATUS
- CHANGE_DISCLOSURE
- SECURITY_STATUS
- MIGRATION_GUIDE
- PROVENANCE

A policy selects mandatory roles and accepted host/path scopes per role.

## Principles

- HTTPS only.
- Canonical host/path.
- No userinfo or port ambiguity.
- No dot segments.
- No query/fragment ambiguity in V1.
- Prefer immutable commit-pinned repository content.
- Bound each source and aggregate bytes.
- Store HTTP status and SHA-256 provenance from actual fetched bytes.
- Do not claim a content digest proves the source is truthful.
- Validator classifications are bounded to frozen roles and policy criteria; the contract derives the four outcomes deterministically.
- If one required role has both SUPPORTS and CONTRADICTS classifications, the result is `CONFLICTING_EVIDENCE`. Contradiction without support is `REJECTED`; missing or neutral-only required evidence is insufficient.
- Non-2xx, empty, oversized and failed retrievals cannot support a role.

## Retrieval limitation

The pinned GenLayer SDK interface used by the contract does not expose a redirect-disable option. The contract rejects a response that is observed as 3xx, but cannot prove that a final 2xx response was not reached through an automatically followed redirect. This is an unresolved evidence-scope limitation. Prefer immutable commit-pinned sources and treat redirect-sensitive host scopes as unsuitable until the SDK exposes verifiable redirect behavior.

Validators must agree on each fetched source's HTTP status and full-content SHA-256; changed content between validator fetches blocks the assessment. Agreed commitments are passed through consensus and stored without a post-consensus refetch, avoiding a mutable-URL time-of-check/time-of-use mismatch. If a mutable source keeps changing, the candidate remains open for reassessment and no finalized attempt is stored until validators agree.

## Retry

Insufficient/conflicting evidence permits another complete role-bound evidence round. Old rounds remain inspectable.
