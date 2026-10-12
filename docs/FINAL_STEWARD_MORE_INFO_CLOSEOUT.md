# Final Steward More Info Closeout

**Status: BLOCKED — authenticated admission is not implemented or demonstrated.** This closeout records the verified GitHub build provenance and the exact remaining contract/runtime gap. It does not present the historical production lifecycle or a successful CI run as proof of authenticated on-chain admission.

## 1. Authentic release evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| Canonical source repository | PASS | `https://github.com/Ifem1/truss`, repository ID `1407596595` in the signed SLSA statement. |
| Exact source commit | PASS | `2a195c52bd60ceda522b1988874585169c0e9d90`. |
| Version tag/ref | PARTIAL | The signed build is for `refs/heads/master`; this run did not attest a version tag or publish a versioned GitHub Release. No version tag is claimed here. |
| Exact artifact digest | PASS | `truss-source.tar.gz`, SHA-256 `4566fc8cbb3ef9d41c95907bb590bddda9d1e1e000997bc3f40287a7ada58ab7`. The archive is committed here with its bundle. |
| Attestation signature and authority | PASS, limited scope | GitHub Actions OIDC certificate, signer SAN `https://github.com/Ifem1/truss/.github/workflows/ci.yml@refs/heads/master`, issuer `https://token.actions.githubusercontent.com`, certificate issuer `CN=sigstore-intermediate,O=sigstore.dev`, and Rekor timestamp `2026-10-12T22:34:49+01:00`. |
| Official verifier | PASS | `gh attestation verify` succeeded for the exact archived subject, explicit repository, explicit signer workflow, downloaded bundle and saved Sigstore trusted-root snapshot. GitHub run [38311029338](https://github.com/Ifem1/truss/actions/runs/38311029338) passed both CI and the attestation job. |

The attestation bundle, archive and trusted-root snapshot are preserved in [`docs/attestations/2a195c5/`](attestations/2a195c5/). Their SHA-256 values are respectively:

- Bundle: `7b62b6d44e6e3683614584170f45c6c47fa8899debc59829fd50cede2dc3e996`
- Source archive: `4566fc8cbb3ef9d41c95907bb590bddda9d1e1e000997bc3f40287a7ada58ab7`
- Trusted-root JSONL: `65ca537f6ed8a47fd0e560c421baa1f6c1efb8b25fc200d8c5c02c0e92eb2b9c`

Reproduce verification from the repository root with GitHub CLI:

```sh
gh attestation verify docs/attestations/2a195c5/truss-source.tar.gz \
  --bundle docs/attestations/2a195c5/attestation.json \
  --custom-trusted-root docs/attestations/2a195c5/trusted-root.jsonl \
  --repo Ifem1/truss \
  --signer-workflow Ifem1/truss/.github/workflows/ci.yml \
  --format json
```

The workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) signs the source archive only after the full `verify` job passes. The exact attestation and source files were downloaded from run 38311029338 and verified locally using the official GitHub CLI. The CI job did not publish a versioned release; consequently the attestation says `master`, not a release tag.

### What the Sigstore result means

The signature, certificate identity, source digest, workflow identity, OIDC issuer and transparency timestamp provide independently checkable evidence that GitHub Actions workflow `.github/workflows/ci.yml` in `Ifem1/truss` produced an attestation for this exact source archive at this commit. A redirected download cannot substitute different bytes while preserving the verified SHA-256 subject.

This is build provenance. It does not establish an independent human reviewer, organizational independence, correctness of repository-controlled tests, test quality, software security, or the truth of arbitrary predicate claims. Repository maintainers control the workflow. A separate issuer wallet proves control of that wallet and its on-chain content commitment only. These assurance types are distinct; none is described as third-party review.

## 2. Contract-side Sigstore verification

**BLOCKED — no verified bundle acceptance path exists in the pinned GenVM contract environment.** The deployed registry and current source do not parse and authenticate Sigstore DSSE bundles, verify the Fulcio certificate identity and chain, verify the Rekor inclusion proof/checkpoint, or bind those verified claims to the frozen candidate. The current provenance gate therefore continues to mark issuer-bound evidence `UNVERIFIED` and prevent authenticated admission.

