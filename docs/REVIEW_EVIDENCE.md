# Review Evidence

**Historical snapshot (2026-10-07):** This file records earlier contract and production evidence. It does not describe current issuer-hardening deployment status or the later activation timeouts. Current state and the cross-contract blocker are in the [live release matrix](LIVE_RELEASE_MATRIX.md) and [Studionet issue](STUDIONET_CROSS_CONTRACT_ISSUE.md).

## Verification at frontend source commit `f668c80b7e29602c493e1f505be598a83183373f` (2026-10-07)

- Contract/GenVM compile and lint plus SDK semantic validation: passed.
- Direct Mode: 31 passed, 0 skipped.
- Python unit tests: 2 passed.
- Repository preflight: passed.
- TypeScript typecheck: passed.
- Production frontend build: passed.
- Browser tests: 14 passed locally and 14 passed against the production alias. They cover product routes, injected wallet connect/disconnect, rejected connection and transaction signatures, network switching, wrong-network gate, account/chain changes, submitted-but-nonfinal waiting, finalized contract-state reread, reload recovery, and finalized contract rollback handling. Transaction tests use controlled RPC fixtures; they do not sign or mutate live chain state.
- Frontend finality handling uses the actual GenLayer JS 1.1.8 receipt shape: `status_name`, `result_name`, and the successful leader return under `consensus_data.leader_receipt`. The SDK does not expose `txExecutionResultName` on this Studionet receipt; that incorrect assumption has been removed.
- Repository-local GenLayer CLI: `0.39.1`; Studionet RPC chain ID check: `61999` (`0xf22f`). No Studio Dev or 61997 use.
- Actions run [37668061679](https://github.com/Ifem1/truss/actions/runs/37668061679) passed on commit `f668c80b7e29602c493e1f505be598a83183373f`. It passed preflight, local CLI `0.39.1`, contract checks, 2 unit tests, 31 Direct Mode tests, typecheck, production build, and all 14 browser tests. Earlier documentation checkpoint run [37618597497](https://github.com/Ifem1/truss/actions/runs/37618597497) passed on `28f2eb2d70d61a95c271b13e3335725ab5aded12`; run [37631407613](https://github.com/Ifem1/truss/actions/runs/37631407613) passed on `d6a48386544f92bec18c6a1c507021d6a253fab7`; and runs [37539979253](https://github.com/Ifem1/truss/actions/runs/37539979253), [37537130932](https://github.com/Ifem1/truss/actions/runs/37537130932), and [37500893962](https://github.com/Ifem1/truss/actions/runs/37500893962) passed on their then-current commits.

## Production frontend provenance

Verified 2026-10-07 against the authenticated Vercel account `ifem1` and the public production site:

- Production alias: [https://truss-gray.vercel.app](https://truss-gray.vercel.app).
- Vercel project: `truss` (`prj_mYHmZKlGjgyGxKoIAw2W5fjBcQxQ`); framework preset: Next.js.
- Verified production deployment: `dpl_F2JGfsg8Zx7YvNxp9k4X4yDxMnar`, state `READY`, created `2026-10-07T19:19:29.809Z`; deployment URL `https://truss-jv30c0hhm-ifem1s-projects.vercel.app`.
- GitHub Production deployment record [6918710861](https://github.com/Ifem1/truss/deployments/6918710861) records repository `Ifem1/truss`, branch `master`, and documentation reconciliation source commit `9f2e30da5f18743685aa9e076162533e789b6729`, with deployment status `success`. This deployment contains only documentation changes since the frontend source commit `f668c80b7e29602c493e1f505be598a83183373f`; both commits are distinct from contract source commit `a40145063f28544dab62dfde0453b5b7729b1739`.
- The production bundle resolves the contract to `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`, chain ID `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, and explorer `https://explorer-studio.genlayer.com`. Production frontend configuration uses the canonical `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` variable; Vercel lists it for Production but marks its stored value sensitive and masks it in environment pulls. The effective value was independently verified from the loaded production bundle and successful read-only `gen_call` requests to that exact contract. The RPC and explorer variables are not configured in the Vercel project; the canonical code defaults are used.
- Loaded production bundles contain the final contract/network settings and no references to 61997, Studio Dev, Studio Next, or the production mock-state/transaction patterns searched. The frontend source at the recorded commit has `LATEST_FINAL` authoritative reads, injected EIP-1193 wallet use, and separate submitted/nonfinal versus finalized transaction handling.
- Read-only browser smoke checks: `/`, `/policy/new`, and `/release/new` each returned HTTP 200, displayed TRUSS and the expected route content, and showed no missing-contract configuration error. The home page issued read-only RPC calls to the final contract; observed responses were HTTP 200 with JSON-RPC results and no errors. No wallet signature or write transaction was requested.
- The automated browser transaction tests use controlled RPC fixtures. The historical live lifecycle transactions listed below were independently executed against Studionet; production smoke checks did not re-run or claim those lifecycle transactions.

## Final Studionet deployment

- Chain: Studionet `61999`; RPC `https://studio.genlayer.com/api`.
- Contract: `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`.
- Deployment tx: [0x5609cb13936ae6d497b3278b6aeab6afc523c425073f140c672b9e48843ba83d](https://explorer-studio.genlayer.com/tx/0x5609cb13936ae6d497b3278b6aeab6afc523c425073f140c672b9e48843ba83d), `FINALIZED`, `MAJORITY_AGREE`.
- Deployed/repository contract SHA-256: `eff129604484b9d449660e265a435e4a1677a1c6548908cf7eee04068a0be5d3`; byte-for-byte comparison of the complete decoded `gen_getContractCode` response passed.
- Source commit at deployment: `a40145063f28544dab62dfde0453b5b7729b1739`.
- Previous deployment `0x95800b68742FD083ECaee37FFE93Ad3333C7CF01` is superseded and must not be configured for production.

## Fresh live proof against the final contract

All fixtures are public, synthetic test evidence. They do not attest to a real release, security review, test run or build provenance. Each listed transaction finalized on the exact contract above.

- Policy create: [0x9f3f40637e62f4375ebcf21e5e2821ba8684aab8804031ea24f2f688c601f1a4](https://explorer-studio.genlayer.com/tx/0x9f3f40637e62f4375ebcf21e5e2821ba8684aab8804031ea24f2f688c601f1a4).
- **ADMITTED:** candidate `truss-final-20261006-admit1`; open [0x59e4bc4624d8ecb1de6a431cd4d6ea3b17148f8d367ad2ac0801eb3bc412b050](https://explorer-studio.genlayer.com/tx/0x59e4bc4624d8ecb1de6a431cd4d6ea3b17148f8d367ad2ac0801eb3bc412b050), assessment [0xb590ad84852881ae1d99d2d3334935d0ef15795fa419ee882e8b95291f8affda](https://explorer-studio.genlayer.com/tx/0xb590ad84852881ae1d99d2d3334935d0ef15795fa419ee882e8b95291f8affda). Finalized as `ADMITTED`; head advanced to this candidate only after the assessment finalized.
- **REJECTED:** candidate `truss-final-20261006-reject`; open [0x66be4cf52c9b7625ee9e089572464bd9ee77703c162803b895a01eda6f2c655e](https://explorer-studio.genlayer.com/tx/0x66be4cf52c9b7625ee9e089572464bd9ee77703c162803b895a01eda6f2c655e), assessment [0xe86c7696f5e982da1176aed885a1b7182689a73cf556da3072d5b0f07e07f795](https://explorer-studio.genlayer.com/tx/0xe86c7696f5e982da1176aed885a1b7182689a73cf556da3072d5b0f07e07f795). Candidate label `9.9.9` conflicts with pinned package version `0.1.0`; head remained on the admitted candidate.
- **Retry/history:** candidate `truss-final-20261006-retry`; open [0x352b1c4130aa7fe5f003a427a14aa4fd00f407e4c9a4ab3e7afa6aaf7e127d04](https://explorer-studio.genlayer.com/tx/0x352b1c4130aa7fe5f003a427a14aa4fd00f407e4c9a4ab3e7afa6aaf7e127d04); attempt 1 [0x7733cb554dfdc8c9ba94b939c25cbcaece48870d80cf92b1c15d7a4b2095f953](https://explorer-studio.genlayer.com/tx/0x7733cb554dfdc8c9ba94b939c25cbcaece48870d80cf92b1c15d7a4b2095f953) finalized `INSUFFICIENT_EVIDENCE`; append round 2 [0x3157f3b032c955ad17fec46988d6ac868583080704bc767977a6d1d6f880d540](https://explorer-studio.genlayer.com/tx/0x3157f3b032c955ad17fec46988d6ac868583080704bc767977a6d1d6f880d540); attempt 2 [0x07808ddac5c2ab9dfa8894bd4f1a4efc78b1fa56ad341adec497a9db86303087](https://explorer-studio.genlayer.com/tx/0x07808ddac5c2ab9dfa8894bd4f1a4efc78b1fa56ad341adec497a9db86303087) finalized `REJECTED` after the newly available source showed the `0.1.1` label mismatch. Final state stores 2 rounds and both attempts (`INSUFFICIENT_EVIDENCE`, `REJECTED`); head did not move.
- **Duplicate/replay:** [0x4a2f627d04204b954711a9ea7728c36680b4150681f3ff9ee5ad89f8f61b526b](https://explorer-studio.genlayer.com/tx/0x4a2f627d04204b954711a9ea7728c36680b4150681f3ff9ee5ad89f8f61b526b) finalized without storing a candidate for an already-used release coordinate.
- **Invalid evidence scope:** [0xf427d9215edfca1cec72affda64c36a6cfdc79ebc5c10eb30137127dffd71b1c](https://explorer-studio.genlayer.com/tx/0xf427d9215edfca1cec72affda64c36a6cfdc79ebc5c10eb30137127dffd71b1c) finalized without storing the foreign-host candidate.
- **Unauthorized policy mutation:** [0x62ca3eff9ef239891aca082be8a83f4e708319b10a32af810c1d78a443d1fe79](https://explorer-studio.genlayer.com/tx/0x62ca3eff9ef239891aca082be8a83f4e708319b10a32af810c1d78a443d1fe79) finalized; active policy remained `truss-final-20261006-policy`.
- **Stale predecessor race:** both candidates were opened against `truss-final-20261006-admit1`: A open [0xaa9782649a3fc70bae4a8469236979da6043644dd9fdef7ad74923e02420391a](https://explorer-studio.genlayer.com/tx/0xaa9782649a3fc70bae4a8469236979da6043644dd9fdef7ad74923e02420391a), B open [0x0013b5bcf17649d6c6190bb2d8884e89ea0a7eea15ff0f30e7ed95dc5d1c4e4c](https://explorer-studio.genlayer.com/tx/0x0013b5bcf17649d6c6190bb2d8884e89ea0a7eea15ff0f30e7ed95dc5d1c4e4c). A assessment [0x53960a357f10d8cd601ac6587b60ca2cfd834ab47569ae6fe860c31fea72cea6](https://explorer-studio.genlayer.com/tx/0x53960a357f10d8cd601ac6587b60ca2cfd834ab47569ae6fe860c31fea72cea6) finalized `ADMITTED`, advancing head to A. B assessment [0x1334ef381776c31f724a90121141645c7a3ef8e32a9a0633f9ef35b36d8a0a2c](https://explorer-studio.genlayer.com/tx/0x1334ef381776c31f724a90121141645c7a3ef8e32a9a0633f9ef35b36d8a0a2c) finalized `REJECTED` as stale; the head remained A.

An earlier malformed live fixture attempted to use `TEST_STATUS` although the frozen policy requires only `RELEASE_IDENTITY`; its transaction finalized with a contract rollback and did not store a candidate. It is not counted as a product lifecycle result. All subsequent writes used explicit signer objects and verified addresses; no CLI default account was used.

## Remaining limitations

- The browser transaction tests exercise frontend state transitions with controlled RPC fixtures; the actual live-chain lifecycles are separately recorded above.
- The pinned SDK web fetch does not expose redirect controls; automatic redirect-following cannot be ruled out.
- Live fixture content is synthetic and must never be presented as production release/security evidence.