# TRUSS V1 Design Specification

## Product

TRUSS is a release-admission ledger for teams that consume public software.

The durable product object is an **admitted release lineage**, not a one-off score.

Example:

`v2.6.1 → v2.7.0 → v2.7.1`

A release enters that lineage only when GenLayer validators independently agree that it satisfies an adopter's frozen policy.

## User

Primary V1 user: an engineering/security/protocol team adopting a public software project.

The policy owner is the adopter. It need not be the upstream software maintainer.

## Trust problem

A central scanner can check many facts, but then the scanner becomes the authority deciding whether a release qualifies. TRUSS instead makes the admission decision a bounded, public, independently validated GenLayer judgment.

## Core loop

1. Create immutable policy.
2. Open exact release candidate.
3. Freeze release coordinate and evidence.
4. Ask GenLayer to assess.
5. Wait for finality.
6. Advance admitted lineage only on ADMITTED.
7. Repeat for the next release.

## Intelligent question

> Given policy P, exact candidate R and evidence round E, does R satisfy P sufficiently to become the next admitted release?

## Bounded classifications

Identity:
- MATCH
- MISMATCH
- UNVERIFIED

Criteria:
- SATISFIED
- VIOLATED
- UNKNOWN
- CONFLICTING

Evidence roles:
- SUPPORTS
- CONTRADICTS
- NEUTRAL
- UNAVAILABLE

Verdict:
- ADMITTED
- REJECTED
- INSUFFICIENT_EVIDENCE
- CONFLICTING_EVIDENCE

## Deterministic verdict derivation

The contract should derive the verdict from structured classifications wherever possible.

A model should not be able to return `ADMITTED` while also classifying the release identity as unverified or a required criterion as violated.

## Append-only attempts

Retry is allowed only after insufficient or conflicting evidence.

Evidence round N+1 never replaces round N.
Assessment attempt N+1 never replaces attempt N.

## Concurrency

Candidate admission must be predecessor-bound.

If candidate B and candidate C both point to admitted head A, and B advances the lineage first, C must no longer be able to advance the lineage from A.

## No backend

Canonical state is entirely in the contract.

The browser may retain non-authoritative convenience state only.

## V1 excludes

- post-admission revocation;
- private repository support;
- package installation;
- automated deployment;
- tokens;
- marketplace;
- DAO;
- backend crawler;
- server AI;
- multi-chain support.

A future milestone can add post-admission reassessment/revocation using newly discovered evidence while preserving historical admission.
