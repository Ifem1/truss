import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [address, sourcePath] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "") || !["contracts/truss_registry.py", "contracts/release_activation_gate.py"].includes(sourcePath)) {
  throw new Error("Usage: node scripts/verify-deployed-source.mjs <contract-address> <known-source-path>");
}
const rpc = "https://studio.genlayer.com/api";
const chain = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }) }).then(r => r.json());
if (chain.result !== "0xf22f") throw new Error("RPC did not report Studionet chain 61999");
const response = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "gen_getContractCode", params: [address] }) }).then(r => r.json());
if (response.error || typeof response.result !== "string") throw new Error(`Could not read deployed source: ${JSON.stringify(response.error ?? response)}`);
const local = await readFile(sourcePath);
const deployed = Buffer.from(response.result, "base64");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const result = { address, sourcePath, chainId: 61999, localBytes: local.length, deployedBytes: deployed.length, localSha256: sha(local), deployedSha256: sha(deployed), byteMatch: local.equals(deployed) };
console.log(JSON.stringify(result, null, 2));
if (!result.byteMatch) process.exitCode = 1;
