# Deployment

## Previous verified deployment; replacement pending

TRUSS contract deployment is finalized on Studionet chain `61999` using RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, and repository-pinned GenLayer CLI `0.39.1`.

- Contract: `0x95800b68742FD083ECaee37FFE93Ad3333C7CF01`
- Deployment transaction: `0x8e145c29833c52d03c40da362f5d9301e84799a7343b1d4fc197de8a6ba77295`
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`
- Deployed/repository source SHA-256: `d8a5c5fb78068480fdbb829ea251254c6d9c07b84d0e65e6bd4a8f2b92e04ce0`
- Source proof: `gen_getContractCode` response decoded from base64 and compared byte-for-byte; both files were 35,680 bytes.
- Deployment source commit: `c5e6690b3d85200de83b5edb7ecf761db477d747`

The deployed source above is the previous version. The current repository contract source has SHA-256 `eff129604484b9d449660e265a435e4a1677a1c6548908cf7eee04068a0be5d3`; it fixes the live evidence-classification issue and awaits its own deployment. Do not configure production with the previous contract address.

The previous deployment used the explicitly supplied throwaway Studionet wallet. A separate supplied wallet was used for live-cycle proof. Those test transactions exposed validators classifying usable fetched evidence as `UNAVAILABLE`.

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

The deployment script verifies the live RPC `eth_chainId` result is `0xf22f` (decimal `61999`), then runs the local CLI with the explicit RPC and `--contract contracts/truss_registry.py`. It retrieves source through `gen_getContractCode`, decodes the full returned source, and compares the complete bytes rather than searching CLI-formatted output. The deployed transaction and byte match are recorded in `deployment-manifest.public.json`.

It also requires `TRUSS_DEPLOY_ACCOUNT_NAME` and `TRUSS_DEPLOY_AUTHORIZED_ADDRESS`, then verifies through the local CLI that the named account is active, unlocked, has the exact authorized address, and has a positive Studionet GEN balance. It refuses to silently use the CLI's default account. Ifem must set those values only for an account she owns and explicitly authorizes for TRUSS.

## Outstanding blockers

Semantic validation is pinned to GenVM `v0.3.0-rc7`, whose `py-genlayer` runner hash exactly matches the contract's preserved dependency header. The newer `genlayerlabs-genvm-manager-v0.6.0-rc5` artifact has an incompatible archive layout for linter 0.11.0 and does not contain the requested runner at the expected legacy path. `scripts/check-contract.mjs` sets `GENVM_VERSION=v0.3.0-rc7` to keep the actual validation command reproducible. `npm run contracts:check` passed AST lint and SDK semantic validation.

Frontend: `npm ci`, `npm run typecheck`, and `npm run build` passed. `npm run test:e2e` uses the production build and exits cleanly on Windows; the current browser suite has 7 passing cases covering routes, wallet connect/disconnect, signature rejection, chain switching, wrong-network state, and account/chain changes. Transaction finality behavior still requires deeper browser lifecycle proof.

The exact origin `https://github.com/Ifem1/truss.git` remains configured in this extracted folder. Previously pushed commit `c5e6690b3d85200de83b5edb7ecf761db477d747` passed GitHub Actions run [37500893962](https://github.com/Ifem1/truss/actions/runs/37500893962). Follow-up commit `244cba2` contains the source-verification fix and public synthetic test fixtures but is not yet pushed: cached GitHub credentials are invalid, and the active credential is not the authorized `Ifem1` identity. No push will be made under a different account. A fresh Ifem1 device authorization is pending. The user's Vercel deployment and production provenance remain pending.

## Vercel environment values

Set these project environment variables for the user's Vercel deployment:

- `NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS` — set to the replacement contract address after the pending source is deployed and verified.
- `NEXT_PUBLIC_GENLAYER_RPC` — optional; defaults to `https://studio.genlayer.com/api`.
- `NEXT_PUBLIC_GENLAYER_EXPLORER` — optional; defaults to `https://explorer-studio.genlayer.com`.

The address-specific production build was proven against the previous deployment. Rebuild with the replacement contract address after the follow-up source is deployed. Deploy Vercel from the final pushed source commit and record Vercel's production URL, deployment ID, and source commit in the manifest after deployment.

Vercel production URL and provenance are not recorded yet. Live lifecycle transactions are also outstanding.
