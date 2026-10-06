# Validation Record

This file records local checks only. It is not deployment or production evidence.

As of 2026-10-06:

- Direct Mode: 30 passed, no skips (synthetic fixtures).
- Python unit tests: 2 passed.
- Repository preflight: passed.
- GenVM AST lint: passed.
- GenVM AST and semantic validation: passed via `npm run contracts:check`, pinned to the compatible GenVM `v0.3.0-rc7` runner hash in the contract dependency header.
- `npm ci`, TypeScript typecheck, Next.js production build, and Playwright browser tests: passed (3 tests; `npm run test:e2e` starts and stops the production server).
- Studionet deployment, live transactions, deployed-source byte match and production hosting: not performed.

See `docs/REVIEW_EVIDENCE.md` and `docs/DEPLOYMENT.md` for full status and limitations.