Runtime checks used repository-local GenLayer CLI 0.39.1 and the contract runner pinned in the source header (`py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`, lint environment `GENVM_VERSION=v0.3.0-rc7`). A temporary contract probe using `genvm-lint check` produced:

- `Import error: No module named 'cryptography'`
- With that import removed, `Import error: No module named 'ecdsa'`
- `hashlib`, `base64`, `json` and `ssl` imports passed contract validation, but the runtime exposes no supported X.509/Sigstore certificate-chain or ECDSA verification API through those imports.

These checks show that common cryptographic verification packages are absent from the pinned contract dependency; they do not prove pure-Python verification is mathematically impossible. No custom ASN.1, P-256, Fulcio chain, Rekor checkpoint or inclusion-proof implementation was added. Shipping an unreviewed cryptographic reimplementation would not be a safe substitute. A sound completion path is a reviewed deterministic verifier supported by GenVM (native runner primitive or audited contract-compatible implementation) that validates DSSE signature, trusted workflow identity, subject/repository/commit/tag binding, certificate validity and transparency evidence against pinned trust roots. Any such path must pass genuine-bundle and tampering tests in Direct Mode and the pinned runner before deployment.

The GitHub CLI verification performed off chain is not passed to the contract as a `verified: true` flag and is not counted as enforcement.

## 3. Trust roles

- **Policy owner:** selects and freezes the policy and trust limits.
- **Publisher:** opens a candidate under that policy.
- **Designated issuer wallet:** signs an on-chain digest commitment; this authenticates wallet control and the committed bytes only.
- **GitHub/Sigstore build provenance:** authenticates the named GitHub workflow identity and the signed subject digest under the published trust root; it does not authenticate a separate reviewer.
- **Third-party review:** not present in this evidence and not claimed.

No signer controlled by the repository is called independent of the publisher or policy owner. The UI and security docs retain the issuer-independence limitation.

## 4. Admission and deployment state

**No fresh authenticated lifecycle was submitted.** There is no new policy, candidate assessment, admission message, activation, acknowledgment, or negative-path transaction for this Sigstore evidence. The historical deployed registry remains `0x20193443d1E429e4984B118FF54DC77547b0fBCB` (source SHA-256 `244a49a057902d5c3b930412fea478f19bbc3c70c04879341dcd2d11b41a8bf1`) and the production gate remains `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b` (source SHA-256 `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218`). They are historical deployed implementations and do not contain this bundle verifier. No deployment, production policy change, or frontend cutover was made.

The throwaway and historical wallet-attested lifecycles remain supporting historical evidence only. They do not prove that the current registry authenticates a GitHub Sigstore bundle or that a new candidate can be admitted on that basis.

## 5. Tests and CI

Verified for source snapshot `2a195c52bd60ceda522b1988874585169c0e9d90`:

- `npm run preflight` — PASS
- `npm run cli:version` — PASS, 0.39.1
- `npm run contracts:check` — PASS
- `npm run test:unit` — PASS, 2 tests
- `npm run test:direct` — PASS, 58 tests
- `npm run typecheck` — PASS
- `npm run build` — PASS
- `npm run test:e2e` — PASS, 18 tests
- GitHub Actions — PASS, [run 38311029338](https://github.com/Ifem1/truss/actions/runs/38311029338), including signed-source attestation and artifact retention
- `gh attestation verify` with the bundle, trusted-root snapshot, exact repository and exact workflow — PASS

These results prove CI and source provenance for that snapshot. They do not prove contract-side signature verification, a fresh tagged release, or live authenticated admission.

## 6. Required remaining work

1. Add or enable a reviewed Sigstore verification implementation in the pinned GenVM environment; verify valid, altered, wrong-repository, wrong-commit, wrong-ref, expired and untrusted bundles deterministically.
2. Create a version-tagged release only after the verifier is tested, attest the exact release artifact/manifest, and preserve its bundle and trust-root snapshot.
3. Deploy a successor registry/gate pair only after byte-verified source and tests pass; retain existing deployed contracts as historical records.
4. Prove a genuine finalized `ADMITTED` result, finalized gate activation/acknowledgment, and actual contract-level rejection paths on StudioNet 61999. Confirm canonical post-state.

Until those gates pass, issuer-bound authenticated admission remains fail-closed and the requested production outcome is **not complete**. No test wallet, API JSON field, model judgment, wallet digest or off-chain approval flag may bypass this state.
