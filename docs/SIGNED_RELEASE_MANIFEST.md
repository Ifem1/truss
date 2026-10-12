# Policy-authorized RSA-signed release manifest

Status as of 2026-10-13: implemented in the current source and exercised in GenVM Direct Mode; not yet deployed or proven in a live StudioNet lifecycle.

## What is verified

For policies created with `create_policy_with_signed_manifest`, the registry freezes an RSA public modulus and exponent, a SHA-256 key fingerprint, and the numeric GitHub repository ID in the immutable policy digest. The required `PROVENANCE` issuer role must be configured separately from the publisher role. During assessment, the contract fetches exactly one manifest, checks its raw-byte SHA-256 against the designated issuer's attestation, requires canonical JSON, checks the fixed schema and candidate/repository/tag/artifact/CI fields, and verifies RSASSA-PKCS1-v1_5 with SHA-256 inside GenVM using modular exponentiation and exact RFC 8017 encoded-message comparison.

The signed contents are independent of the response URL: following a redirect to altered or substituted bytes cannot satisfy both the issuer-committed content digest and RSA signature. The contract does not observe or authenticate the final HTTP origin. The signer key fingerprint identifies the frozen key, not a person or organization. The RSA signature authenticates that the corresponding private key signed the manifest's claims; it does not prove the claims are true, establish organizational independence, or prove that GitHub independently endorsed the CI result. The workflow's manifest generator checks GitHub repository/run metadata before signing, but the contract treats those fields as key-signed claims. GitHub Sigstore artifact attestation remains supplementary and is not verified by the contract.

## Verified GitHub source attestation

The GitHub Actions run for source commit `7b1b341424ced0c9e53d03d7b60aba7c0a69b9f4` passed CI and produced a Sigstore SLSA provenance attestation: [run 38321792795](https://github.com/Ifem1/truss/actions/runs/38321792795). GitHub CLI `gh attestation verify` accepted the archive with repository `Ifem1/truss`, signer workflow `.github/workflows/ci.yml`, and source ref `refs/heads/master`. The verified signer identity is `https://github.com/Ifem1/truss/.github/workflows/ci.yml@refs/heads/master`; repository ID is `1407596595`; commit is `7b1b341424ced0c9e53d03d7b60aba7c0a69b9f4`; Rekor timestamp is `2026-10-13T00:25:53+01:00`.

The evidence is preserved in [`docs/attestations/7b1b341/`](attestations/7b1b341/): archive SHA-256 `228e94014940f9c4a329a47438a304153231fbe1ef89d06e0eaf95c569e66233`, bundle SHA-256 `0a7260344a97af061121759e53a2e9758237bdb4d03ca0674c5caf881a827e8a`, and verifier output SHA-256 `1b1d70be1f45e7d5d26d531b83673641b84eb1e0d439464ccae4ad36eb76cf51`. This attests the source archive at the `master` commit. It does not attest a versioned release, the RSA manifest, a third-party review, or the truth of the repository's tests.

## Test evidence

`tests/direct/test_rsa_signature_probe.py` exercises valid, altered-message, forged-signature, wrong-signer, wrong-key, malformed-encoding, and unsupported-exponent cases against the isolated verifier. `tests/direct/test_signed_manifest.py` exercises valid policy-bound evidence, candidate mismatch, altered manifest, wrong repository, wrong key, malformed JSON, a full Direct Mode admission, and a forged-signature assessment that leaves the admitted head and pending activation unchanged. These are local GenVM tests, not live network proofs.

The implementation is a small contract-compatible verifier using Python integer `pow`, `hashlib.sha256`, and strict RFC 8017 encoding comparison. It is informed by RFC 8017 and the Python-RSA verification approach, but it is not copied from or independently audited as a cryptographic library. Direct Mode establishes runtime compatibility and test-vector behavior; it is not a security audit or a live consensus execution-cost measurement.

## Release tooling

`scripts/create-signed-release-manifest.mjs` creates a deterministic source archive from an annotated tag and signs the canonical manifest using an RSA private key supplied through `TRUSS_RELEASE_SIGNING_KEY_B64`. `.github/workflows/release-manifest.yml` runs on `master`, checks for a successful CI push run for the exact tag commit, creates GitHub Sigstore provenance for the archive, verifies the exact bundle with GitHub CLI while pinning repository/workflow/source-ref identity, saves the verification JSON, and attaches the manifest, archive, public key, verification result, and bundle to the release. The signing secret must be provisioned and controlled according to the selected policy's trust model. Anyone with that secret can make claims accepted by a policy freezing its public key. Do not describe that key as organizationally independent based solely on a different wallet or secret.

The currently provisioned release-signing public key is retained at [`docs/attestations/truss-release-signer-public-key.json`](attestations/truss-release-signer-public-key.json), with key ID `sha256:95d4d586159d320bea7a3cdc3e09180099f49d1950d857a03188cccd66771064` (RSA-2048, exponent 65537). Its private key is supplied to the GitHub Actions workflow through the repository secret `TRUSS_RELEASE_SIGNING_KEY_B64`; it is not stored in the repository. This is a repository-controlled signing key, not an independent third-party identity. No policy has yet frozen this key and no live contract has verified a manifest signed by it.

The first release-workflow dispatch for tag `v0.1.3` failed before producing or publishing a release because the archive helper passed the unsupported Node encoding name `buffer` to `spawnSync`. Local verification then exposed two additional Windows/runtime details: Git required an explicit safe-directory setting in this checkout, and Node's default 1 MiB child-process buffer was smaller than the 1.45 MB archive. The helper now captures binary stdout without text decoding, scopes Git's safe-directory setting to the working repository, allows up to 64 MiB, and rejects larger archives. The failed run is not release evidence; a new annotated tag on a green master commit is required to retry.

Before creating a successor policy, independently inspect and retain the public key, its SHA-256 key ID, exact repository numeric ID, release manifest and archive, GitHub Actions run, and `gh attestation verify` result. The policy's issuer must attest the exact manifest bytes. The publisher and issuer wallet roles remain separate at the contract level; their human controllers may still be the same organization, which is explicitly not established.

## Deployment boundary

The existing immutable registry and gate at `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b` predate this verifier. No redeployment, policy creation, live admission, finalized gate activation, or acknowledgment for this RSA path has been performed. Production remains on its historical configuration. Do not claim the new contract path enforces production until source parity, a successful StudioNet 61999 lifecycle, negative live checks, frontend cutover, and CI on the final commit are independently verified.

Current committed source hashes from `npm run source:hash` (not deployed hashes): registry `58d9c38efa540c8d09276338ab2886dce9c8d3b5c12e1b325e48614adfdb9982`; gate `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`. The latter remains byte-identical to its historical deployed source.

## Standards and source references

- [RFC 8017, PKCS #1 v2.2](https://www.rfc-editor.org/rfc/rfc8017.html), including RSASSA-PKCS1-v1_5 and EMSA-PKCS1-v1_5 encoding.
- [Python-RSA PKCS#1 verification source](https://github.com/sybrenstuvel/python-rsa/blob/main/rsa/pkcs1.py), consulted as a reviewed-source implementation reference. The contract verifier is a compact adaptation of the mathematical verification steps, not that package itself.
- [GitHub CLI attestation verification](https://cli.github.com/manual/gh_attestation_verify), for supplementary artifact provenance verification outside GenVM.
- [GitHub `actions/attest`](https://github.com/actions/attest), which produces a SLSA build provenance attestation and exposes the bundle path used by the workflow verifier.
