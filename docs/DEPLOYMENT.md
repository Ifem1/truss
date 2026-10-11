# Deployment

## Current Studionet contracts and live status

The hardened registry and finalized-message gate are deployed as a replacement pair. Registry `0x20193443d1E429e4984B118FF54DC77547b0fBCB`; [deployment transaction](https://explorer-studio.genlayer.com/tx/0x4c007779b2c1de93f9cd84d3267c0fe09082a5c29baf63bb640b59e5a0fa9493), source SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`, byte-for-byte verified. Gate `0xCA9AAa4C18f51e3454ce50dE65c76e52F56C550D`; [deployment transaction](https://explorer-studio.genlayer.com/tx/0xb502379a0efd85e6b0022200d879399bdb8605d59c17934989d65d69a50f67c0), source SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`, byte-for-byte verified. Both deployments finalized with `MAJORITY_AGREE`; registry source commit is `e4339d96f2c5908b85bb8eba663dea907ce98dfe`.

Frozen policy `truss-actions-v012-policy` has digest `38055583cb367a31a9ac8ef7daa9c450f6e66271fd4a5920d1f6052127f7a1a5`; [policy creation](https://explorer-studio.genlayer.com/tx/0xc54ca380a7353abf5eee19710f8aa3b925e49483c5b22a6bbd8c471e801168e0) and [gate configuration](https://explorer-studio.genlayer.com/tx/0x6b3ea7cb2d7307935364e531eb91052c1d07e53ac07c8215957f0c7954783231) finalized. Candidate `truss-actions-v012-candidate` is `INSUFFICIENT_EVIDENCE`; the first [assessment](https://explorer-studio.genlayer.com/tx/0x37b476904b211ca93a9367d4cebe3eca95d03bc34d6e423699152a745892df43) lacked a commitment to the annotated tag-object response. The deployed registry supports annotated tags when that object is included in the issuer-committed round. Exact retry URLs and digests are in [the live release matrix](LIVE_RELEASE_MATRIX.md). No admission message has been emitted.

A user-authorized throwaway wallet submitted an unauthorized activation call. The [transaction](https://explorer-studio.genlayer.com/tx/0x26c8cfef561df278f98a20745b4ec9918ea890e81cbaa9f1392b09b12f2fa903) finalized `MAJORITY_AGREE` with leader execution `ERROR` at operator authorization. Canonical gate poststate is active candidate `""`, history `[]`, pending admission `{}`, pending acknowledgment `{}`. This verifies unauthorized-operator rejection only; positive activation and authorized invalid-candidate rejection remain unproven.

Production remains on registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`; no cutover has occurred. Vercel deployment [`dpl_4BmBjXhuVgiBLyffGLD5MFU2Eoqh`](https://vercel.com/ifem1s-projects/truss/deployment/dpl_4BmBjXhuVgiBLyffGLD5MFU2Eoqh) remains `READY` at [truss-gray.vercel.app](https://truss-gray.vercel.app). The recorded `LATEST_FINAL` issue remains in [the Studionet report](STUDIONET_CROSS_CONTRACT_ISSUE.md) and [GenLayer issue #60](https://github.com/genlayerlabs/genvm-manager/issues/60); finalized messaging proves a workable alternate primitive, not that the earlier RPC problem was fixed.
## Historical Studionet 61999 contract

The baseline contract was deployed to Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, using repository-local GenLayer CLI `0.39.1`. This historical contract is distinct from the current registry and activation gate above.

- Contract: `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`
- Deployment transaction: [0x5609cb13936ae6d497b3278b6aeab6afc523c425073f140c672b9e48843ba83d](https://explorer-studio.genlayer.com/tx/0x5609cb13936ae6d497b3278b6aeab6afc523c425073f140c672b9e48843ba83d)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`.
- Repository and deployed-source SHA-256: `eff129604484b9d449660e265a435e4a1677a1c6548908cf7eee04068a0be5d3`.
- Verification: full decoded `gen_getContractCode` response compared byte-for-byte with `contracts/truss_registry.py`; passed.
- Source commit: `a40145063f28544dab62dfde0453b5b7729b1739`.
- Public deployment manifest: [deployment-manifest.public.json](../deployment-manifest.public.json).

The prior deployment at `0x95800b68742FD083ECaee37FFE93Ad3333C7CF01` is superseded. Do not use it for frontend configuration.

Fresh synthetic lifecycle proofs were completed on the final contract: ADMITTED/head advance, REJECTED/head unchanged, insufficient evidence followed by appended evidence and a second preserved attempt, duplicate/replay rejection, invalid scope rejection, unauthorized policy mutation rejection and stale-predecessor race. See [review evidence](REVIEW_EVIDENCE.md) for hashes and explorer links. Synthetic content is not real-world release or security evidence.

## Reproducible pre-deployment gates

The final contract source passed repository preflight, contract compile/lint and SDK validation, Direct Mode, unit tests, TypeScript typecheck, production frontend build and browser tests before deployment. Post-deployment reruns passed: Direct Mode 31/31, unit tests 2/2, browser tests 14/14. Browser transaction-flow tests use controlled RPC fixtures and do not submit live transactions. The deployment script checks the live RPC chain ID equals `0xf22f`, verifies local CLI `0.39.1`, requires explicit account and expected address environment variables, verifies that account is active/unlocked/funded before signing, waits for `FINALIZED`, fetches deployed code and compares exact bytes.

The current frontend requires `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` and `NEXT_PUBLIC_ACTIVATION_GATE_ADDRESS`; it has no compiled-in historical address. Production is still configured to the existing production registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. The replacement gate currently reads active candidate `""`, history `[]`, pending admission `{}`, and pending acknowledgment `{}`. The finalized transaction reader checks both `status_name` and leader execution result.

Semantic contract validation uses the GenVM runner version matching the existing contract dependency header. The pinned manager artifact layout is incompatible with the legacy linter's expected archive path; the checked validation command pins the compatible runner and passed AST lint plus SDK semantics.

## Production frontend

The production frontend is live at [https://truss-gray.vercel.app](https://truss-gray.vercel.app). The current production alias serves deployment `dpl_4BmBjXhuVgiBLyffGLD5MFU2Eoqh` (`READY`); its bundle uses the existing production registry and gate addresses, not the replacement pair. Current replacement contract receipts and status are in [deployment-manifest.public.json](../deployment-manifest.public.json) and the [live release matrix](LIVE_RELEASE_MATRIX.md).

As of October 7, the effective production configuration was the historical baseline registry `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`; this is superseded and is not the current production configuration. The current production configuration is chain `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f`, and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. The public bundle and read-only RPC calls verify these settings. No production mock state or mock transaction branch is present in the frontend source or deployed bundle.

## Repository publishing

The exact origin in this extracted folder is `https://github.com/Ifem1/truss.git`. Published checkpoints use only the authenticated `Ifem1` identity. Check the latest Actions run for the final pushed HEAD before treating CI as green.

## Redirect and source substitution handling

The GenLayer web SDK does not expose the final URL after an automatically followed redirect. TRUSS therefore requires an issuer commitment to the exact response body bytes for admission-critical evidence. The fetcher does not retrieve an evidence URL without a valid on-chain SHA-256 commitment for the sealed round, rejects observed 3xx responses, and rejects any body whose digest differs from the commitment. GitHub tag and Actions provenance JSON is subject to the same exact-byte commitment check. A successful HTTP status or matching response body alone is not proof of the final HTTP origin; the assurance is issuer-authenticated content plus validated endpoint shape and issuer-committed GitHub-shaped metadata. Unsupported/uncommitted paths are unavailable and cannot support admission. Issuer wallet control still does not establish organizational independence.
