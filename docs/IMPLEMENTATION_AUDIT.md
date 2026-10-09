# Implementation and security audit record

Baseline: `045b7460b8e2b7ac224187b51959263bd64e511d`.

## Implemented in this working branch

- Any wallet can initiate an assessment of an open candidate; the caller supplies only a candidate key and cannot replace the frozen policy, identity or evidence.
- An adopter can freeze a distinct publisher wallet and designated issuer wallets for every required evidence role. Issuers append signed on-chain SHA-256 commitments bound to the exact candidate, policy, coordinate, URL and round. Only a complete sealed round can be assessed; fetched bytes with a mismatched digest are unusable.
- Issuer-bound assessments fetch the canonical GitHub commit and tag-ref endpoints and require the exact SHA, repository path and tag resolution to agree. Annotated tags are dereferenced to their target commit. Validators independently repeat these deterministic checks.
- A candidate owner can abandon an unresolved candidate. Any wallet can do so after a 30-day chain-time delay. A third inconclusive assessment becomes terminal `EXHAUSTED`. Both paths retain all evidence rounds and assessment attempts.
- A commit SHA cannot be resubmitted under another release label with the same policy and predecessor.
- Missing, duplicate or extra validator decision fields fail closed instead of preserving a favorable first entry.
- `ReleaseActivationGate` persists a protected activation only for its configured operator after reading the configured registry's latest finalized head, candidate and policy. It checks the exact lineage, repository, policy digest, `ADMITTED` status and admitted attempt. Replay and duplicate activation fail.
- The release dossier exposes independent assessment, abandonment and activation actions, and re-reads finalized contract state after successful receipts. It warns that fetched hashes do not authenticate issuers.
- Both contracts pass the local GenVM lint and compile checks. Direct Mode consumer tests use a cross-contract view hook and are not live cross-contract evidence.

## Unresolved security findings

1. **Issuer independence:** The adopter still chooses the publisher and issuer wallets and can choose colluding addresses. The signed transactions authenticate wallet control, not organizational identity or independence. Legacy policies still permit self-declared evidence. This remains a critical gap for policies requiring externally verified third-party evidence.
2. **CI and attestation provenance:** The corrected registry sends explicit GitHub headers and, when a `TEST_STATUS` source is a GitHub Actions run endpoint, deterministically checks the run ID, repository, exact candidate commit, completed/success state, configured workflow path and push event. This proves GitHub reports a successful hosted run for that commit. Repository maintainers control workflow content, so this does not establish the quality or independence of the checks; semantic classifications can still overstate what a successful run proves. Invisible redirects remain unobservable.
3. **Redirect origin:** The pinned `gl.nondet.web.get` API does not expose the final origin or a redirect-disable control. Issuer-bound content with substituted bytes fails the signed digest check, but the runtime still cannot prove the final host. Legacy policy redirects remain unsafe for source-origin claims.
4. **Live consumer proof:** The first registry revision failed closed because GitHub returned HTTP 403 without request headers. A diagnostic contract then finalized a host probe showing HTTP 200 from GitHub REST, raw GitHub, jsDelivr, and the Actions API with explicit headers. The corrected registry is deployed and byte-matched. A new tagged CI run and issuer-bound assessment are still required to prove admission, followed by a live gate activation. Direct Mode consumer tests use a simulated cross-contract read response.
5. **Production cutover:** The public Vercel frontend and historical registry address still refer to the baseline system. The current source intentionally has no default contract address; production configuration must be updated after a usable live lifecycle is demonstrated.

These findings prevent claiming independent release provenance, a trusted final activation lifecycle or complete production deployment. The live assessment demonstrated fail-closed behavior under inaccessible evidence, not release admission.

## Verification performed

- Repository-local CLI: `0.39.1`.
- Studionet RPC `eth_chainId`: `0xf22f` (61999).
- Deployment signer: `truss-deployer`, address `0x39680bd423437c0eaa18493629652821ec672c61`, unlocked with positive balance at signing.
- Contract lint and semantic validation: both contracts passed.
- Direct Mode: 40 passed.
- Unit tests: 2 passed.
- TypeScript typecheck and production build: passed.
- Browser tests: 16 passed using controlled RPC and injected-wallet fixtures, including nonowner assessment and activation finality/state reread.

The current deployment addresses, finalized receipts, source hashes and admitted GitHub Actions candidate are recorded in [deployment-manifest.current.json](../deployment-manifest.current.json). The historical production deployment is recorded separately. Tag-triggered CI passed for commit `52aca980fe74147efee7b79c3e19652dc2d3bfa7`. Gate activation is still pending Studionet consensus; the public frontend has not been cut over.
