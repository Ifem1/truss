# Deployment

## Current verified state

TRUSS is **not deployed**. The package lock target remains Studionet chain `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, and repository-pinned GenLayer CLI `0.39.1`.

The repository package `node_modules/genlayer@0.39.1` reports `0.39.1`; `npx --no-install genlayer --version` and `npx --no-install genlayer network info` were verified against that local package. A committed npm lockfile was generated from the exact existing package pins, and `npm ci` subsequently completed successfully (`added 459 packages`). No declared dependency versions were changed. The production build added Next.js's required `jsx: react-jsx` and `.next/dev/types` tsconfig settings.

The installed CLI help confirms `deploy --contract <contractPath> --rpc <rpcUrl>`. Its `network info` output reports Studionet chain `61999` and the required RPC URL; a direct read-only RPC `eth_chainId` request returned `0xf22f`. Its bundled explorer URL differs from the TRUSS required explorer, so TRUSS continues to use the explicit `explorer-studio.genlayer.com` value.

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

It also requires `TRUSS_DEPLOY_ACCOUNT_NAME` and `TRUSS_DEPLOY_AUTHORIZED_ADDRESS`, then verifies through the local CLI that the named account is active, unlocked, has the exact authorized address, and has a positive Studionet GEN balance. It refuses to silently use the CLI's default account. Ifem must set those values only for an account she owns and explicitly authorizes for TRUSS.

## Outstanding blockers

Semantic validation is pinned to GenVM `v0.3.0-rc7`, whose `py-genlayer` runner hash exactly matches the contract's preserved dependency header. The newer `genlayerlabs-genvm-manager-v0.6.0-rc5` artifact has an incompatible archive layout for linter 0.11.0 and does not contain the requested runner at the expected legacy path. `scripts/check-contract.mjs` sets `GENVM_VERSION=v0.3.0-rc7` to keep the actual validation command reproducible. `npm run contracts:check` passed AST lint and SDK semantic validation.

Frontend: `npm ci`, `npm run typecheck`, and `npm run build` passed. `npm run test:e2e` uses the production build and exits cleanly on Windows; the current browser suite has 7 passing cases covering routes, wallet connect/disconnect, signature rejection, chain switching, wrong-network state, and account/chain changes. Transaction finality behavior still requires deeper browser lifecycle proof.

The local CLI account previously observed as `stablematch-throwaway` remains locked and was not used. No deployment signer/account has been authorized. The exact origin `https://github.com/Ifem1/truss.git` is configured in this extracted folder. Authenticated GitHub verification confirmed account `Ifem1`; branch `master` at commit `581b8bd146acd717c21dd074fee4a95221bdd5ce` was pushed to that remote. Workflow `.github/workflows/ci.yml` is present. Actions run [37499733882](https://github.com/Ifem1/truss/actions/runs/37499733882) passed its `verify` job in full: preflight, local CLI 0.39.1, contract lint/semantic validation, Python unit tests, Direct Mode, TypeScript, production build, and browser tests. The malformed setup-node YAML indentation is fixed and package installation now uses `npm ci`. The user will deploy the frontend to Vercel; do not claim a production URL or provenance until they provide it. No network transaction or contract deployment has been performed. WSL is unnecessary for the now-passing compatible semantic validation; it remains unavailable as an alternate runtime.

## Vercel environment values

Set these project environment variables for the user's Vercel deployment:

- `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` — required; the final deployed TRUSS contract address on Studionet 61999. Do not use a placeholder or a different-chain address.
- `NEXT_PUBLIC_GENLAYER_RPC` — optional; defaults to `https://studio.genlayer.com/api`.
- `NEXT_PUBLIC_GENLAYER_EXPLORER` — optional; defaults to `https://explorer-studio.genlayer.com`.

Redeploy after the final contract address and final source commit are known. Record Vercel's production URL, deployment ID, and source commit in the manifest and review evidence after the user completes deployment.

No address, transaction hash, deployed-source byte match or production URL is recorded. The manifest must remain explicitly undeployed until the work is completed and verified.
