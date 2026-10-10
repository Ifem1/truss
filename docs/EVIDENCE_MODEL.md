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

An issuer-bound policy additionally fixes one issuer wallet per required role. Each issuer signs a content-digest commitment in a separate on-chain transaction. The commitment is bound to the exact candidate, policy, coordinate, URL and evidence round. The round must be sealed before assessment. All roles use the same envelope; the role-specific source still has to substantiate its semantic claim, and an on-chain commitment does not establish the organization's identity or factual truth.

The policy records its assurance limits: issuer keys establish wallet control only; distinct addresses do not establish independent people or organizations. For issuer-bound `TEST_STATUS`, policy creation must authorize the repository's GitHub Actions API, and each round must contain exactly one canonical `/repos/{owner}/{repo}/actions/runs/{id}` URL. Arbitrary issuer-attested prose or other host content cannot fill this role. The `TEST_STATUS` assurance label is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY` and means the bytes were committed by the designated wallet and checked for expected fields, not that their HTTP origin was independently verified.

Issuer-bound assessment sends explicit `User-Agent` and GitHub media-type headers to the GitHub REST API. The Studionet probe showed that GenVM could access GitHub API endpoints with those headers; requests without them previously received HTTP 403. Canonical GitHub commit existence and release tag resolution are checked. A lightweight tag must point directly to the candidate commit; an annotated tag is dereferenced and its target must point to that commit.

For issuer-bound policies, each validator checks the issuer-committed Actions run body for the run ID, `completed` status, `success` conclusion, exact candidate `head_sha`, repository, `.github/workflows/ci.yml` path and `push` event. Because the SDK hides the final redirect URL, the contract cannot prove the body came directly from `api.github.com`; it proves only that the body matches the designated issuer's on-chain byte commitment and has the expected fields. The assurance label is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`. This does not prove GitHub origin, workflow independence, test design, test quality, or software security. Never call this an independently verified test result.

## Principles

- HTTPS only.
- Canonical host/path.
- No userinfo or port ambiguity.
- No dot segments.
- No query/fragment ambiguity in V1.
- Prefer immutable commit-pinned repository content.
- Bound each source and aggregate bytes.
- Require a valid on-chain issuer SHA-256 commitment before retrieving admission-critical evidence. Missing commitments and mismatching bodies are unavailable and cannot support admission.
- Store HTTP status and SHA-256 for retrieved bytes; agreement on byte identity does not establish the final HTTP origin.
- Do not claim a content digest proves the source is truthful.
- Validator classifications are bounded to frozen roles and policy criteria; the contract derives the four outcomes deterministically.
- If one required role has both SUPPORTS and CONTRADICTS classifications, the result is `CONFLICTING_EVIDENCE`. Contradiction without support is `REJECTED`; missing or neutral-only required evidence is insufficient.
- Non-2xx, empty, oversized and failed retrievals cannot support a role.

## Retrieval limitation

The pinned GenLayer SDK interface used by the contract does not expose a redirect-disable option or final response URL. The contract rejects observed 3xx responses and requires exact issuer-committed bytes for admission-critical fetches. A redirected response with different bytes fails the digest check; identical bytes retain the issuer's content commitment but do not prove the final origin. Uncommitted legacy evidence is unavailable to the assessment and cannot support an admission. The policy's assurance must describe issuer-authenticated content, not independently authenticated remote origin.

Validators must agree on each fetched source's HTTP status and full-content SHA-256; changed content between validator fetches blocks the assessment. Agreed commitments are passed through consensus and stored without a post-consensus refetch, avoiding a mutable-URL time-of-check/time-of-use mismatch. If a mutable source keeps changing, the candidate remains open for reassessment and no finalized attempt is stored until validators agree.

## Retry

Insufficient/conflicting evidence permits another complete role-bound evidence round. Old rounds remain inspectable.
