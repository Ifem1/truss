# Implementation and security audit record

Baseline: `045b7460b8e2b7ac224187b51959263bd64e511d`.

## Implemented in this working branch

- Any wallet can initiate an assessment of an open candidate; the caller supplies only a candidate key and cannot replace the frozen policy, identity or evidence.
- A candidate owner can abandon an unresolved candidate. Any wallet can do so after a 30-day chain-time delay. A third inconclusive assessment becomes terminal `EXHAUSTED`. Both paths retain all evidence rounds and assessment attempts.
- A commit SHA cannot be resubmitted under another release label with the same policy and predecessor.
- Missing, duplicate or extra validator decision fields fail closed instead of preserving a favorable first entry.
- `ReleaseActivationGate` persists a protected activation only for its configured operator after reading the configured registry's latest finalized head, candidate and policy. It checks the exact lineage, repository, policy digest, `ADMITTED` status and admitted attempt. Replay and duplicate activation fail.
- The release dossier exposes independent assessment, abandonment and activation actions, and re-reads finalized contract state after successful receipts. It warns that fetched hashes do not authenticate issuers.
- Both contracts pass the local GenVM lint and compile checks. Direct Mode consumer tests use a cross-contract view hook and are not live cross-contract evidence.

## Unresolved security findings

1. **Issuer authenticity:** A policy owner still chooses URL scopes and opens candidates. The current registry does not authenticate a publisher, issuer or cryptographic attestation. Two wallets controlled by the same actor are not shown as independently controlled. A content digest only identifies bytes. This remains a critical gap for policies requiring independent third-party evidence.
2. **Repository provenance:** The contract does not deterministically verify repository membership, exact commit existence, tag resolution, CI run association or signed attestation subjects. Semantic model classifications can therefore admit self-declared material that a strict provenance policy should reject.
3. **Redirect origin:** The pinned `gl.nondet.web.get` API does not expose the final origin or a redirect-disable control. An automatically followed redirect can escape a configured host/path scope. The current code rejects visible 3xx responses, which does not solve invisible redirects.
4. **Live consumer proof:** The new registry and activation gate have not been deployed. Direct Mode tests use a simulated cross-contract read response; no finalized Studionet activation, rejection or source-byte comparison exists for the new source.
5. **Production cutover:** The public Vercel frontend and historical registry address still refer to the baseline system. The current source intentionally has no default contract address; production configuration must be updated only after a verified deployment.

These findings prevent claiming independent release provenance, a trusted final activation lifecycle or complete deployment. The local tests establish behavior only within their stated fixture boundaries.

## Verification performed

- Repository-local CLI: `0.39.1`.
- Studionet RPC `eth_chainId`: `0xf22f` (61999).
- Active configured CLI account: `truss-deployer`, address `0x39680bd423437c0eaa18493629652821ec672c61`, unlocked with positive balance at the time of the check. No transaction was signed for this branch.
- Contract lint and semantic validation: both contracts passed.
- Direct Mode: 36 passed.
- Unit tests: 2 passed.
- TypeScript typecheck and production build: passed.
- Browser tests: 16 passed using controlled RPC and injected-wallet fixtures, including nonowner assessment and activation finality/state reread.

The deployment and CI status of this branch must be recorded separately after publication. Do not reuse the historical deployment receipts as proof of this source.
