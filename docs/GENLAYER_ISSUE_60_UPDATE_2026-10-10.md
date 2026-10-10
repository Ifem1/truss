Additional low-volume Studionet RPC evidence (2026-10-10 UTC): this is **not yet attributed to a GenVM defect**. We tested the already deployed minimal caller `0xc3aB10e75f5a13fA47906C7B8B9d81298a64e68a` and source `0xB786E05f18Ed6B03aa03d5a67Cc9Cb9f96Cf7aDC`. No deployments or writes were submitted.

Single raw HTTP `gen_call` POSTs to `https://studio.genlayer.com/api`, without SDK retries, used `transaction_hash_variant: LATEST_FINAL` for both outer reads. The caller's `read_default_view` and `read_latest_final_view` differ only in their *inner* cross-contract state selector. Calls were separated by at least 75 seconds, and the final pair by more than 150 seconds.

| UTC start | Method | HTTP / transport outcome | Latency | Relevant headers |
|---|---|---|---:|---|
| 20:55:09 | `read_default_view` | 200 JSON; expected marker | 1.885s | `X-RateLimit-Limit: 30`, `Remaining: 29`, `Reset: 60` |
| 20:56:26 | `read_latest_final_view` | 524 HTML; Cloudflare origin timeout | ~127s | `Retry-After: 120`, Ray `a48888279ec6febb-AMS` |
| 21:00:52 | `read_latest_final_view` | transport `fetch failed`; no HTTP response | 131.261s | none available |
| 21:05:33 | `read_default_view` | transport `fetch failed`; no HTTP response | 0.103s | none available |
| 21:09:24 | `read_default_view` | 200 JSON; expected marker | 1.888s | `X-RateLimit-Limit: 30`, `Remaining: 29`, `Reset: 60` |
| 21:12:10 | `read_latest_final_view` | 524 HTML; Cloudflare origin timeout | 125.879s | `Retry-After: 120`, Ray `a4889f351aedfba8-AMS` |

The two 524s are not JSON-RPC errors. Neither indicates HTTP 429, and the working control responses had 29/30 quota remaining. Cloudflare's 524 means the origin accepted the request but did not respond before the proxy read timeout; `Retry-After` can appear on retryable 5xx and is not by itself proof of throttling. The two intervening transport failures leave shared service or client/network availability as a possibility, but the default method recovered and the final `LATEST_FINAL` method still timed out at very low frequency.

This narrows the observation to the inner `LATEST_FINAL` path under the measured conditions, without locating the root cause. Could the runtime team check origin/GenVM traces for the two Cloudflare Ray IDs above and the original on-chain write `0xdef55aee14fd4ee26cabfe88fdfd329a29cf871de28f941f20014ff9a830b137`? Please advise whether a hosted GenVM permit, state-selection wait, shared backend queue, or per-operation limit explains these timeouts. We are preserving finality and will not retry activation until the minimal path succeeds.

Reproducer script and machine-readable raw observations: https://github.com/Ifem1/truss/blob/master/scripts/probe-studionet-rpc.mjs and `docs/STUDIONET_RPC_*_2026-10-10.jsonl` (to be linked after the repository update). The initial 524 raw-body log line was interrupted during output; its captured status/headers are retained and the later 524 response is intact.
