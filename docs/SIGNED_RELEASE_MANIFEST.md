# Policy-authorized RSA-signed release manifest

Status as of 2026-10-13: implemented in the current source and exercised in GenVM Direct Mode; not yet deployed or proven in a live StudioNet lifecycle.

## What is verified

For policies created with `create_policy_with_signed_manifest`, the registry freezes an RSA public modulus and exponent, a SHA-256 key fingerprint, and the numeric GitHub repository ID in the immutable policy digest. The required `PROVENANCE` issuer role must be configured separately from the publisher role. During assessment, the contract fetches exactly one manifest, checks its raw-byte SHA-256 against the designated issuer's attestation, requires canonical JSON, checks the fixed schema and candidate/repository/tag/artifact/CI fields, and verifies RSASSA-PKCS1-v1_5 with SHA-256 inside GenVM using modular exponentiation and exact RFC 8017 encoded-message comparison.

The signed contents are independent of the response URL: following a redirect to altered or substituted bytes cannot satisfy both the issuer-committed content digest and RSA signature. The contract does not observe or authenticate the final HTTP origin. The signer key fingerprint identifies the frozen key, not a person or organization. The RSA signature authenticates that the corresponding private key signed the manifest's claims; it does not prove the claims are true, establish organizational independence, or prove that GitHub independently endorsed the CI result. The workflow's manifest generator checks GitHub repository/run metadata before signing, but the contract treats those fields as key-signed claims. GitHub Sigstore artifact attestation remains supplementary and is not verified by the contract.

## Test evidence

`tests/direct/test_rsa_signature_probe.py` exercises valid, altered-message, forged-signature, wrong-signer, wrong-key, malformed-encoding, and unsupported-exponent cases against the isolated verifier. `tests/direct/test_signed_manifest.py` exercises valid policy-bound evidence, candidate mismatch, altered manifest, wrong repository, wrong key, malformed JSON, a full Direct Mode admission, and a forged-signature assessment that leaves the admitted head and pending activation unchanged. These are local GenVM tests, not live network proofs.

The implementation is a small contract-compatible verifier using Python integer `pow`, `hashlib.sha256`, and strict RFC 8017 encoding comparison. It is informed by RFC 8017 and the Python-RSA verification approach, but it is not copied from or independently audited as a cryptographic library. Direct Mode establishes runtime compatibility and test-vector behavior; it is not a security audit or a live consensus execution-cost measurement.

## Release tooling

`scripts/create-signed-release-manifest.mjs` creates a deterministic source archive from an annotated tag and signs the canonical manifest using an RSA private key supplied through `TRUSS_RELEASE_SIGNING_KEY_B64`. `.github/workflows/release-manifest.yml` runs on `master`, checks for a successful CI push run for the exact tag commit, creates GitHub Sigstore provenance for the archive, verifies the exact bundle with GitHub CLI while pinning repository/workflow/source-ref identity, saves the verification JSON, and attaches the manifest, archive, public key, verification result, and bundle to the release. The signing secret must be provisioned and controlled according to the selected policy's trust model. Anyone with that secret can make claims accepted by a policy freezing its public key. Do not describe that key as organizationally independent based solely on a different wallet or secret.

Before creating a successor policy, independently inspect and retain the public key, its SHA-256 key ID, exact repository numeric ID, release manifest and archive, GitHub Actions run, and `gh attestation verify` result. The policy's issuer must attest the exact manifest bytes. The publisher and issuer wallet roles remain separate at the contract level; their human controllers may still be the same organization, which is explicitly not established.

## Deployment boundary

The existing immutable registry and gate at `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b` predate this verifier. No redeployment, policy creation, live admission, finalized gate activation, or acknowledgment for this RSA path has been performed. Production remains on its historical configuration. Do not claim the new contract path enforces production until source parity, a successful StudioNet 61999 lifecycle, negative live checks, frontend cutover, and CI on the final commit are independently verified.

Current committed source hashes from `npm run source:hash` (not deployed hashes): registry `58d9c38efa540c8d09276338ab2886dce9c8d3b5c12e1b325e48614adfdb9982`; gate `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`. The latter remains byte-identical to its historical deployed source.

## Standards and source references

- [RFC 8017, PKCS #1 v2.2](https://www.rfc-editor.org/rfc/rfc8017.html), including RSASSA-PKCS1-v1_5 and EMSA-PKCS1-v1_5 encoding.
- [Python-RSA PKCS#1 verification source](https://github.com/sybrenstuvel/python-rsa/blob/main/rsa/pkcs1.py), consulted as a reviewed-source implementation reference. The contract verifier is a compact adaptation of the mathematical verification steps, not that package itself.
- [GitHub CLI attestation verification](https://cli.github.com/manual/gh_attestation_verify), for supplementary artifact provenance verification outside GenVM.
- [GitHub `actions/attest`](https://github.com/actions/attest), which produces a SLSA build provenance attestation and exposes the bundle path used by the workflow verifier.
