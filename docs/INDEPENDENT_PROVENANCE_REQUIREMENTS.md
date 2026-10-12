# Independent provenance gate

## Current state

Historical deployments and legacy policies can compare GitHub API-shaped fields and bind exact fetched bytes to a wallet transaction. Neither alone is an authenticated release claim. Current source additionally supports a successor-policy RSA-signed manifest path, described in [SIGNED_RELEASE_MANIFEST.md](SIGNED_RELEASE_MANIFEST.md), whose positive and negative behavior is tested in Direct Mode. It authenticates content under a frozen key, not the network origin or a real-world signer identity. Existing deployed contracts do not include this verifier; historical finalized records and active production release are unchanged.

The current RSA manifest path requires the policy-frozen key signature, fixed repository identity and ID, candidate commit and tag binding, artifact digest shape, canonical CI claim shape, and exact bytes committed by the designated issuer. A signed payload makes redirect substitution of the contents detectable, even though the runtime hides the final origin. It does not independently prove that the commit exists on GitHub or that the CI claim is true: those remain claims made by the signer. It also does not establish that the signer is independent of the publisher or policy owner. The stronger Sigstore certificate and transparency proofs below remain supplementary and are not enforced by the contract.

## GitHub build provenance now produced by CI

After the complete `verify` job succeeds on a push to `master`, `.github/workflows/ci.yml` archives the exact pushed Git tree and creates a GitHub artifact attestation for that archive. GitHub signs the attestation through its Actions OIDC/Sigstore flow, and the job retains both the exact archive bytes and the bundle as a workflow artifact. Pull requests do not receive signing permissions. This makes the source archive digest and GitHub workflow identity independently checkable, and a redirect cannot substitute different bytes without invalidating the subject digest.

Download the named artifact from the run for the commit being reviewed, then verify the retained archive with GitHub CLI. Keep the repository and signer workflow constraints (do not omit them):

```sh
gh run download <run-id> --repo Ifem1/truss \
  --name truss-source-attestation-<full-commit-sha> --dir evidence
gh attestation verify evidence/truss-source.tar.gz \
  --repo Ifem1/truss \
  --signer-workflow Ifem1/truss/.github/workflows/ci.yml \
  --format json
```

This proves GitHub's signed claim that the named workflow produced an attestation for the archive under the identified repository/workflow identity. Because repository maintainers control the workflow and its tests, this alone does not prove an independent human review, truthful test design, security, or issuer authority over a release. GenVM does not validate the Sigstore bundle, certificate identity, transparency proof, or trust root. The signed manifest verifier is a distinct RSA mechanism and does not claim to verify Sigstore.

## Optional external material needed to establish organizational independence

The RSA path can authenticate a policy-frozen key's signature without this material, but it cannot establish organizational independence. To make that stronger claim, an independent person or organization must supply:

1. Their publicly attributable name, organization, official domain, and a public source establishing their role and independence from the repository publisher and policy owner.
2. A public signing identity with a verifiable trust chain (for example, a Sigstore identity/certificate rooted in the public trust root, or an X.509 certificate rooted in an explicitly accepted CA). A wallet address by itself is not sufficient.
3. A signed DSSE/in-toto or equivalent attestation bundle, including the signature, certificate/credential chain, transparency-log inclusion material where applicable, and trusted-root data. The signed subject must bind the canonical repository `Ifem1/truss`, the exact 40-hex commit, release/tag identity and object, and the precise evidence bytes/digests. The predicate must state the issuer's authority and independent review scope.
4. A public verification procedure and immutable source URL for the bundle. Verification must validate cryptography, signer identity, subject digest, repository, commit, tag relationship, issuer scope, and trust root; it must not trust API response fields or the URL's final redirect.

No such independent credential or signed statement is present in the repository or current production evidence. The current RSA mode must therefore continue to disclose `issuer_independence: NOT_ESTABLISHED`. No private key is requested or needed for review; public credential and signed bundle are the necessary inputs for the stronger third-party identity claim.

## Reproduction

Run `npm run test:direct`. The issuer-commitment tests demonstrate that digest binding remains intact, while the provenance tests demonstrate that API-shaped tag and Actions metadata do not satisfy the authentication gate. The finalized-message and gate suites continue to test delivery mechanics with explicitly synthetic fixtures; they are not live provenance evidence.
