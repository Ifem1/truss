# Review Evidence

**Status: in progress; not submission-ready.** No deployment or production browser proof is claimed.

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
- Studionet deployment and live proof: not run.
- Production hosting and source provenance: pending. The user will deploy to Vercel after a real final contract address is available.

## Deployment evidence fields

- Branch: `master` in the exact provided extracted folder.
- Remote: `https://github.com/Ifem1/truss.git`; authenticated as `Ifem1`, with `master` pushed. GitHub Actions run `37500307163` passed every required step on the commit preceding this evidence-only update; subsequent changes are limited to updating this record and checksums.
- Repository contract source SHA-256: `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0` (not deployed).
- Contract address / deployment transaction: none.
- Deployed source SHA-256 / exact byte match: not applicable; no deployment.
- ADMITTED, REJECTED, retry, stale predecessor transactions: none.
- Production URL / provenance: none.
- Active local CLI account observed (not used): label `stablematch-throwaway`, address `0x39680bd423437c0eaa18493629652821ec672c61`, balance `954.489409999999999788 GEN`, keystore locked. TRUSS authorization and ownership were not established.
- Deployment script now refuses to run without explicitly named and authorized account/address environment variables and a verified active, unlocked account/address/positive balance readback.
- GitHub Actions: run [37500307163](https://github.com/Ifem1/truss/actions/runs/37500307163) passed every step of the `verify` job, including `npm ci`, contract checks, 30 Direct Mode tests, typecheck, build, and 7 browser tests. Prior run `37497458411` failed before job creation due to malformed setup-node YAML indentation; that indentation is fixed.
- Frontend dependency pin warning: npm reports a peer-optional `@types/node` range warning from nested Vite 7.3.6; the install, typecheck, build and browser tests nevertheless passed.
- Remaining evidence limitation: SDK redirect behavior is not observable through the pinned `gl.nondet.web.get` interface; automatic redirect following cannot be ruled out.

Replace this report only with evidence collected from the final HEAD and the exact final deployment. Do not promote local mocked tests into live-chain claims.
