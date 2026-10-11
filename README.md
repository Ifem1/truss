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

The registry is one Intelligent Contract:

`contracts/truss_registry.py`

It owns:

- immutable admission policies and policy lineage;
- exact candidate release identity;
- append-only evidence rounds;
- append-only assessment attempts;
- admitted release lineage.

`contracts/release_activation_gate.py` is a separate consumer with its own protected activation state. The registry delivers admissions through authenticated finalized child messages; the gate accepts only the configured registry, frozen policy, next sequence, matching predecessor and designated operator. It acknowledges activation through a finalized child message before the registry releases its one-admission lock. It does not own admission decisions.

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

**Current release status (2026-10-11):** TRUSS production is verified on Studionet 61999. The hardened registry `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and successor-policy gate `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b` are byte-matched to their deployed sources. The GitHub-backed candidate `truss-actions-v012-candidate-successor` was finalized `ADMITTED`, delivered through the finalized-message path, activated, and acknowledged. Canonical registry and gate reads agree on the candidate; registry pending activation is clear. Production Vercel now uses this verified pair. The earlier frozen policy and its `INSUFFICIENT_EVIDENCE` candidate remain immutable history. Issuer organizational independence is not established, and GitHub Actions evidence is issuer-committed run metadata only. See the [live release matrix](docs/LIVE_RELEASE_MATRIX.md), [deployment manifest](deployment-manifest.public.json), and [deployment status](docs/DEPLOYMENT.md).

Policy authoring runs the exact tag-ref, annotated-tag-object and canonical Actions-run URLs against the selected GitHub repository and configured role scopes before enabling the irreversible publication control. Advanced JSON goes through the same check.

The tag ref, annotated tag object, and Actions run were fetched from canonical GitHub API URLs and their exact response bytes were committed by the configured issuer. The tag resolves to commit `52aca980fe74147efee7b79c3e19652dc2d3bfa7`; the Actions run reports completed success and matching repository, commit, workflow and push event. The production candidate and finalized-message lifecycle are recorded in the live release matrix. GitHub Actions metadata remains issuer-committed metadata, not independent proof of workflow authorship or test quality. Issuer wallet separation does not prove organizational independence. Browser transaction-flow tests use controlled RPC fixtures and are not the live lifecycle proof.

The pinned SDK's web fetch API does not expose redirect controls, so final redirect origin is not claimed as verified. Admission-critical sources are restricted to canonical GitHub API endpoint shapes and frozen role scopes; evidence is issuer-committed by exact response-byte SHA-256, and registry provenance checks validate repository, tag-to-commit, workflow, event and run metadata. Unsupported URLs are rejected by the immutable policy. This bounds source substitution through issuer-authenticated content and endpoint-specific provenance, while retaining the limitation that the final network origin itself is not observable.
