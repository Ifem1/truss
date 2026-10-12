# Independent provenance gate

## Current state

The registry can compare GitHub API-shaped fields and bind exact fetched bytes to a wallet transaction. Neither is an authenticated release claim: an issuer wallet proves only wallet control, GitHub-shaped JSON is not a cryptographic signature, and the pinned GenLayer web interface does not expose the final redirect origin. The registry therefore treats this path as `UNVERIFIED` and returns `INSUFFICIENT_EVIDENCE` for issuer-bound assessments. It does not emit an authenticated admission or finalized admission message for that candidate. Existing finalized records and the active production release are historical state and are not rewritten.

The verifier intentionally requires all of these facts before an authenticated admission could be produced: canonical repository identity, existence of the exact commit object, a tag/release resolving to that commit, a cryptographically verified release or attestation signature, a trusted public credential identifying an issuer independent of the publisher and policy owner, issuer authority over the exact evidence subject, and authenticated source origin (or a signed bundle that makes network redirect origin immaterial). The current contract does not implement those cryptographic verifiers; no API metadata or wallet digest is promoted to proof.

## Exact external material required

An independent person or organization must supply:

1. Their publicly attributable name, organization, official domain, and a public source establishing their role and independence from the repository publisher and policy owner.
2. A public signing identity with a verifiable trust chain (for example, a Sigstore identity/certificate rooted in the public trust root, or an X.509 certificate rooted in an explicitly accepted CA). A wallet address by itself is not sufficient.
3. A signed DSSE/in-toto or equivalent attestation bundle, including the signature, certificate/credential chain, transparency-log inclusion material where applicable, and trusted-root data. The signed subject must bind the canonical repository `Ifem1/truss`, the exact 40-hex commit, release/tag identity and object, and the precise evidence bytes/digests. The predicate must state the issuer's authority and independent review scope.
4. A public verification procedure and immutable source URL for the bundle. Verification must validate cryptography, signer identity, subject digest, repository, commit, tag relationship, issuer scope, and trust root; it must not trust API response fields or the URL's final redirect.

No such independent credential or signed statement is present in the repository or the current production evidence. Do not submit a live production candidate or activate a release as independently authenticated until the external material exists and a pinned, tested contract-compatible verifier validates it. No private key is requested or needed for review; the public credential and signed bundle are sufficient inputs.

## Reproduction

Run `npm run test:direct`. The issuer-commitment tests demonstrate that digest binding remains intact, while the provenance tests demonstrate that API-shaped tag and Actions metadata do not satisfy the authentication gate. The finalized-message and gate suites continue to test delivery mechanics with explicitly synthetic fixtures; they are not live provenance evidence.
