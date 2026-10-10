# Studionet cross-contract execution issue

**Status: reproducible Studionet/GenVM execution blocker.** The minimal cross-contract view used by an on-chain write was accepted, then its leader execution exceeded 600 seconds. The probe has no TRUSS registry or gate calls and no HTTP evidence logic. This isolates the observed timeout from TRUSS authorization/finality code. It does not establish whether the defect is in GenVM itself or Studionet's hosted execution infrastructure; the public receipt identifies the GenVM leader timeout, while the hosted runner build is not exposed.

## Reproduction contracts

Exact deployed source is in [`cross_contract_view_source.py`](../contracts/cross_contract_view_source.py) and [`cross_contract_view_probe.py`](../contracts/cross_contract_view_probe.py). The source stores a constant marker. The caller stores the source address and has three operations: default cross-contract view, `LATEST_FINAL` cross-contract view, and a write that reads `LATEST_FINAL` and stores the returned marker. Both contracts use dependency `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.

Deployments on chain 61999:

- Source `0xB786E05f18Ed6B03aa03d5a67Cc9Cb9f96Cf7aDC`, [deployment transaction](https://explorer-studio.genlayer.com/tx/0x4fcf143ecde1727a0298024ab13d1f8333d0e090ac3fcceb67b1aa24b128eb77), finalized `MAJORITY_AGREE`.
- Caller `0xc3aB10e75f5a13fA47906C7B8B9d81298a64e68a`, [deployment transaction](https://explorer-studio.genlayer.com/tx/0xd9bf4d57d8532a3887c8530589c4817f94de23a28d834e941d381550e8c6aa52), finalized `MAJORITY_AGREE`.

## Results

| Probe | Result | Evidence |
|---|---|---|
| Basic cross-contract view | PASS | `read_default_view` returned `TRUSS-STUDIONET-XCALL-MARKER-20261010`. |
| `LATEST_FINAL` cross-contract view | FAIL | `genlayer call ... read_latest_final_view` waited and returned `UnknownRpcError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` (`gen_call`). The CLI also emitted a Windows libuv assertion after the read error. |
| On-chain write consuming a `LATEST_FINAL` view | FAIL | [Transaction](https://explorer-studio.genlayer.com/tx/0xdef55aee14fd4ee26cabfe88fdfd329a29cf871de28f941f20014ff9a830b137) finalized `FINALIZED` / `NO_MAJORITY`. Receipt `consensus_data.leader_receipt[0]` says `execution_result: ERROR`, `error_code: CONSENSUS_LEADER_EXEC_TIMEOUT`, `stderr: Leader execution exceeded 600.000s`, `raw_error.causes: [LEADER_EXEC_TIMEOUT]`. `votes_committed=0`, `votes_revealed=0`; leader node `5531`, model `policy:prd-gemma`, activator `0x4404Fb70d490c935758146f42A73DC850FF95C71`. |
| Canonical caller state after write | PASS (unchanged) | `get_consumed_marker` returned the empty string after the finalized unsuccessful write. |

The failed caller write was submitted once. Its receipt is a direct minimal reproduction of the same 600-second leader timeout observed by TRUSS activation calls. We did not submit another activation attempt. The CLI receipt was queried with `genlayer receipt <hash> --status FINALIZED`; an initial short poll showed `PROPOSING` / `NO_MAJORITY`, and later retrieval showed final status 7.

## Low-volume HTTP comparison (2026-10-10 UTC)

After a quiet period, we sent **read-only** `gen_call` requests directly to the same RPC and caller address. The outer `transaction_hash_variant` was `LATEST_FINAL` for both methods; only the probe's *inner* cross-contract state selector differed. Each request was a single raw HTTP POST with no SDK retries. The script is [`scripts/probe-studionet-rpc.mjs`](../scripts/probe-studionet-rpc.mjs); request parameters, timestamps, response headers, body prefixes, and errors are in [`STUDIONET_RPC_LOW_VOLUME_2026-10-10.jsonl`](STUDIONET_RPC_LOW_VOLUME_2026-10-10.jsonl), [`STUDIONET_RPC_RECOVERY_2026-10-10.jsonl`](STUDIONET_RPC_RECOVERY_2026-10-10.jsonl), and [`STUDIONET_RPC_LATEST_FINAL_2026-10-10.jsonl`](STUDIONET_RPC_LATEST_FINAL_2026-10-10.jsonl). One initial log line was interrupted during an HTML body write; its already captured status and headers are retained with an explicit truncation flag.

| UTC request start | Inner selector | Result | Latency | Observations |
|---|---|---|---:|---|
| 20:55:09 | Default | HTTP 200 JSON, marker returned | 1.885s | `X-RateLimit-Limit: 30`, `Remaining: 29`, `Reset: 60`; no RPC error. |
| 20:56:26 | `LATEST_FINAL` | HTTP 524 HTML | ~127s | Cloudflare origin timeout; `Retry-After: 120`; no JSON-RPC error code. The saved raw body was truncated by process interruption. |
| 21:00:52 | `LATEST_FINAL` | Client transport failure, no HTTP response | 131.261s | Started more than 120s after the prior 524. No status, content type or server error code was available. |
| 21:05:33 | Default | Client transport failure, no HTTP response | 0.103s | This interval cannot distinguish service availability from client/network trouble. |
| 21:09:24 | Default | HTTP 200 JSON, marker returned | 1.888s | `X-RateLimit-Limit: 30`, `Remaining: 29`, `Reset: 60`; no RPC error. |
| 21:12:10 | `LATEST_FINAL` | HTTP 524 HTML | 125.879s | Cloudflare origin timeout; `Retry-After: 120`; no JSON-RPC error code. |

The successful calls show the observed quota was not exhausted; neither 524 had a 429 response or rate-limit error code. Requests were separated by at least 75 seconds, and the final comparison followed a gap longer than 150 seconds. GenLayer's [validator configuration documentation](https://docs.genlayer.com/validators/setup-guide) lists a default `gen_call` limit of 2 requests per second; hosted Studio [is described as rate limited](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup), but the observed Studionet response advertised 30 requests per 60 seconds. Cloudflare [defines 524](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/) as an origin that accepted the connection but did not respond before its read timeout. Cloudflare may include `Retry-After` on [retryable 5xx responses](https://developers.cloudflare.com/changelog/post/2026-04-27-structured-responses-for-5xx-errors/), so that header alone does not establish rate limiting.

**Conclusion:** simple request-volume throttling is not supported by these measurements. The `LATEST_FINAL` inner view still stalled when calls were far below the observed limit and adjacent default reads succeeded. Shared backend overload or an internal per-operation limit remains possible; HTTP observations cannot locate the stall within state selection, cross-contract dispatch, GenVM, or Studionet hosting. No additional write or deployment was submitted. Preserve finalized-state enforcement and diagnose the hosted path before another activation.

## Runner versions and commands

- Network: Studionet chain `61999`, RPC `https://studio.genlayer.com/api`.
- Repository CLI package: `genlayer@0.39.1`.
- Viem reported by the CLI stack: `viem@2.37.2`.
- Contract dependency: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.
- Local semantic lint pins `GENVM_VERSION=v0.3.0-rc7`; it is not the hosted runner version. The transaction receipt does not publish the hosted GenVM build identifier, so that version remains unavailable.

Using the repository CLI, after deploying the two source files in order:

```powershell
genlayer call <CALLER> read_default_view --rpc https://studio.genlayer.com/api
genlayer call <CALLER> read_latest_final_view --rpc https://studio.genlayer.com/api
genlayer write <CALLER> consume_latest_final_view --rpc https://studio.genlayer.com/api
genlayer receipt <TX_HASH> --status FINALIZED --rpc https://studio.genlayer.com/api
genlayer call <CALLER> get_consumed_marker --rpc https://studio.genlayer.com/api
```

## TRUSS impact

The production registry and gate remain configured in the frontend, and their deployed addresses are unchanged. The registry's admitted head is readable, while the gate's canonical active candidate and activation history remain empty. The requested successful activation and live invalid-candidate rejection cannot be demonstrated while the isolated on-chain cross-contract read/write path times out. The prior activation and invalid-candidate calls are not contract-level rejection evidence. Live enforcement is **BLOCKED** pending a Studionet/GenVM fix and a rerun of this minimal reproduction.
