# Implementation and security audit record

**Snapshot:** 2026-10-11. This record distinguishes local tests, live Studionet proofs, and trust limitations. Transaction-level production evidence is in the [live release matrix](LIVE_RELEASE_MATRIX.md).

## Source changes in the closeout

- Policy authoring checks canonical GitHub tag-ref, annotated-tag-object and Actions-run API URLs against the selected repository and configured role scopes. The preflight covers structured and Advanced JSON inputs and runs again before requesting the wallet signature. Publication is disabled when a required URL is outside its role scope.
- Direct Mode regression coverage verifies frozen-scope rejection and the successor-policy shape. Playwright verifies that Advanced JSON cannot bypass the scope preflight.
- Issuer-bound `TEST_STATUS` requires an Actions run endpoint, exactly one canonical run URL, exact issuer-committed response bytes, and checks run ID, completion, success, candidate head, repository, workflow path and push event. Arbitrary issuer-attested content cannot claim independently verified test results.
- Admission-critical evidence must have an on-chain issuer SHA-256 commitment bound to the sealed candidate round. Missing commitments are not fetched; observed redirects and byte mismatches cannot support admission. Legacy uncommitted evidence fails closed.
- Policy assurance labels establish issuer wallet control only. They do not establish issuer identity or organizational independence.

## Production Studionet state

- Registry `0x20193443d1E429e4984B118FF54DC77547b0fBCB`, source SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`, byte-for-byte match. The registry was not redeployed for closeout.
- Production gate `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b`, source SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`, byte-for-byte match; frozen to the successor policy and production lineage.
- Candidate `truss-actions-v012-candidate-successor` finalized `ADMITTED`. The finalized registry admission reached the gate, designated operator activation succeeded, and the finalized acknowledgment child was accepted. Canonical registry head and gate active candidate agree; registry pending activation is empty. The gate's pending acknowledgment view retains a retry/outbox record with retry count 0 after delivery; the registry acknowledgment history confirms delivery.
- Live production negative calls for an unadmitted candidate and unauthorized operator finalized with majority agreement, returned contract authorization errors, and left gate state unchanged.
- Vercel production uses the verified pair. Public bundle and actual browser checks are recorded in [LIVE_RELEASE_MATRIX.md](LIVE_RELEASE_MATRIX.md).

## Verification

Closeout at source commit `a041b6b90414b65214cf5fe8c931e70c5541580c`: preflight PASS; repository-local GenLayer CLI 0.39.1 PASS; lint and semantic validation PASS for seven contracts; Direct Mode 58/58; unit tests 2/2; TypeScript typecheck PASS; production build PASS; Playwright 18/18. Production browser checks covered five public routes at 320/390/768/1024/1440 px; the live dossier showed the admitted candidate and confirmed acknowledgment, with no page errors or horizontal overflow. GitHub Actions passed on this source commit: [run 38183133088](https://github.com/Ifem1/truss/actions/runs/38183133088).

## Limits and historical findings

- The historical synchronous cross-contract `LATEST_FINAL` write timed out after 600 seconds in the isolated probe. The current finalized-message implementation avoids that call path and has a successful live production lifecycle; it does not claim the earlier behavior was fixed.
- The original frozen policy and its `INSUFFICIENT_EVIDENCE` candidate remain immutable history. A successor policy and fresh candidate completed production admission.
- The tag is unsigned. Issuer organizational independence is not established. GitHub Actions metadata is issuer-committed metadata, not independent proof of workflow authorship, test quality or software security.
- The pinned `gl.nondet.web.get` interface does not expose final redirect origin. TRUSS limits admission-critical sources to canonical GitHub API endpoint shapes and role scopes, binds exact bytes through issuer commitments, and validates endpoint-specific provenance fields. The final network origin is not directly observable.
- Studionet trace retrieval remains unsupported by the configured RPC (`-32601 Method not found` for `gen_dbg_traceTransaction`).
