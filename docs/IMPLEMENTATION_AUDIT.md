# Implementation and security audit record

**Snapshot:** 2026-10-10. This file separates current source/test behavior from deployed Studionet behavior. See the [live release matrix](LIVE_RELEASE_MATRIX.md) for status and transaction links.

## Source changes in this review

- Issuer-bound `TEST_STATUS` policies now require a scope beneath the configured repository's GitHub Actions run API.
- An issuer-bound evidence round must contain exactly one canonical Actions run URL for `TEST_STATUS`; arbitrary issuer-attested prose, URLs, and multiple run records cannot satisfy that role.
- Validators check the issuer-committed Actions response bytes for run ID, completion, success, exact candidate head, repository, workflow path and push event. The recorded assurance is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`; redirect opacity prevents proving GitHub origin.
- Admission-critical web evidence now requires an exact on-chain issuer SHA-256 commitment for the sealed round. Missing commitments are not fetched; observed redirects and byte mismatches cannot support admission. Legacy uncommitted evidence fails closed and cannot advance the head.
- Policy assurance limits say that issuer wallets prove wallet control only, not organizational identity or independence. Unbound legacy test evidence is classified `ADOPTER_ASSERTED_CONTENT`.
- Direct Mode tests cover arbitrary issuer content, invalid scopes, Actions metadata mismatch, and adversarial registry snapshots consumed by the activation gate.

The hardened registry source was deployed byte-for-byte at `0x20193443d1E429e4984B118FF54DC77547b0fBCB` (SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`). The finalized-message gate is deployed at `0xCA9AAa4C18f51e3454ce50dE65c76e52F56C550D` (SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`). Current local commit and CI state are in the [live matrix](LIVE_RELEASE_MATRIX.md).

## Current live state

- Candidate `truss-actions-v012-candidate` on the replacement registry is `INSUFFICIENT_EVIDENCE`; its assessment ([transaction](https://explorer-studio.genlayer.com/tx/0x37b476904b211ca93a9367d4cebe3eca95d03bc34d6e423699152a745892df43)) lacked issuer commitment for the annotated tag-object response. A bounded retry can include that response; see the [live matrix](LIVE_RELEASE_MATRIX.md).
- The replacement gate's canonical reads are active candidate `""`, history `[]`, pending admission `{}`, pending acknowledgment `{}`.
- One unauthorized operator probe finalized `MAJORITY_AGREE` with leader execution `ERROR` at the authorization check ([transaction](https://explorer-studio.genlayer.com/tx/0x26c8cfef561df278f98a20745b4ec9918ea890e81cbaa9f1392b09b12f2fa903)); canonical state was unchanged.
- The production alias still uses the old production registry and gate; no frontend cutover has occurred.
- No positive registry-to-gate activation, finalized acknowledgment, or authorized invalid-candidate rejection has been proven. Direct Mode does not count as live evidence.

## Verification and security limits

- Direct Mode: 57 passed, including redirect/source-substitution rejection, finalized-message consumer cases, and committed annotated-tag object verification.
- The three activation receipts were inspected: leader node/model pairs were `5528/policy:prd-qwen`, `5521/policy:prd-sonnet`, and `5525/policy:prd-grok`; each reports the same 600-second leader execution timeout.
- `genlayer trace` cannot retrieve traces because Studionet RPC returns `-32601 Method not found` for `gen_dbg_traceTransaction`.
- `genlayer appeal-bond` is unsupported by the configured chain because the SDK cannot resolve fee-manager and rounds-storage addresses. No appeal was submitted.
- The finalized-message primitive succeeded on Studionet; the old `LATEST_FINAL` failure is not currently the reason this candidate is blocked. Candidate evidence needs a new issuer-attested round, and the frozen designated signer keys are not unlocked in the current OS keychain.
- Actions-shaped metadata is issuer-committed content and is not proof of GitHub origin, independent workflow authorship, test design, or test quality. Distinct issuer wallets do not establish organizational independence.
- The pinned `gl.nondet.web.get` interface does not expose redirect controls or final origin. Content commitments prevent unapproved body substitution but do not prove the remote origin.

The mandatory live activation and authorized invalid-candidate rejection proofs remain outstanding. Production remains on the existing safe configuration. The historical `LATEST_FINAL` reproduction remains filed with [GenLayer issue #60](https://github.com/genlayerlabs/genvm-manager/issues/60); the message-based flow has an independent successful primitive test but not yet a complete TRUSS lifecycle proof.
