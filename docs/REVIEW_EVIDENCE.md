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
- Browser tests: 3 passed with `npm run test:e2e`; `scripts/run-e2e.mjs` starts the built production server, invokes Playwright, and shuts the server down cleanly on Windows.
- Studionet deployment and live proof: not run.
- Production hosting and source provenance: not run; not pursued per the user's latest direction.

## Deployment evidence fields

- Branch: `master` (local repository initialized in the provided extracted folder; no commit yet).
- HEAD: none.
- Repository contract source SHA-256: `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0` (not deployed).
- Contract address / deployment transaction: none.
- Deployed source SHA-256 / exact byte match: not applicable; no deployment.
- ADMITTED, REJECTED, retry, stale predecessor transactions: none.
- Production URL / provenance: none.
- Active local CLI account observed (not used): label `stablematch-throwaway`, address `0x39680bd423437c0eaa18493629652821ec672c61`; authorization, balance and permission for TRUSS deployment were not established.
- Deployment script now refuses to run without explicitly named and authorized account/address environment variables and a verified active account/address/positive balance readback.
- GitHub: exact `https://github.com/Ifem1/truss.git` origin is set on this checkout. User says setup is done, but environment verification still fails: cached Ifem1/BeatyXO auth tokens are invalid and `git ls-remote` reports `Repository not found`. No push performed.
- Frontend dependency pin warning: npm reports a peer-optional `@types/node` range warning from nested Vite 7.3.6; the install, typecheck, build and browser tests nevertheless passed.
- Remaining evidence limitation: SDK redirect behavior is not observable through the pinned `gl.nondet.web.get` interface; automatic redirect following cannot be ruled out.

Replace this report only with evidence collected from the final HEAD and the exact final deployment. Do not promote local mocked tests into live-chain claims.
