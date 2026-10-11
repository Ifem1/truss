# Implementation and security audit record

**Snapshot:** 2026-10-11. This file separates current source/test behavior from deployed Studionet behavior. See the [live release matrix](LIVE_RELEASE_MATRIX.md) for status and transaction links.

## Source changes in this review

- Issuer-bound `TEST_STATUS` policies now require a scope beneath the configured repository's GitHub Actions run API.
- An issuer-bound evidence round must contain exactly one canonical Actions run URL for `TEST_STATUS`; arbitrary issuer-attested prose, URLs, and multiple run records cannot satisfy that role.
- Validators check the issuer-committed Actions response bytes for run ID, completion, success, exact candidate head, repository, workflow path and push event. The recorded assurance is `ISSUER_COMMITTED_GITHUB_ACTIONS_METADATA_ONLY`; redirect opacity prevents proving GitHub origin.
- Admission-critical web evidence now requires an exact on-chain issuer SHA-256 commitment for the sealed round. Missing commitments are not fetched; observed redirects and byte mismatches cannot support admission. Legacy uncommitted evidence fails closed and cannot advance the head.
- Policy assurance limits say that issuer wallets prove wallet control only, not organizational identity or independence. Unbound legacy test evidence is classified `ADOPTER_ASSERTED_CONTENT`.
- Direct Mode tests cover arbitrary issuer content, invalid scopes, Actions metadata mismatch, and adversarial registry snapshots consumed by the activation gate.

The hardened registry source was deployed byte-for-byte at `0x20193443d1E429e4984B118FF54DC77547b0fBCB` (SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`). The finalized-message gate is deployed at `0xCA9AAa4C18f51e3454ce50dE65c76e52F56C550D` (SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`). Current local commit and CI state are in the [live matrix](LIVE_RELEASE_MATRIX.md).

## Current live state

- The replacement hardened registry is deployed at `0x20193443d1E429e4984B118FF54DC77547b0fBCB`, byte-matched to SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`. The existing compatible gate at `0xCA9AAa4C18f51e3454ce50dE65c76e52F56C550D` is byte-matched to SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`.
- On a separate throwaway lineage, the same registry source completed a live GitHub-backed flow. The candidate finalized `ADMITTED`; the registry emitted a finalized gate admission; the configured operator activated it; and the gate emitted a finalized acknowledgment. Parent/child receipts and canonical poststate are linked in [the live release matrix](LIVE_RELEASE_MATRIX.md).
- The authorized invalid-candidate call rolled back with `candidate has no matching finalized admission`; the non-operator call rolled back with `only configured operator may activate`. Both finalized with majority agreement and canonical gate state remained unchanged.
- The original frozen lineage remains retryable after one `INSUFFICIENT_EVIDENCE` assessment. The missing tag-object endpoint is outside the frozen `RELEASE_IDENTITY` path scope, so the required issuer commitment cannot be appended under this policy. The designated publisher and issuer accounts are locally unlocked and funded; signer access is not the blocker. No test wallet was used in this lineage.
- Production frontend configuration remains on its existing registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. No production cutover was made to throwaway authority.
## Verification and security limits

- Direct Mode: 57 passed; unit tests: 2 passed; contract lint/validation: all seven contracts passed; TypeScript: passed; production build: passed; Playwright browser tests: 16 passed. Browser tests use fixture RPC and do not replace live evidence.
- Historical LATEST_FINAL diagnostic writes timed out as documented in `STUDIONET_CROSS_CONTRACT_ISSUE.md`. The finalized-message mechanism now succeeds for actual TRUSS admission and acknowledgment.
- `genlayer trace` cannot retrieve traces because Studionet RPC returns `-32601 Method not found` for `gen_dbg_traceTransaction`.
- `genlayer appeal-bond` is unsupported by the configured chain because the SDK cannot resolve fee-manager and rounds-storage addresses. No appeal was submitted.
- The production-lineage candidate has one of three assessment attempts and one of three evidence rounds recorded. The first assessment is `INSUFFICIENT_EVIDENCE`; two attempts and two rounds remain, but the required annotated tag-object URL is outside the frozen policy authority scope. A new policy/candidate would change the requested frozen production lineage and was not created. One publisher-authorized append attempt [rolled back on-chain](https://explorer-studio.genlayer.com/tx/0x038351323b93ad1d039edada03fcefd45e3b7e55ad6cbd3e6f3867c35bd643c5) with `evidence URL is outside the role's allowed scope`; canonical candidate/head state remained unchanged. The separate throwaway lineage proves the live message mechanism but does not authorize production cutover.
- Actions-shaped metadata is issuer-committed content and is not proof of GitHub origin, independent workflow authorship, test design, or test quality. Distinct issuer wallets do not establish organizational independence.
- The pinned `gl.nondet.web.get` interface does not expose redirect controls or final origin. Content commitments prevent unapproved body substitution but do not prove the remote origin.

Live activation, acknowledgment, and authorized invalid-candidate rejection are proven on the throwaway test lineage. The production pair is deployed, but the production candidate cannot be retried under its frozen evidence scope and production has not been activated. The frontend remains on its existing configuration. The historical `LATEST_FINAL` reproduction remains filed with [GenLayer issue #60](https://github.com/genlayerlabs/genvm-manager/issues/60); the finalized-message implementation avoids that synchronous read path.
