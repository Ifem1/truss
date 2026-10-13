# Final Steward More Info Closeout

**Updated:** 2026-10-13. This record supersedes the stale “no live lifecycle” statements in earlier snapshots below this repository's historical evidence. The new RSA-signed manifest path has been deployed and exercised on an isolated Studionet 61999 lineage. The production registry, production gate, policies, evidence history and Vercel contract configuration remain unchanged.

## Outcome

The v0.1.5 signed-manifest test lineage completed policy → candidate → authenticated evidence → finalized `ADMITTED` assessment → finalized registry-to-gate admission → activation → finalized registry acknowledgment. Live invalid-candidate and unauthorized-operator calls were rejected by contract execution and did not alter canonical state. This proves the deployed RSA-manifest enforcement path for this separate lineage. It does **not** prove issuer organizational independence, third-party review, or independent correctness of the signed CI claims. The new lineage is not production's configured registry/gate pair.

## Signed release evidence

- Repository: `Ifem1/truss`, GitHub repository ID `1407596595`.
- Release: [v0.1.5](https://github.com/Ifem1/truss/releases/tag/v0.1.5), commit [`06d4ac58dec4273f744fdab07a8465ee6244d26d`](https://github.com/Ifem1/truss/commit/06d4ac58dec4273f744fdab07a8465ee6244d26d), annotated tag-object `42508dd83e3e672a8eaf4c311ac119db2691d43a`.
- Source archive SHA-256: `356fdf995f5e09b0601ea9a2e99fe55b36a19085447f8a1a34afd9a626bb6c29`.
- Signed manifest SHA-256: `fb18d5462caefe7ac758e1a8a0e68fbac446e8f15008f0ee9eb9255ce34f9527`.
- Frozen RSA key ID: `sha256:95d4d586159d320bea7a3cdc3e09180099f49d1950d857a03188cccd66771064`.
- CI: [master run 38377004652](https://github.com/Ifem1/truss/actions/runs/38377004652), [tag run 38377804251](https://github.com/Ifem1/truss/actions/runs/38377804251), and [signed-release run 38378347900](https://github.com/Ifem1/truss/actions/runs/38378347900), all passed. GitHub CLI `gh attestation verify` accepted the source archive for `Ifem1/truss`, workflow `.github/workflows/release-manifest.yml`, ref `refs/heads/master`, run 38378347900, with Rekor timestamp `2026-10-13T10:43:35+01:00`.

The contract verifies the RSA signature over canonical manifest bytes, frozen key fingerprint, repository/candidate binding, tag/commit/artifact fields, and the issuer-committed response digest. It does not verify the GitHub Sigstore bundle inside GenVM. The Sigstore attestation is supplementary, externally verified evidence. Signed CI fields are key-authenticated claims, not independent proof that the workflow ran correctly or that tests are sufficient. Signature verification authenticates content despite URL redirects; it does not authenticate the final HTTP origin.

## Deployed contracts and configuration

| Component | Address | Deployment/config transaction | Deployed source SHA-256 |
| --- | --- | --- | --- |
| RSA registry, isolated lineage | [0xB5eA66c2b0faA42237fdAc42d75af0FcF21bf10F](https://explorer-studio.genlayer.com/address/0xB5eA66c2b0faA42237fdAc42d75af0FcF21bf10F) | [deploy](https://explorer-studio.genlayer.com/tx/0xb49a3c400dba80c93c6293e3d96ea54d998df8e3d909ea74d1ec850eae275aa6) | `2110d8b755b626da73dffd352030b05a941116921632d8e0fd6a3a10a4a62797` |
| RSA activation gate, isolated lineage | [0x0F8AC5EAB858D0B2820846A3938CCC6C3B951546](https://explorer-studio.genlayer.com/address/0x0F8AC5EAB858D0B2820846A3938CCC6C3B951546) | [deploy](https://explorer-studio.genlayer.com/tx/0x9438ef95860a8b074e8bb5d7ba84656417b3b727e08062eca77e8b40e8ace492); [configure](https://explorer-studio.genlayer.com/tx/0x758c8338f14c9e4d6e833fad756a91a258d9173bd1157285d1ef138f85b61d6d) | `3138c02fbfbd4fd5d0c58029e42d3668c0acd707dc6a0da251bd83d8147ea218` |

Both deployed sources were byte-compared with repository source. The policy `truss-v015-rsa-policy-20261013`, digest `48fa7b6cc3ab7924fb2a027fcd96469516b1afcac9f60e39c4a38a2e3ea4164c`, was created in [transaction 0x5c955ebc58d85d12aa248e18d8424dd31d24c746904f732781ceda9bffd02845](https://explorer-studio.genlayer.com/tx/0x5c955ebc58d85d12aa248e18d8424dd31d24c746904f732781ceda9bffd02845). It binds owner/publisher `0x39680bd423437c0eaa18493629652821ec672c61` and issuer `0x6b476bf35c4968f3f1775c0ca2110591b4b5fcbe`; the gate operator is `0x77e2edbb43277bf772e207c517dde731935ffba5`. Policy explicitly says wallet control only and issuer organizational independence not established.

## Live lifecycle evidence

Candidate `truss-v015-signed-candidate-20261013` names v0.1.5 / commit `06d4ac58dec4273f744fdab07a8465ee6244d26d`.

- Candidate open: [0x59f80c3a4c5a74113468008763245d03a6a84b04c013bda0b9b70429e37b139f](https://explorer-studio.genlayer.com/tx/0x59f80c3a4c5a74113468008763245d03a6a84b04c013bda0b9b70429e37b139f).
- Issuer-attested evidence transactions: [ref](https://explorer-studio.genlayer.com/tx/0xe3b900d3a1db99014c2f1290c1b1ac908b911299f729d9bd31a391385c07f634), [annotated tag object](https://explorer-studio.genlayer.com/tx/0xa658f784e1ac6b22e3fa2c5fd4a21293710cc17a2f1a18e40c1f1a8148573ba1), [commit object](https://explorer-studio.genlayer.com/tx/0x99474985f9a9552d841767b050bb1b70da32db51a99b4e1d4b46c6716468d866), [signed manifest](https://explorer-studio.genlayer.com/tx/0x2501420fbe4aaad3eef4673b2ed8eaafe0d0948a80a013da5c082bcde27df867).
- Seal: [0x5a012c55396ddc835dee5f477ac25cc71986a742407243e825e9ee4ac24d25a7](https://explorer-studio.genlayer.com/tx/0x5a012c55396ddc835dee5f477ac25cc71986a742407243e825e9ee4ac24d25a7).
- Assessment: [0xfb420fd74bcf0b96b00144112da4295a22195247a23781460f59360956cd877f](https://explorer-studio.genlayer.com/tx/0xfb420fd74bcf0b96b00144112da4295a22195247a23781460f59360956cd877f), `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`, verdict `ADMITTED`.
- Finalized admission child: [0x8c623b1dd5695fc4e8883bb1abe4210490c5bc2ac16e91dbbda608853b550c5d](https://explorer-studio.genlayer.com/tx/0x8c623b1dd5695fc4e8883bb1abe4210490c5bc2ac16e91dbbda608853b550c5d), `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`.
- Activation: [0xdb84dd28f2cb470648e64f45cd66829ab3d3ae5dbbdb97580dbf068903be558d](https://explorer-studio.genlayer.com/tx/0xdb84dd28f2cb470648e64f45cd66829ab3d3ae5dbbdb97580dbf068903be558d), `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`.
- Finalized acknowledgment child: [0xcb7ae1db0a46e91e82f5fd217eae104c024fecd9e33cd9a04e8b182d9b3415fa](https://explorer-studio.genlayer.com/tx/0xcb7ae1db0a46e91e82f5fd217eae104c024fecd9e33cd9a04e8b182d9b3415fa), `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS`.
- Live invalid-candidate rejection: [0x9eb3fdcea531b6546c92e79fda328dd8b660ad5af65943f38512c1b61bd1f4c5](https://explorer-studio.genlayer.com/tx/0x9eb3fdcea531b6546c92e79fda328dd8b660ad5af65943f38512c1b61bd1f4c5), finalized majority, leader execution `ERROR`/rollback.
- Live unauthorized-operator rejection: [0x0c91fab79e7a2b0bae6c3365f3b70c86b217703a846184edc9efa4825533f0bc](https://explorer-studio.genlayer.com/tx/0x0c91fab79e7a2b0bae6c3365f3b70c86b217703a846184edc9efa4825533f0bc), finalized majority, leader execution `ERROR`/rollback.

Canonical post-state reads agree: registry head and gate active candidate are `truss-v015-signed-candidate-20261013`; registry pending activation and gate pending admission are `{}`; registry acknowledgment history has sequence 1 with matching gate, policy and assessment digest; gate activation history has sequence 1 with the expected commit and policy. Gate `pending_acknowledgment` retains the retry/outbox record with retry count 0 even after the registry records delivery; this is existing contract behavior, not evidence that the registry acknowledgment failed.

After both live rejection probes, canonical reads still showed the same active candidate and histories, with no pending admission or registry activation. The gate's retry/outbox record remained unchanged.

## Production and trust boundary

The production registry remains `0x20193443d1E429e4984B118FF54DC77547b0fBCB` and production gate `0x6572Db4AAd54DAf4C7461D9B18f9f138d2fa387b`. Production Vercel continues to use that existing pair; it was not pointed at the isolated v0.1.5 lineage. Prior production lifecycle and frontend evidence remain in [LIVE_RELEASE_MATRIX.md](LIVE_RELEASE_MATRIX.md) and [deployment-manifest.public.json](../deployment-manifest.public.json).

Issuer and publisher are distinct wallet addresses, but organizational independence is **not established**. The RSA key is repository-controlled and identifies only a frozen key fingerprint. The GitHub/Sigstore attestation was verified outside the contract and is not checked by GenVM. The signed manifest authenticates content and candidate binding; it does not prove the truth of the signed CI claim, third-party review, or final redirect origin. Historical `LATEST_FINAL` cross-contract timeout remains a separate historical issue; finalized messages are the mechanism used here.

## Verification

At source commit `06d4ac58dec4273f744fdab07a8465ee6244d26d`, repository-local GenLayer CLI 0.39.1 and Studionet 61999 were used. Recorded passing checks: preflight; contract lint/semantic validation (7 contracts); Direct Mode 63/63; unit tests 2/2; TypeScript typecheck; production build; Playwright 19/19. Master, tag, and signed-release GitHub Actions runs linked above passed. Production UI was deliberately not switched to the isolated lineage.

## Acceptance statement

The RSA-signed manifest path is now deployed and has a successful finalized live lifecycle plus live invalid-candidate and unauthorized-operator rejection proofs. The production pair remains unchanged. **The broader trust requirement for independently attributable issuer identity is not met**: no external organizational credential or third-party attestation was supplied, and this implementation does not claim one.
