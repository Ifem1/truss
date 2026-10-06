# Deployment

## Current verified state

TRUSS is **not deployed**. The package lock target remains Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, and repository-pinned GenLayer CLI `0.39.1`.

The repository package `node_modules/genlayer@0.39.1` reports `0.39.1`; `npx --no-install genlayer --version` and `npx --no-install genlayer network info` were verified against that local package. A committed npm lockfile was generated from the exact existing package pins, and `npm ci` subsequently completed successfully (`added 459 packages`). No declared dependency versions were changed. The production build added Next.js's required `jsx: react-jsx` and `.next/dev/types` tsconfig settings.

The installed CLI help confirms `deploy --contract <contractPath> --rpc <rpcUrl>`. Its `network info` output currently reports Studionet chain `61999` and the required RPC URL. Its bundled explorer URL differs from the TRUSS required explorer, so TRUSS continues to use the explicit `explorer-studio.genlayer.com` value.

## Required gates

Before deployment, all must pass in this checkout:

- local CLI resolution and exact version `0.39.1`;
- contract lint and SDK semantic validation;
- all Direct Mode tests;
- repository preflight;
- TypeScript typecheck;
- production Next.js build;
- Playwright browser tests.

The deployment script must verify the live RPC `eth_chainId` result is `0xf22f` (decimal `61999`), then run the local CLI with the explicit RPC and `--contract contracts/truss_registry.py`. It must capture the actual CLI output and source SHA-256 in the deployment manifest. Do not deploy unless every gate passes.

It also requires `TRUSS_DEPLOY_ACCOUNT_NAME` and `TRUSS_DEPLOY_AUTHORIZED_ADDRESS`, then verifies through the local CLI that the named account is active, has the exact authorized address, and has a positive Studionet GEN balance. It refuses to silently use the CLI's default account. Ifem must set those values only for an account she owns and explicitly authorizes for TRUSS.

## Outstanding blockers

Semantic validation is pinned to GenVM `v0.3.0-rc7`, whose `py-genlayer` runner hash exactly matches the contract's preserved dependency header. The newer `genlayerlabs-genvm-manager-v0.6.0-rc5` artifact has an incompatible archive layout for linter 0.11.0 and does not contain the requested runner at the expected legacy path. `scripts/check-contract.mjs` sets `GENVM_VERSION=v0.3.0-rc7` to keep the actual validation command reproducible. `npm run contracts:check` passed AST lint and SDK semantic validation.

Frontend: `npm ci`, `npm run typecheck`, and `npm run build` passed. Playwright's managed web-server teardown hung on Windows despite all test cases passing; `scripts/run-e2e.mjs` now starts the production server directly and shuts it down explicitly. `npm run test:e2e` exits successfully with 3/3 passing.

The CLI reports active account label `stablematch-throwaway`, public address `0x39680bd423437c0eaa18493629652821ec672c61`; read-only balance lookup fails to connect to Studionet, and the account was not used because its TRUSS authorization is unconfirmed. The account list is local CLI state only and does not establish funding or ownership. The exact origin `https://github.com/Ifem1/truss.git` is configured in this extracted folder. The environment's cached GitHub CLI tokens are invalid, and authenticated or anonymous `git ls-remote` cannot verify repository refs (`Repository not found`); no push was made. Per the user's latest direction, Vercel is not being pursued. No network transaction or production deployment has been performed. WSL is unnecessary for the now-passing compatible semantic validation; it remains unavailable as an alternate runtime.

No address, transaction hash, deployed-source byte match or production URL is recorded. The manifest must remain explicitly undeployed until the work is completed and verified.
