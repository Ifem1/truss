# Review Evidence

**Status: in progress; not submission-ready.** A previous contract deployment and exact source verification are complete. A live evidence-classification flaw was fixed in the current repository source, which still needs deployment and fresh final-contract proof.

## Local evidence as of 2026-10-06

- Direct Mode: 30 passed, 0 skipped, using the local GenLayer test harness and synthetic fixtures.
- Python unit tests: 2 passed.
- Repository preflight: passed.
- GenVM AST lint: passed (3 checks).
- GenVM AST lint and SDK semantic validation: passed with `npm run contracts:check` (3 AST checks; `TrussRegistry`, 11 methods). Validation uses GenVM `v0.3.0-rc7`, whose runner hash matches the existing contract dependency header; linter 0.11.0 is not compatible with the newer manager artifact archive layout. The check script now pins the matching artifact version.
- Frontend dependencies: `package-lock.json` generated from existing package pins; `npm ci` passed (459 packages added). Declared versions were not changed.
- TypeScript typecheck: passed.
- Production frontend build: passed with Next.js 16.3.7; Next's required tsconfig normalization was retained.
- Browser tests: 7 passed with `npm run test:e2e` against the production build. Covered product routes, injected wallet connect/disconnect, rejected connection signature, switching from another chain to Studionet, wrong-network state after a chain change, and account/chain change events. Full transaction submitted/accepted/finalized, recovery, and finalized re-read UX are not yet proven by browser tests.
- Network lock: repository-local CLI `0.39.1` reports Studionet chain `61999`, and the canonical RPC returned `0xf22f` to a direct read-only `eth_chainId` request.
- Studionet contract deployment: finalized at `0x95800b68742FD083ECaee37FFE93Ad3333C7CF01`; transaction [0x8e145c29833c52d03c40da362f5d9301e84799a7343b1d4fc197de8a6ba77295](https://explorer-studio.genlayer.com/tx/0x8e145c29833c52d03c40da362f5d9301e84799a7343b1d4fc197de8a6ba77295).
- Previous deployment source verification: exact byte match passed using direct `gen_getContractCode` RPC bytes (35,680 bytes on each side; SHA-256 `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0`). Current repository contract source changed afterward and has not yet been redeployed.
- Live ADMITTED lifecycle: not achieved. The candidate was INSUFFICIENT_EVIDENCE; no head movement occurred.
- Live REJECTED lifecycle: synthetic candidate `truss-live-20261006-reject1` finalized REJECTED because `9.9.9` conflicts with pinned package version `0.1.0`; head stayed empty.
- Live retry lifecycle: attempt 1 finalized INSUFFICIENT_EVIDENCE; a new evidence round and reassessment finalized INSUFFICIENT_EVIDENCE. Both attempts and rounds remain stored; head stayed empty.
- Live duplicate/replay, stale predecessor and invalid scope proofs: incomplete.
- Production hosting and source provenance: pending. The Vercel build address is available in `docs/DEPLOYMENT.md`.

## Deployment evidence fields

- Branch: `master` in the exact provided extracted folder.
- Remote: `https://github.com/Ifem1/truss.git`. Commit `c5e6690b3d85200de83b5edb7ecf761db477d747` is pushed and passed Actions run [37500893962](https://github.com/Ifem1/truss/actions/runs/37500893962). Local follow-up commit `244cba2` is not pushed: cached GitHub credentials are invalid, and a fresh Ifem1 device authorization is pending.
- Repository contract source SHA-256: `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0`.
- Contract address / deployment transaction: `0x95800b68742FD083ECaee37FFE93Ad3333C7CF01` / `0x8e145c29833c52d03c40da362f5d9301e84799a7343b1d4fc197de8a6ba77295` (FINALIZED, MAJORITY_AGREE).
- Deployed source SHA-256 / exact byte match: `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0` / passed.
- Policy transaction: `0xdf366551ff1139f1983f6d0201d75049308de1da4f76c0c1a8b43de93ade078d`.
- Candidate open / attempt 1: `0x41e6a739108ff0bf6577bbf4cd8be8e9ed7afefcc73d80d8384f1af0e122330c` / `0x51de356307799c8d340332a2d602d8b77901fefccc1597036df0baae92fc8db0` (FINALIZED INSUFFICIENT_EVIDENCE).
- Evidence round 2 / reassessment: `0x4cb5f9a6c7f1bbab023416ff5be8774de20791d9e2c52ebda0152bd8d01110ce` / `0x542c12b1ea683dcec46bf4add12440ff2aa9e6e7561053e1001329b49d2e9204` (FINALIZED INSUFFICIENT_EVIDENCE; 2 attempts, 2 rounds).
- Rejected candidate open / assessment: `0xf6aa3aa02ca35b7bce29d15414df8a2fe142d42aa3cda162da78002466d10621` / `0x63702751c8395b769747fb0b299fe62c31bdfd08e1a6b20f69f02a2e85a19385` (FINALIZED REJECTED; head unchanged).
- Unexpected CLI account attempt: `0x996fa986c090a944edd3eff6b860682bd6ed44ea5100a28870e6f34b019102cc` came from `0x7876e9f76f32925c212528d57bc9dfe5e34bcc07`, not a supplied wallet. It did not change state: latest finalized reads show 1 attempt/1 round at that point. Further writes used an explicit second-key signer whose derived address was checked as `0xa49c51d759790116d451f256654dd9f0549d341f`.
- Live negative security checks on the previous deployment: replay tx `0x5524a539e154486e06748fd5bbb07914292e837c870c738f4450f6c048309e1a` and invalid-scope tx `0x12427c0c4e061b88244822a1da0f4fcf9fa06d2567be2fa43fa2dfbe22dbf864` finalized without storing candidates; unauthorized successor-policy tx `0x77a2c1d19b9c73e32ab219074f1ea7f57887cdf465712f429fe2cfe327119b13` finalized without changing the active policy.
- The second candidate's REJECTED result, first retry result, and retry reassessment all used the previous source version. They are exploratory proofs and must be repeated against the replacement final deployment.
- Production URL / provenance: none.
- Deployment wallet: explicitly supplied throwaway account `truss-deployer`, address `0x39680bd423437c0eaa18493629652821ec672c61`; deployment completed.
- Live-cycle wallet: explicitly supplied throwaway account `truss-live-cycle`, address `0xa49c51d759790116d451f256654dd9f0549d341f`, unlocked with `978.919199999999999375 GEN` at last check.
- Source-hardening follow-up: successful non-empty retrievals can no longer be classified `UNAVAILABLE`; omitted/failed classifications remain neutral or unavailable and cannot support admission. Prompt now gives a strict complete JSON schema for every evidence URL. Direct Mode is 31/31 passing. This source revision is pending deployment.
- Deployment script refuses to run without explicitly named and authorized account/address environment variables and a verified active, unlocked account/address/positive balance readback. The finality parser matches the stable CLI's `status_name`/`result_name` fields and source verification compares the entire decoded RPC response.
- GitHub Actions: run [37500307163](https://github.com/Ifem1/truss/actions/runs/37500307163) passed every step of the `verify` job, including `npm ci`, contract checks, 30 Direct Mode tests, typecheck, build, and 7 browser tests. Prior run `37497458411` failed before job creation due to malformed setup-node YAML indentation; that indentation is fixed.
- Frontend dependency pin warning: npm reports a peer-optional `@types/node` range warning from nested Vite 7.3.6; the install, typecheck, build and browser tests nevertheless passed.
- Remaining evidence limitation: SDK redirect behavior is not observable through the pinned `gl.nondet.web.get` interface; automatic redirect following cannot be ruled out.

Replace this report only with evidence collected from the final HEAD and the exact final deployment. Do not promote local mocked tests into live-chain claims.
