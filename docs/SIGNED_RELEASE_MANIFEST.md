# Policy-authorized RSA-signed release manifest

Status as of 2026-10-13: the RSA-SHA256 verifier was introduced in v0.1.4, packaged in signed release v0.1.5, deployed to an isolated Studionet 61999 registry/gate pair, and used in a finalized live admission, activation, and acknowledgment. Live invalid-candidate and unauthorized-operator probes also finalized with contract execution rollback. This pair is a separate validation lineage; production remains on its existing pair. Full transaction and state evidence is in [FINAL_STEWARD_MORE_INFO_CLOSEOUT.md](FINAL_STEWARD_MORE_INFO_CLOSEOUT.md).

## What is verified

For policies created with `create_policy_with_signed_manifest`, the registry freezes an RSA public modulus and exponent, a SHA-256 key fingerprint, and the numeric GitHub repository ID in the immutable policy digest. The required `PROVENANCE` issuer role must be configured separately from the publisher role. During assessment, the contract fetches exactly one manifest, checks its raw-byte SHA-256 against the designated issuer's attestation, requires canonical JSON, checks the fixed schema and candidate/repository/tag/artifact/CI fields, and verifies RSASSA-PKCS1-v1_5 with SHA-256 inside GenVM using modular exponentiation and exact RFC 8017 encoded-message comparison.

The signed contents are independent of the response URL: following a redirect to altered or substituted bytes cannot satisfy both the issuer-committed content digest and RSA signature. The contract does not observe or authenticate the final HTTP origin. The signer key fingerprint identifies the frozen key, not a person or organization. The RSA signature authenticates that the corresponding private key signed the manifest's claims; it does not prove the claims are true, establish organizational independence, or prove that GitHub independently endorsed the CI result. The workflow's manifest generator checks GitHub repository/run metadata before signing, but the contract treats those fields as key-signed claims. GitHub Sigstore artifact attestation remains supplementary and is not verified by the contract.

## Verified v0.1.4 release evidence

