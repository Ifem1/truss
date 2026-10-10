# Implementation and security audit record

**Snapshot:** 2026-10-10. This file separates current source/test behavior from deployed Studionet behavior. See the [live release matrix](LIVE_RELEASE_MATRIX.md) for status and transaction links.

## Source changes in this review

- Issuer-bound `TEST_STATUS` policies now require a scope beneath the configured repository's GitHub Actions run API.
- An issuer-bound evidence round must contain exactly one canonical Actions run URL for `TEST_STATUS`; arbitrary issuer-attested prose, URLs, and multiple run records cannot satisfy that role.
- Validators check the issuer-committed Actions response bytes for run ID, completion, success, exact candidate head, repository, workflow path and push event. The recorded assurance is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`; redirect opacity prevents proving GitHub origin.
- Admission-critical web evidence now requires an exact on-chain issuer SHA-256 commitment for the sealed round. Missing commitments are not fetched; observed redirects and byte mismatches cannot support admission. Legacy uncommitted evidence fails closed and cannot advance the head.
- Policy assurance limits say that issuer wallets prove wallet control only, not organizational identity or independence. Unbound legacy test evidence is classified `ADOPTER_ASSERTED_CONTENT`.
- Direct Mode tests cover arbitrary issuer content, invalid scopes, Actions metadata mismatch, and adversarial registry snapshots consumed by the activation gate.

These are source changes only until deployed with a byte-matched contract. Prior PR #3 CI does not cover this redirect guard; the local suite passes, while GitHub Actions for this branch is pending. The deployed registry at `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` predates the issuer and redirect hardening.

## Current live state

- The deployed registry's candidate `truss-actions-v012-candidate` is `ADMITTED`; its tag and successful GitHub Actions run were verified by the deployed source. The canonical admitted-head read returns that candidate.
- The activation gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6` still returns an empty active candidate and `[]` activation history.
- Three activation calls finalized `NO_MAJORITY`. Each receipt records a distinct leader's `LEADER_EXEC_TIMEOUT` after 600 seconds, with zero votes committed/revealed. These are consensus execution timeouts, not successful TRUSS contract rejections.
- The fourth invalid-candidate gate probe finalized with `NO_MAJORITY` after a 600-second leader timeout. It did not reach TRUSS-level rejection and is not a live rejection proof.
- The production alias now points to the final registry and gate and returned HTTP 200. The frontend cutover is complete, but it cannot truthfully show an active release while the gate state is empty.
- No live registry-to-gate activation lifecycle or live gate rejection has been proven. Do not present the Direct Mode hook tests as such evidence.

## Verification and security limits

- Direct Mode: 60 passed, including redirect/source-substitution rejection and 14 simulated cross-contract consumer cases.
- The three activation receipts were inspected: leader node/model pairs were `5528/policy:prd-qwen`, `5521/policy:prd-sonnet`, and `5525/policy:prd-grok`; each reports the same 600-second leader execution timeout.
- `genlayer trace` cannot retrieve traces because Studionet RPC returns `-32601 Method not found` for `gen_dbg_traceTransaction`.
- `genlayer appeal-bond` is unsupported by the configured chain because the SDK cannot resolve fee-manager and rounds-storage addresses. No appeal was submitted.
- Prior issuer hardening passed GitHub Actions in [PR #3](https://github.com/Ifem1/truss/pull/3); the present redirect change has not yet run on GitHub Actions and remains undeployed.
- Actions-shaped metadata is issuer-committed content and is not proof of GitHub origin, independent workflow authorship, test design, or test quality. Distinct issuer wallets do not establish organizational independence.
- The pinned `gl.nondet.web.get` interface does not expose redirect controls or final origin. Content commitments prevent unapproved body substitution but do not prove the remote origin.

The mandatory live activation and live invalid-candidate rejection proofs remain blocked by the minimal cross-contract `LATEST_FINAL` runtime failure. The repro is filed with [GenLayer issue #60](https://github.com/genlayerlabs/genvm-manager/issues/60). Do not submit speculative deployment or activation transactions until a minimal probe succeeds; the existing production addresses remain unchanged.
