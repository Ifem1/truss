# Deployment

## Current Studionet contracts and live status

The final corrected registry is `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f`; its deployment transaction `0xa5e50ed1a21aac590278d63db1f75ee91693fa8586378714fd14cf7de70ed024` finalized with `MAJORITY_AGREE`. Its source SHA-256 `ec2d9405250bcc1574fdbace7a41d52db8019af50d7c4d31d07d3ccccf1df66d` matches the fetched deployed bytes exactly. The final activation gate is `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`, deployment transaction `0xc7a7a79da6818459709dfa6b450bd5adecd91a5c98263a272b5ef6a3bb16bf6d`, finalized with `MAJORITY_AGREE` and configured to the final registry and v0.1.2 policy.

An earlier issuer-bound `genlayerlabs/genlayer-js` v1.1.8 candidate remains open on a superseded registry; its assessment finalized `MAJORITY_DISAGREE` after requests without GitHub headers received HTTP 403. The finalized probe contract returned HTTP 200 for the GitHub API, raw GitHub, jsDelivr and the Actions API when explicit headers were sent. The final v0.1.2 candidate is `ADMITTED` on the final registry after its annotated tag and successful Actions run were independently checked by validator code; the assessment transaction finalized `MAJORITY_AGREE`. The activation call is still being resolved by Studionet consensus. Its first attempt finalized `NO_MAJORITY` after a leader timeout; the retry remains at `PROPOSING` with no active candidate as of this update. Demonstration publisher and issuer wallets are locally controlled, so distinct addresses do not prove organizational independence.

The production alias now uses the final registry and activation gate. Vercel deployment `dpl_DG4gHbFrrknxnPLfsy49NbpUXRZD` is `READY` at `https://truss-jazz5xtwc-ifem1s-projects.vercel.app` and aliased to `https://truss-gray.vercel.app`; the live route returned HTTP 200 and its public JavaScript bundle contains both configured contract addresses. The admitted candidate is not yet activated: activation transaction `0xfc9ce4ea46e6e2d882994575d5dc11899fa28d06e982e13581067c26e29d51d5` remains `PROPOSING` with no leader or validator votes, and the gate reads an empty active candidate. The frontend cutover is complete; the remaining release step is Studionet consensus finality.

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

The current frontend requires `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` and `NEXT_PUBLIC_ACTIVATION_GATE_ADDRESS`; it has no compiled-in historical address. Production has both variables set to the final registry and gate. The production bundle was checked for both addresses and the alias returned HTTP 200. The gate currently has an empty active candidate because all three activation transactions finalized `NO_MAJORITY` after leader execution timeouts. The finalized transaction reader checks the receipt's `status_name` and successful leader return under `consensus_data.leader_receipt`, matching the pinned SDK's observed Studionet response.

Semantic contract validation uses the GenVM runner version matching the existing contract dependency header. The pinned manager artifact layout is incompatible with the legacy linter's expected archive path; the checked validation command pins the compatible runner and passed AST lint plus SDK semantics.

## Production frontend

The production frontend is live at [https://truss-gray.vercel.app](https://truss-gray.vercel.app). The historical deployment and baseline configuration are recorded below as an as-of-October-7 snapshot. The current production alias serves deployment `dpl_4BmBjXhuVgiBLyffGLD5MFU2Eoqh` (`READY`), built after PR #2 merged; the site returned HTTP 200 and its public bundle contains the final registry and gate addresses. Current status and contract lifecycle receipts are in [deployment-manifest.current.json](../deployment-manifest.current.json) and the [live release matrix](LIVE_RELEASE_MATRIX.md).

As of October 7, the effective production configuration was the historical baseline registry `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`; this is superseded and is not the current production configuration. The current production configuration is chain `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, registry `0x83A62a8bE7a4f249D76f8c0b644cC9d4D8110c0f`, and gate `0x07D9C48552AAAd1aF495605476a7BFa2f6D09Fb6`. The public bundle and read-only RPC calls verify these settings. No production mock state or mock transaction branch is present in the frontend source or deployed bundle.

## Repository publishing

The exact origin in this extracted folder is `https://github.com/Ifem1/truss.git`. Published checkpoints use only the authenticated `Ifem1` identity. Check the latest Actions run for the final pushed HEAD before treating CI as green.

## Known limitation

The pinned GenLayer web fetch API does not expose redirect controls. Observed 3xx responses fail closed, but automatic redirect-following cannot be ruled out.
