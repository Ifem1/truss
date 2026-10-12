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

**Current release status (2026-10-13):** Historical production lifecycle evidence remains tied to the deployed registry `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and gate `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b`. The current source now includes a successor-policy path that checks a canonical RSA-SHA256 (RFC 8017) signed release manifest inside GenVM, with the RSA public key and GitHub numeric repository ID frozen into policy. Direct Mode proves a valid manifest can support admission and a forged signature cannot. This implementation is not deployed, has not completed a live lifecycle, and does not establish the signer's human or organizational identity or independent CI truth. Do not treat it as production enforcement until a reviewed release, deployment, and live lifecycle are complete. See [live release matrix](docs/LIVE_RELEASE_MATRIX.md), [RSA manifest design](docs/SIGNED_RELEASE_MANIFEST.md), [deployment manifest](deployment-manifest.public.json), and [trust limitations](docs/INDEPENDENT_PROVENANCE_REQUIREMENTS.md).

Policy authoring runs the exact tag-ref, annotated-tag-object and canonical Actions-run URLs against the selected GitHub repository and configured role scopes before enabling the irreversible publication control. Advanced JSON goes through the same check.

The historical candidate used canonical GitHub API URL shapes and issuer-committed response bytes. Its tag was unsigned; Actions metadata did not independently prove workflow authorship or test quality; and issuer wallet separation did not prove organizational independence. Browser transaction-flow tests use controlled RPC fixtures and are not live provenance proof.

The pinned SDK's web fetch API does not expose final redirect origin. The signed-manifest path makes a substituted response fail signature verification and also requires the fetched bytes to match an issuer-committed digest; it authenticates content under a policy-frozen RSA key, not the network origin or a real-world identity. Existing deployed contracts do not implement this new path. Current code has only Direct Mode evidence for it; no live admission or activation has yet been demonstrated.
