# Live Studionet Test Plan

Target is Studionet chain `61999` only.

## Status

Not run. No TRUSS contract has been deployed. The Direct Mode fixtures are public-looking synthetic data served by mocks and are labeled as such; they are not live-chain or real-world release evidence.

## Required proof after deployment

Record transaction hashes, explorer links, finalized receipts, contract state before/after and the exact contract address for each lifecycle.

1. **ADMITTED:** create policy, open exact candidate, assess, wait for `FINALIZED`, prove `ADMITTED` and prove the head advances only after finality.
2. **REJECTED:** submit a synthetic fixture that violates one frozen criterion, finalize, prove `REJECTED` and prove the head remains unchanged.
3. **Retryable:** finalize `INSUFFICIENT_EVIDENCE` or `CONFLICTING_EVIDENCE`; append a distinct role-bound round; reassess; prove both attempts and both rounds remain stored.
4. **Replay:** reject duplicate policy/candidate/release coordinates.
5. **Authorization:** reject a non-owner policy mutation/successor.
6. **Stale predecessor:** open competing candidates against one head, admit one, and prove the other cannot advance the new head.
7. **Scope:** reject invalid hosts, foreign subdomains, path-prefix lookalikes, duplicate URLs and out-of-scope sources.

The public chain proof must be rerun against the final source after every code change. Never invent or reuse transaction hashes.
