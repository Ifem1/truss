// Read-only, low-frequency HTTP probe for the already deployed Studionet caller.
// Usage: node scripts/probe-studionet-rpc.mjs > probe-results.jsonl
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const endpoint = "https://studio.genlayer.com/api";
const address = "0xc3aB10e75f5a13fA47906C7B8B9d81298a64e68a";
const gapMs = 150_000;
const timeoutMs = 180_000;
const methods = process.argv.length > 2 ? process.argv.slice(2) : [
  "read_default_view",
  "read_latest_final_view",
  "read_latest_final_view",
  "read_default_view",
];

async function makeRequest(method) {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: JSON.parse(options.body).id,
      result: { data: "", status: { code: 0, message: "" } },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const client = createClient({ chain: studionet, endpoint });
    await client.readContract({
      address,
      functionName: method,
      transactionHashVariant: "LATEST_FINAL",
    });
  } catch (error) {
    if (!captured) throw error;
  } finally {
    globalThis.fetch = originalFetch;
  }
  if (captured.url !== endpoint) throw new Error("Unexpected endpoint");
  return captured.options.body;
}

for (let index = 0; index < methods.length; index++) {
  if (index) await new Promise((resolve) => setTimeout(resolve, gapMs));
  const method = methods[index];
  const body = await makeRequest(method);
  const request = JSON.parse(body);
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const record = {
    index: index + 1,
    method,
    startedAt,
    request: { method: request.method, params: request.params },
    gapMs,
    timeoutMs,
  };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    record.status = response.status;
    record.contentType = response.headers.get("content-type");
    record.retryAfter = response.headers.get("retry-after");
    record.headers = Object.fromEntries(
      ["server", "date", "x-request-id", "cf-ray", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"]
        .map((name) => [name, response.headers.get(name)])
        .filter(([, value]) => value !== null),
    );
    const raw = await response.text();
    record.body = raw.slice(0, 4000);
    record.bodyBytes = Buffer.byteLength(raw);
    try {
      const parsed = JSON.parse(raw);
      record.rpcErrorCode = parsed.error?.code ?? parsed.result?.status?.code ?? null;
      record.rpcErrorMessage = parsed.error?.message ?? parsed.result?.status?.message ?? null;
    } catch {
      record.rpcErrorCode = null;
    }
  } catch (error) {
    record.transportError = {
      name: error.name,
      message: error.message,
      causeCode: error.cause?.code ?? null,
      causeMessage: error.cause?.message ?? null,
    };
  } finally {
    clearTimeout(timer);
    record.completedAt = new Date().toISOString();
    record.latencyMs = Math.round(performance.now() - start);
    process.stdout.write(`${JSON.stringify(record)}\n`);
  }
}
