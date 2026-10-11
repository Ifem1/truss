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

**Current release status (2026-10-11):** the hardened registry `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and production-lineage gate `0xCA9AAa4C18f51e3454ce50dE65c76e52F56C550D` are deployed on Studionet and byte-match repository source. A separate throwaway lineage completed admission, finalized-message activation, acknowledgment and contract-level rejection proofs; it is test evidence only. The frozen production candidate `truss-actions-v012-candidate` remains retryable after one `INSUFFICIENT_EVIDENCE` assessment. Its frozen policy only permits `RELEASE_IDENTITY` evidence under `/repos/Ifem1/truss/git/ref/tags/`, but the required annotated tag object is served under `/repos/Ifem1/truss/git/tags/`. The contract rejects that URL outside the committed scope, so the candidate cannot receive the missing tag-object commitment under its current policy. The original publisher and issuer accounts are locally unlocked; no throwaway signer was used for production. Production frontend remains on its prior registry/gate pair pending a valid production admission and activation. See the [live release matrix](docs/LIVE_RELEASE_MATRIX.md), [deployment manifest](deployment-manifest.public.json), and [deployment status](docs/DEPLOYMENT.md).

The tag ref, annotated tag object, and Actions run were fetched from canonical GitHub API URLs and their exact response bytes hashed. The tag resolves to commit `52aca980fe74147efee7b79c3e19652dc2d3bfa7`; the Actions run reports completed success and matching repository, commit, workflow and push event. These public bytes do not overcome the frozen evidence-scope mismatch. GitHub Actions metadata remains issuer-committed metadata, not independent proof of workflow authorship or test quality. Issuer wallet separation does not prove organizational independence. Browser transaction-flow tests use controlled RPC fixtures; they do not establish the blocked production lifecycle.

The pinned SDK's web fetch API does not expose redirect controls. An observed 3xx is rejected, but automatic redirect-following cannot be ruled out. This is an unresolved evidence-scope limitation.
