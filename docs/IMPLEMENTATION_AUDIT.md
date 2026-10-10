# Implementation and security audit record

**Snapshot:** 2026-10-10. This file separates current source/test behavior from deployed Studionet behavior. See the [live release matrix](LIVE_RELEASE_MATRIX.md) for status and transaction links.

## Source changes in this review

- Issuer-bound `TEST_STATUS` policies now require a scope beneath the configured repository's GitHub Actions run API.
- An issuer-bound evidence round must contain exactly one canonical Actions run URL for `TEST_STATUS`; arbitrary issuer-attested prose, URLs, and multiple run records cannot satisfy that role.
- Validators deterministically check run ID, completion, success, exact candidate head, repository, workflow path and push event. The policy and assessment record label this `GITHUB_ACTIONS_RUN_METADATA_ONLY`.
- Policy assurance limits say that issuer wallets prove wallet control only, not organizational identity or independence. Unbound legacy test evidence is classified `ADOPTER_ASSERTED_CONTENT`.
- Direct Mode tests cover arbitrary issuer content, invalid scopes, Actions metadata mismatch, and adversarial registry snapshots consumed by the activation gate.

These are source changes only until they are deployed with a byte-matched contract. The current source passed GitHub Actions CI in PR #3; the deployed registry at `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` predates these source changes.

## Current live state

- The deployed registry's candidate `truss-actions-v012-candidate` is `ADMITTED`; its tag and successful GitHub Actions run were verified by the deployed source. The canonical admitted-head read returns that candidate.
- The activation gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6` still returns an empty active candidate and `[]` activation history.
- Three activation calls finalized `NO_MAJORITY`. Each receipt records a distinct leader's `LEADER_EXEC_TIMEOUT` after 600 seconds, with zero votes committed/revealed. These are consensus execution timeouts, not successful TRUSS contract rejections.
- The fourth invalid-candidate gate probe finalized with `NO_MAJORITY` after a 600-second leader timeout. It did not reach TRUSS-level rejection and is not a live rejection proof.
- The production alias now points to the final registry and gate and returned HTTP 200. The frontend cutover is complete, but it cannot truthfully show an active release while the gate state is empty.
- No live registry-to-gate activation lifecycle or live gate rejection has been proven. Do not present the Direct Mode hook tests as such evidence.

## Verification and security limits

- Direct Mode: 55 passed, including 14 simulated cross-contract consumer cases.
- The three activation receipts were inspected: leader node/model pairs were `5528/policy:prd-qwen`, `5521/policy:prd-sonnet`, and `5525/policy:prd-grok`; each reports the same 600-second leader execution timeout.
- `genlayer trace` cannot retrieve traces because Studionet RPC returns `-32601 Method not found` for `gen_dbg_traceTransaction`.
- `genlayer appeal-bond` is unsupported by the configured chain because the SDK cannot resolve fee-manager and rounds-storage addresses. No appeal was submitted.
- The hardening changes passed GitHub Actions in [PR #3](https://github.com/Ifem1/truss/pull/3), including the latest documentation update. They still require deployment before they are live.
- GitHub's Actions API proves GitHub reports a successful run for the exact commit and workflow path. It does not prove independent workflow authorship, test design or test quality. Distinct issuer wallets do not establish organizational independence.
- The pinned `gl.nondet.web.get` interface does not expose redirect controls or verifiable final origin; redirect-origin claims remain unsupported.

The only completion criteria still outstanding are a finalized successful activation with canonical post-transaction gate reads and a finalized live rejection proof. Current RPC behavior prevents either proof; the exact receipt state is recorded in the matrix and manifest.