The annotated release [v0.1.4](https://github.com/Ifem1/truss/releases/tag/v0.1.4) resolves to commit `00d9e6f05aee6f1ba3246bbfa2e73831de31cc4b`; its tag object is `1331426e86914b821d6ba3a1ba79d7bc1ae4e712`. The tag CI run [38325869232](https://github.com/Ifem1/truss/actions/runs/38325869232) passed. The release-manifest workflow [38364374473](https://github.com/Ifem1/truss/actions/runs/38364374473) passed and published `release-manifest.json`, `truss-source.tar.gz`, `signer-public-key.json`, `sigstore-verification.json`, and `attestation.json`.

The manifest's RSA-SHA256 signature verified with the published RSA-2048 key (exponent 65537), key ID `sha256:95d4d586159d320bea7a3cdc3e09180099f49d1950d857a03188cccd66771064`. The source archive SHA-256 is `6cae9a0583295f843988997e2906a33a92eef5112c20dced244c1a7d2be47e6d`, matching the signed manifest. The manifest binds repository URL `https://github.com/Ifem1/truss`, repository ID `1407596595`, the exact commit, tag, annotated tag-object SHA, archive digest, and successful tag CI run. A local verification during release closeout confirmed the RSA signature, key fingerprint, archive digest, and those bindings.

GitHub CLI `gh attestation verify` also accepted the exact archive with `--repo Ifem1/truss`, signer workflow `.github/workflows/release-manifest.yml`, and source ref `refs/heads/master`. Its verified signer identity was `https://github.com/Ifem1/truss/.github/workflows/release-manifest.yml@refs/heads/master`; it bound the archive digest to source commit `00d9e6f05aee6f1ba3246bbfa2e73831de31cc4b`, repository ID `1407596595`, run [38364374473](https://github.com/Ifem1/truss/actions/runs/38364374473), and Rekor timestamp `2026-10-13T07:42:36Z`.

The complete evidence is preserved in [`docs/attestations/v0.1.4/`](attestations/v0.1.4/). SHA-256 values: manifest `31e3bb66b18470279cd8441641c9132c655d0e0cf048f60c61e5409d98a9c138`; public key `2b818c0e7e2e73bd8c7712fe20baa3eddd86eaab927b9b96021bf3a2795d4e70`; Sigstore bundle `d673a68afb2053385ab383e4cf089bf7ad0e2a3273acfd82c790ad4512e140fa`; GitHub verification output `c3cfd3094cf45437c3d2f49e5cd393cb175f9ca3bea18851d9083d97d4abcbf7`; archive `6cae9a0583295f843988997e2906a33a92eef5112c20dced244c1a7d2be47e6d`.

To reproduce GitHub's attestation check from the repository root with GitHub CLI installed:

```powershell
gh attestation verify docs/attestations/v0.1.4/truss-source.tar.gz `
  --bundle docs/attestations/v0.1.4/attestation.json `
  --repo Ifem1/truss `
  --signer-workflow Ifem1/truss/.github/workflows/release-manifest.yml `
  --source-ref refs/heads/master
```

The signed release manifest is an RSA key-authenticated claim; the GitHub Sigstore bundle is the independent GitHub workflow provenance for the source archive. Neither proves a third-party review or organizational independence of the release-key controller. The contract verifies the manifest's RSA signature; it does not verify the Sigstore bundle. To reproduce the local RSA, archive-digest, and annotated-tag checks from the repository root, run `npm run release:verify` (or pass a different evidence directory and expected tag to `node scripts/verify-signed-release-manifest.mjs <directory> <tag>`). The script explicitly reports that CI metadata is a signed claim and is not independently queried by the script; use the GitHub attestation verifier above for archive provenance.

## Earlier verified GitHub source attestation

The GitHub Actions run for source commit `7b1b341424ced0c9e53d03d7b60aba7c0a69b9f4` passed CI and produced a Sigstore SLSA provenance attestation: [run 38321792795](https://github.com/Ifem1/truss/actions/runs/38321792795). GitHub CLI `gh attestation verify` accepted the archive with repository `Ifem1/truss`, signer workflow `.github/workflows/ci.yml`, and source ref `refs/heads/master`. The verified signer identity is `https://github.com/Ifem1/truss/.github/workflows/ci.yml@refs/heads/master`; repository ID is `1407596595`; commit is `7b1b341424ced0c9e53d03d7b60aba7c0a69b9f4`; Rekor timestamp is `2026-10-13T00:25:53+01:00`.

The evidence is preserved in [`docs/attestations/7b1b341/`](attestations/7b1b341/): archive SHA-256 `228e94014940f9c4a329a47438a304153231fbe1ef89d06e0eaf95c569e66233`, bundle SHA-256 `0a7260344a97af061121759e53a2e9758237bdb4d03ca0674c5caf881a827e8a`, and verifier output SHA-256 `1b1d70be1f45e7d5d26d531b83673641b84eb1e0d439464ccae4ad36eb76cf51`. This attests the source archive at the `master` commit. It does not attest a versioned release, the RSA manifest, a third-party review, or the truth of the repository's tests.

## Test evidence

`tests/direct/test_rsa_signature_probe.py` exercises valid, altered-message, forged-signature, wrong-signer, wrong-key, malformed-encoding, and unsupported-exponent cases against the isolated verifier. `tests/direct/test_signed_manifest.py` exercises valid policy-bound evidence, candidate mismatch, altered manifest, wrong repository, wrong key, malformed JSON, a full Direct Mode admission, and a forged-signature assessment that leaves the admitted head and pending activation unchanged. These are local GenVM tests, not live network proofs.

The implementation is a small contract-compatible verifier using Python integer `pow`, `hashlib.sha256`, and strict RFC 8017 encoding comparison. It is informed by RFC 8017 and the Python-RSA verification approach, but it is not copied from or independently audited as a cryptographic library. Direct Mode establishes runtime compatibility and test-vector behavior; it is not a security audit or a live consensus execution-cost measurement.

## Release tooling

`scripts/create-signed-release-manifest.mjs` creates a deterministic source archive from an annotated tag and signs the canonical manifest using an RSA private key supplied through `TRUSS_RELEASE_SIGNING_KEY_B64`. `.github/workflows/release-manifest.yml` runs on `master`, checks for a successful CI push run for the exact tag commit, creates GitHub Sigstore provenance for the archive, verifies the exact bundle with GitHub CLI while pinning repository/workflow/source-ref identity, saves the verification JSON, and attaches the manifest, archive, public key, verification result, and bundle to the release. The signing secret must be provisioned and controlled according to the selected policy's trust model. Anyone with that secret can make claims accepted by a policy freezing its public key. Do not describe that key as organizationally independent based solely on a different wallet or secret.

The release-signing public key is retained at [`docs/attestations/truss-release-signer-public-key.json`](attestations/truss-release-signer-public-key.json), with key ID `sha256:95d4d586159d320bea7a3cdc3e09180099f49d1950d857a03188cccd66771064` (RSA-2048, exponent 65537). The private key is supplied to the GitHub Actions workflow through the repository secret `TRUSS_RELEASE_SIGNING_KEY_B64`; it is not stored in the repository. This is a repository-controlled signing key, not an independent third-party identity. A policy must freeze this key before a contract can verify a manifest signed by it; the `v0.1.4` evidence itself does not prove a live policy has done so.

The first release-workflow dispatch for tag `v0.1.3` failed before producing or publishing a release because the archive helper passed the unsupported Node encoding name `buffer` to `spawnSync`. Local verification then exposed two additional Windows/runtime details: Git required an explicit safe-directory setting in this checkout, and Node's default 1 MiB child-process buffer was smaller than the 1.45 MB archive. The helper now captures binary stdout without text decoding, scopes Git's safe-directory setting to the working repository, allows up to 64 MiB, and rejects larger archives. The failed run is not release evidence; a new annotated tag on a green master commit is required to retry.

The `v0.1.4` release evidence is now retained and inspectable. A successor policy must freeze the public key and repository ID and require the designated publisher and evidence issuer roles; their human controllers may still be the same organization. The RSA signature authenticates key possession and integrity of the claims, not the truth of every claim or the organizational independence of the signer. The Actions attestation authenticates the GitHub workflow's archive provenance, but the contract does not parse or validate that Sigstore evidence.

## Historical deployment boundary (before v0.1.5 validation)

The production registry and gate at `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b` predate the RSA verifier and remain unchanged. A separate v0.1.5 verifier lineage is deployed and live-validated; it is not production and the production frontend was not cut over to it.

At the v0.1.5 deployment, registry source SHA-256 was `2110d8b755b626da73dffd352030b05a941116921632d8e0fd6a3a10a4a62797`; gate source SHA-256 was `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`. Both were byte-verified. The historical production registry source remains `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`.

## Live v0.1.5 validation lineage

The policy-authorized RSA key and issuer attestations support the live ADMITTED candidate, and the gate activated it through finalized messages. The exact deployment, policy, evidence attestations, assessment, admission child, activation, acknowledgment child, negative probes, and canonical state are linked in [the closeout record](FINAL_STEWARD_MORE_INFO_CLOSEOUT.md). The positive live path demonstrates that the current contract code can verify the RSA-signed manifest and enforce admission. It is a distinct lineage and does not update production's existing policy, registry, gate, or frontend.

## Standards and source references

- [RFC 8017, PKCS #1 v2.2](https://www.rfc-editor.org/rfc/rfc8017.html), including RSASSA-PKCS1-v1_5 and EMSA-PKCS1-v1_5 encoding.
- [Python-RSA PKCS#1 verification source](https://github.com/sybrenstuvel/python-rsa/blob/main/rsa/pkcs1.py), consulted as a reviewed-source implementation reference. The contract verifier is a compact adaptation of the mathematical verification steps, not that package itself.
- [GitHub CLI attestation verification](https://cli.github.com/manual/gh_attestation_verify), for supplementary artifact provenance verification outside GenVM.
- [GitHub `actions/attest`](https://github.com/actions/attest), which produces a SLSA build provenance attestation and exposes the bundle path used by the workflow verifier.
