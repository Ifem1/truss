# Deployment

## Studionet 61999 contract

The final contract is deployed to the only permitted network: Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, using repository-local GenLayer CLI `0.39.1`.

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

The frontend defaults to the final public contract address `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`. Vercel may override it with `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS`; no production mock address or mock transaction path is included. The finalized transaction reader checks the receipt's `status_name` and the successful leader return under `consensus_data.leader_receipt`, matching the pinned SDK's observed Studionet response.

Semantic contract validation uses the GenVM runner version matching the existing contract dependency header. The pinned manager artifact layout is incompatible with the legacy linter's expected archive path; the checked validation command pins the compatible runner and passed AST lint plus SDK semantics.

## Production frontend

The production frontend is live at [https://truss-gray.vercel.app](https://truss-gray.vercel.app). Vercel reports project `truss` (`prj_mYHmZKlGjgyGxKoIAw2W5fjBcQxQ`), verified production deployment `dpl_F2JGfsg8Zx7YvNxp9k4X4yDxMnar` in `READY` state, and GitHub source `Ifem1/truss`, branch `master`, documentation reconciliation commit `9f2e30da5f18743685aa9e076162533e789b6729`. The deployed application code is from frontend source commit `f668c80b7e29602c493e1f505be598a83183373f`; this later deployment contains documentation-only changes. GitHub Production deployment `6918710861` for the documentation commit completed successfully; the deployment uses the Next.js framework. Full provenance and smoke-check evidence are in [REVIEW_EVIDENCE.md](REVIEW_EVIDENCE.md) and [deployment-manifest.public.json](../deployment-manifest.public.json).

The effective production configuration is Studionet chain `61999` (`0xf22f`), RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, and contract `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`. `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` is configured on Vercel for Production; Vercel masks the stored value, so the effective address is verified through the deployed JavaScript bundle and read-only calls observed at the production RPC. The RPC and explorer variables are absent from the Vercel environment list and resolve through the canonical defaults in `lib/config.ts`. No production mock state or mock transaction branch is present in the frontend source or deployed bundle.

## Repository publishing

The exact origin in this extracted folder is `https://github.com/Ifem1/truss.git`. Published checkpoints use only the authenticated `Ifem1` identity. Check the latest Actions run for the final pushed HEAD before treating CI as green.

## Known limitation

The pinned GenLayer web fetch API does not expose redirect controls. Observed 3xx responses fail closed, but automatic redirect-following cannot be ruled out.
