# Live Studionet Test Record

Target: Studionet `61999` only, RPC `https://studio.genlayer.com/api`.

## Status

Live proof is complete against the finalized, byte-matched contract at `0xEf2aF888D4e764678d97a1EC38e7519047440fFb`. The scenarios use public synthetic fixtures and do not establish real-world release, security, test or provenance claims. Transaction hashes and explorer links are in [REVIEW_EVIDENCE.md](REVIEW_EVIDENCE.md).

- ADMITTED candidate finalized and advanced the head.
- REJECTED candidate finalized without moving the head.
- Retryable INSUFFICIENT_EVIDENCE attempt followed by an appended round and a second assessment; both rounds and attempts remain stored. The second result is REJECTED due the pinned version mismatch.
- Duplicate coordinate and invalid host scope were rejected without candidate storage.
- Non-owner policy mutation was rejected without changing the active policy.
- Two candidates opened against one predecessor; the first admitted, the second finalized REJECTED as stale, and the head stayed on the first.

## Deployment and verification

The deployment receipt finalized successfully and the deployed code returned by `gen_getContractCode` byte-matched the repository contract source. Contract SHA-256: `eff129604484b9d449660e265a435e4a1677a1c6548908cf7eee04068a0be5d3`. The deployment address and receipt are in [deployment-manifest.public.json](../deployment-manifest.public.json).

## Remaining completion work

The seven browser tests currently cover wallet/network and product-route behavior but not the full transaction submitted → accepted/nonfinal → finalized → authoritative reread lifecycle or refresh recovery. Vercel deployment and production source provenance are left for the user. The current local follow-up HEAD also needs to be pushed to the exact `Ifem1/truss` origin after authenticating as `Ifem1` with workflow permission.

Do not reuse these synthetic fixture results as release evidence. Do not change chain, RPC, contract address, repository owner or origin.
