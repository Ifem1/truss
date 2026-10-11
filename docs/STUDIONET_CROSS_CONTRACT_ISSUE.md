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

## Contract and selector audit (2026-10-10)

We fetched both deployed probe sources with the read-only `gen_getContractCode` client action and compared them with the repository files after normalizing Windows CRLF to LF:

| Deployed contract | On-chain source SHA-256 (LF) | Repository comparison |
|---|---|---|
| Source `0xB786E05f18Ed6B03aa03d5a67Cc9Cb9f96Cf7aDC` | `0d5f5ddcdda02eee30159d2454d1f948109b6e0031764020e93537f366f82126` | Exact match after line-ending normalization. |
| Caller `0xc3aB10e75f5a13fA47906C7B8B9d81298a64e68a` | `dffad7d3655f8dc9fa094375f187d64f171a67db90aca0ce8722a2c08a3af7e0` | Exact match after line-ending normalization and excluding the later-added, unused `consume_default_view` comparator. The deployed `read_default_view`, `read_latest_final_view`, and `consume_latest_final_view` methods match. |

The caller's successful default read proves its stored target address and nested call encoding reach the expected source method. The default and `LATEST_FINAL` reads use the same caller address, source address, outer `gen_call` shape, and outer `transaction_hash_variant`; the difference is the inner storage view requested by the caller method. Thus the deployed reproduction is exercising the selector difference described above, not a different registry address or stale caller implementation.

GenVM's [CallContract ABI](https://github.com/genlayerlabs/genvm-manager/blob/main/docs/website/src/spec/02-execution-environment/03-wasi_genlayer_sdk/02-gl_call.rst) defines `storage_view` values `0=default`, `1=latest_finalized`, and `2=latest_decided`. Its [cross-major system test caller](https://github.com/genlayerlabs/genvm-manager/blob/main/tests/system/cross-major/assets/v0.3/state_caller.py) passes the finalized selector through `view(state=mode)`, and the [test asserts that the selected state mode crosses the nested call boundary](https://github.com/genlayerlabs/genvm-manager/blob/main/tests/system/cross-major/test.py). GenVM's changelog says the old symbolic labels `latest_final` / `latest_non_final` were renamed to `latest_finalized` / `latest_decided` while numeric values remain unchanged. Our deployed contract is pinned to the older `py-genlayer` dependency and uses its `StorageType.LATEST_FINAL` name; the repository's Direct Mode check observes this as numeric selector `1`. The symbolic name difference alone does not indicate an invalid selector.

**Assessment:** this audit found no wrong address, stale deployed method, outer RPC parameter, or obvious selector-number mistake. The default and finalized sub-VM paths diverge only at the requested inner state selector, consistent with the HTTP and leader timeout evidence. A version-specific interaction between the older pinned `py-genlayer` contract API and Studionet's hosted GenVM remains possible because the hosted runner build and internal call trace are unavailable. This evidence narrows the investigation; it does not prove the defect is in GenVM rather than Studionet's host or state backend.

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

## TRUSS impact (2026-10-10 snapshot)

At that snapshot, the production registry and gate remained configured in the frontend and their deployed addresses were unchanged. The registry's admitted head was readable, while the gate's canonical active candidate and activation history remained empty. The requested successful activation and live invalid-candidate rejection could not be demonstrated through the isolated cross-contract read/write path. The prior activation and invalid-candidate calls were not contract-level rejection evidence. The subsequent finalized-message result below supplies a viable alternative mechanism; it does not itself prove TRUSS live enforcement.

## Finalized-message primitive (2026-10-11)

The later TRUSS design uses finalized messages rather than cross-contract `LATEST_FINAL` reads. A minimal authenticated parent-to-child test succeeded on Studionet 61999:

| Item | Evidence |
|---|---|
| Sender source | [`contracts/finalized_message_probe_sender.py`](../contracts/finalized_message_probe_sender.py), SHA-256 `0f81c7c45470c247fc54d756764c8b3873baa62ed252f1cc24f88f79d5da60f2`; address `0x38E747876E149b28B082329daAca084601b79710`; [deployment](https://explorer-studio.genlayer.com/tx/0xbe33d362d41422ae7e38aab46e8b18745e37e7e6cd18ea6d6734c6d5200e1b). |
| Receiver source | [`contracts/finalized_message_probe_receiver.py`](../contracts/finalized_message_probe_receiver.py), SHA-256 `05e90d888b39f40be1b2c1ab0385468867c27f34ff36a30c4c23a58a61b2d579`; address `0xAEc8E67a91652F48B80364b80B6F9BdFB132a0b7`; [deployment](https://explorer-studio.genlayer.com/tx/0x7f7d12db912f25e0a5e560e36a27853e7ed1c5539de11103c0664356ae2824ee). The constructor freezes the only accepted sender. |
| Parent message write | [Transaction](https://explorer-studio.genlayer.com/tx/0x14c144093c3ba15c1f7c1d59d659c18016ee29cdaa041ffd16d5db8f7d1d403a), `FINALIZED` / `MAJORITY_AGREE`; emitted with `on="finalized"`. |
| Triggered child | [Transaction](https://explorer-studio.genlayer.com/tx/0x6dcc26a903092d9291133b445af4459ebd340e687b8f70ae9cd0c9844ef88c77), `FINALIZED` / `MAJORITY_AGREE`, `execution_result: SUCCESS`, `triggered_on: finalized`; authenticated `gl.message.sender_address` equals the configured parent. |
| Canonical child storage | `get_received_state()` returned nonce `1`, payload `TRUSS-FINALIZED-MESSAGE-20261011`, and `sender == expected_sender == 0x38E747876E149b28B082329daAca084601b79710`. |

This result isolates the earlier timeout to the `LATEST_FINAL` read path: finalized message delivery and child execution work on the same hosted network. It does not identify the exact internal defect in state selection, nested dispatch, or the hosted backend. It also proves only the message primitive; the new TRUSS registry/gate lifecycle requires its own deployment, finalized admission, acknowledgment, activation, negative-path, and canonical-state proofs. The project therefore proceeds with message-based delivery while preserving the old `LATEST_FINAL` finding in [GenLayer issue #60](https://github.com/genlayerlabs/genvm-manager/issues/60).
