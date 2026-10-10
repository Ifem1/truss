# Deployment

## Current Studionet contracts and live status

The latest deployed registry (before the PR #3 issuer hardening) is `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f`; its deployment transaction `0xa5e50ed1a21aac590278d63db1f75ee91693fa8586378714fd14cf7de70ed024` finalized with `MAJORITY_AGREE`. Its source SHA-256 `ec2d9405250bcc1574fdbace7a41d52db8019af50d7c4d31d07d3ccccf1df66d` matches the fetched deployed bytes exactly. The latest deployed activation gate (before the PR #3 issuer hardening) is `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`, deployment transaction `0xc7a7a79da6818459709dfa6b450bd5adecd91a5c98263a272b5ef6a3bb16bf6d`, finalized with `MAJORITY_AGREE` and configured to the final registry and v0.1.2 policy.

An earlier issuer-bound `genlayerlabs/genlayer-js` v1.1.8 candidate remains open on a superseded registry; its assessment finalized `MAJORITY_DISAGREE` after requests without GitHub headers received HTTP 403. The finalized probe contract returned HTTP 200 for GitHub API sources when explicit headers were sent. The final v0.1.2 candidate is `ADMITTED` on the final registry; its assessment finalized `MAJORITY_AGREE`. Three activation attempts and one invalid-candidate probe finalized `NO_MAJORITY` after 600-second leader execution timeouts; these are not TRUSS contract rejections. Canonical reads of the deployed gate return an empty active candidate and `[]` activation history. Demonstration publisher and issuer wallets are locally controlled, so distinct addresses do not prove organizational independence.

The current production alias uses the final registry and activation gate. Vercel deployment `dpl_4BmBjXhuVgiBLyffGLD5MFU2Eoqh` is `READY` at `https://truss-igo8oe7ma-ifem1s-projects.vercel.app` and aliased to `https://truss-gray.vercel.app`; the live route returned HTTP 200 and its public JavaScript bundle contains both configured contract addresses. The admitted candidate is not activated: four gate transactions finalized with `NO_MAJORITY` following 600-second leader timeouts, and the gate reads empty active state. The current production frontend cutover is complete; the live lifecycle remains unproven.

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

The frontend requires `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` and `NEXT_PUBLIC_ACTIVATION_GATE_ADDRESS`; production is configured with the latest deployed registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f` and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. These on-chain deployments predate PR #3 issuer hardening. The merged hardened registry source is not deployed: the minimal cross-contract `LATEST_FINAL` write times out on Studionet, and a fresh registry would require a new policy and candidate admission before production could safely switch. Replacement registry/gate deployment and production address cutover are therefore BLOCKED. See the [cross-contract reproduction](STUDIONET_CROSS_CONTRACT_ISSUE.md). The finalized transaction reader checks `status_name` and the successful leader return under `consensus_data.leader_receipt`, matching the pinned SDK Studionet response.

Semantic contract validation uses the GenVM runner version matching the existing contract dependency header. The pinned manager artifact layout is incompatible with the legacy linter's expected archive path; the checked validation command pins the compatible runner and passed AST lint plus SDK semantics.

## Production frontend

The production frontend is live at [https://truss-gray.vercel.app](https://truss-gray.vercel.app). Vercel reports project `truss` (`prj_mYHmZKlGjgyGxKoIAw2W5fjBcQxQ`), verified production deployment `dpl_F2JGfsg8Zx7YvNxp9k4X4yDxMnar` in `READY` state, and GitHub source `Ifem1/truss`, branch `master`, documentation reconciliation commit `9f2e30da5f18743685aa9e076162533e789b6729`. The deployed application code is from frontend source commit `f668c80b7e29602c493e1f505be598a83183373f`; this later deployment contains documentation-only changes. GitHub Production deployment `6918710861` for the documentation commit completed successfully; the deployment uses the Next.js framework. Full provenance and smoke-check evidence are in [REVIEW_EVIDENCE.md](REVIEW_EVIDENCE.md) and [deployment-manifest.public.json](../deployment-manifest.public.json).

The current production configuration is Studionet chain `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f`, and activation gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. The earlier `0xEf2aF888D4e764678d97a1EC38e7519047440fFb` is historical and superseded. The live production bundle was verified to contain the configured addresses. `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` is configured on Vercel for Production; Vercel masks the stored value. The RPC and explorer variables use canonical defaults in `lib/config.ts`. No production mock state or mock transaction branch is present in the frontend source or deployed bundle.

## Repository publishing

The exact origin in this extracted folder is `https://github.com/Ifem1/truss.git`. Published checkpoints use only the authenticated `Ifem1` identity. Check the latest Actions run for the final pushed HEAD before treating CI as green.

## Known limitation

The pinned GenLayer web fetch API does not expose redirect controls. Observed 3xx responses fail closed, but automatic redirect-following cannot be ruled out.