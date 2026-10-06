# Architecture

TRUSS V1 deliberately uses one Intelligent Contract because policy, candidate, evidence history and admitted lineage form one trust boundary.

## Flow

user → Next.js → injected EIP-1193 wallet → `TrussRegistry` → GenLayer validators → contract state → frontend

There is no application backend.

## Contract-owned state

- immutable policies;
- lineage owner;
- active policy;
- exact candidate coordinates;
- append-only evidence rounds;
- append-only assessment attempts;
- current admitted head;
- admitted history.

## Decision design

The model classifies bounded fields. The contract derives the top-level verdict deterministically. Validators independently fetch and classify the same evidence.

## Finality

The frontend must never treat submission or acceptance as final admission. After finalization it must re-read candidate and admitted-head state from the contract.
