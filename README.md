# TRUSS

**Independent software release admission on GenLayer.**

TRUSS is a GenLayer-native release-admission ledger. An adopter freezes a software admission policy, opens an exact release candidate bound to a repository and commit SHA, supplies role-bound public evidence, and asks GenLayer validators to decide whether the candidate satisfies the frozen policy.

A candidate becomes the admitted head only after a real GenLayer assessment finalizes with `ADMITTED`. `REJECTED`, `INSUFFICIENT_EVIDENCE`, and `CONFLICTING_EVIDENCE` never advance the lineage.

## Canonical target

- Network: GenLayer Studionet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Repository-local GenLayer CLI: `0.39.1`
- Frontend: Next.js App Router + TypeScript
- Wallet: injected EIP-1193 only
- Application backend: none

**Do not use Studio Dev / chain 61997.**

## V1 trust boundary

TRUSS answers one narrow question:

> Given this adopter's frozen policy, this exact software release and commit, and this role-bound public evidence, does the release qualify to become the next admitted version?

The contract deliberately does **not** claim that an admitted release is universally safe, bug-free, vulnerability-free, or suitable for everyone.

## Contract

V1 is intentionally one Intelligent Contract:

`contracts/truss_registry.py`

It owns:

- immutable admission policies and policy lineage;
- exact candidate release identity;
- append-only evidence rounds;
- append-only assessment attempts;
- admitted release lineage.

The owner cannot directly mark a candidate admitted.

## Intelligent outcome

The GenLayer assessment produces one of:

- `ADMITTED`
- `REJECTED`
- `INSUFFICIENT_EVIDENCE`
- `CONFLICTING_EVIDENCE`

The LLM classifies identity, evidence roles and policy criteria. Deterministic contract code derives the final verdict from those bounded classifications. Validators independently fetch the evidence and independently classify the same frozen question.

## Evidence roles

V1 supports:

- `RELEASE_IDENTITY`
- `TEST_STATUS`
- `CHANGE_DISCLOSURE`
- `SECURITY_STATUS`
- `MIGRATION_GUIDE`
- `PROVENANCE`

Each policy selects its required roles and the admissible host/path scopes for each role.

## Frontend routes

- `/` — admitted lineages and product landing
- `/policy/new` — create an immutable admission policy
- `/policy/[policyKey]` — inspect policy, active version and release lineage
- `/release/new` — open a candidate release
- `/release/[candidateKey]` — release dossier, evidence matrix and assessment history

## Mandatory completion evidence

Submission readiness also requires verifiable evidence of:

1. a real Studionet 61999 deployment;
2. exact deployed-source verification;
3. a real `ADMITTED` lifecycle;
4. a real `REJECTED` lifecycle;
5. a real retryable `INSUFFICIENT_EVIDENCE` or `CONFLICTING_EVIDENCE` lifecycle followed by an appended evidence round;
6. an admitted-head advance only after finality;
7. frontend-to-contract interaction through an injected EIP-1193 wallet;
8. production frontend source provenance;
9. adversarial Direct Mode coverage.

See `TRUSS_CODEX_MASTER_HANDOFF.txt` before modifying anything.

## Current implementation status

**Current status:** the final source is deployed to Studionet 61999 at `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`; deployment finalized and the complete deployed source byte-matched repository source SHA-256 `eff129604484b9d449660e265a435e4a1677a1c6548908cf7eee04068a0be5d3`. Fresh synthetic live proofs against that exact deployment cover admitted-head advancement, rejection without head movement, an insufficient-evidence attempt plus appended round and preserved reassessment, duplicate/replay, invalid scope, unauthorized policy mutation, and stale-predecessor protection. Synthetic evidence is not real-world release or security evidence.

Local verification is green: 31 Direct Mode tests, 2 unit tests, preflight, contract validation, TypeScript typecheck, production build and 7 browser tests. The browser suite does not yet exercise full transaction finality and refresh recovery. The local follow-up HEAD still needs to be pushed to the exact `Ifem1/truss` remote after GitHub authentication as `Ifem1`. Vercel deployment and source provenance are left for the user, so the project remains **not submission-ready** until the final source is published and frontend provenance is recorded. See [review evidence](docs/REVIEW_EVIDENCE.md) and [deployment status](docs/DEPLOYMENT.md).

The pinned SDK's web fetch API does not expose redirect controls. An observed 3xx is rejected, but automatic redirect-following cannot be ruled out. This is an unresolved evidence-scope limitation.
