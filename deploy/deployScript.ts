import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const RPC = "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com";
const CHAIN_ID = 61999;
const CLI_VERSION = "0.39.1";
const MANIFEST = "deployment-manifest.generated.json";

function run(label: string, command: string, args: string[]): string {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
  return result.stdout ?? "";
}

const gates: Array<[string, string, string[]]> = [
  ["Repository preflight", "npm", ["run", "preflight"]],
  ["Contract compile/lint", "npm", ["run", "contracts:check"]],
  ["Direct Mode", "npm", ["run", "test:direct"]],
  ["Python unit tests", "npm", ["run", "test:unit"]],
  ["TypeScript", "npm", ["run", "typecheck"]],
  ["Production frontend build", "npm", ["run", "build"]],
  ["Browser tests", "npm", ["run", "test:e2e"]],
];
for (const [label, command, args] of gates) run(label, command, args);

const localPackage = JSON.parse(await readFile("node_modules/genlayer/package.json", "utf8"));
if (localPackage.version !== CLI_VERSION) throw new Error(`Repository package must provide genlayer@${CLI_VERSION}; got ${localPackage.version}`);
const localBin = process.platform === "win32" ? "node_modules/.bin/genlayer.cmd" : "node_modules/.bin/genlayer";
if (!existsSync(localBin)) throw new Error("Repository-local GenLayer CLI executable is not installed; refusing any global CLI fallback.");
const cliVersion = run("Repository-local GenLayer CLI", "npx", ["--no-install", "genlayer", "--version"]).trim();
if (cliVersion !== CLI_VERSION) throw new Error(`Expected repository-local CLI ${CLI_VERSION}; got ${cliVersion}`);

const networkInfo = run("Configured CLI network", "npx", ["--no-install", "genlayer", "network", "info"]);
if (!networkInfo.includes(`chainId: '${CHAIN_ID}'`) || !networkInfo.includes(`rpc: '${RPC}'`)) {
  throw new Error("Configured GenLayer network does not exactly match Studionet 61999; refusing deployment.");
}
const rpcResponse = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }) });
if (!rpcResponse.ok) throw new Error(`Studionet RPC returned HTTP ${rpcResponse.status}`);
const rpcResult = await rpcResponse.json();
if (rpcResult?.result !== "0xf22f") throw new Error(`RPC chain ID was ${String(rpcResult?.result)}; expected 0xf22f (61999).`);

const deployAccountName = process.env.TRUSS_DEPLOY_ACCOUNT_NAME?.trim();
const authorizedDeployAddress = process.env.TRUSS_DEPLOY_AUTHORIZED_ADDRESS?.trim().toLowerCase();
if (!deployAccountName || !authorizedDeployAddress || !/^0x[0-9a-f]{40}$/.test(authorizedDeployAddress)) {
  throw new Error("Set TRUSS_DEPLOY_ACCOUNT_NAME and the explicitly authorized TRUSS_DEPLOY_AUTHORIZED_ADDRESS before deployment; no default/local account will be used.");
}
run("Activate explicitly authorized deployment account", "npx", [
  "--no-install", "genlayer", "account", "use", deployAccountName,
]);
const accountInfo = run("Verify explicitly authorized active deployment account", "npx", [
  "--no-install", "genlayer", "account", "show", "--account", deployAccountName, "--rpc", RPC,
]);
if (!accountInfo.toLowerCase().includes(authorizedDeployAddress) || !/active:\s*true/i.test(accountInfo)) {
  throw new Error("The selected CLI account is not active or its public address does not match the explicitly authorized TRUSS deployer address.");
}
if (!/status:\s*['"]unlocked['"]/i.test(accountInfo)) {
  throw new Error("The explicitly authorized deployment account is locked; unlock it through the GenLayer CLI before deploying.");
}
const balanceMatch = accountInfo.match(/balance:\s*['"]?([\d.]+)\s+GEN/i);
if (!balanceMatch || Number(balanceMatch[1]) <= 0) {
  throw new Error("The explicitly authorized deployer account has no verified positive Studionet GEN balance.");
}

const source = await readFile("contracts/truss_registry.py");
const sourceSha256 = createHash("sha256").update(source).digest("hex");
const git = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
const manifest = {
  project: "TRUSS", network: "studionet", chainId: CHAIN_ID, rpc: RPC, explorer: EXPLORER,
  cliVersion, sourceSha256, sourceCommit: git.status === 0 ? git.stdout.trim() : "",
  deploymentOutput: "", finalityOutput: "", sourceVerificationOutput: "",
  contractAddress: "", deploymentTransaction: "", deployedSourceSha256: "",
  sourceByteMatch: false, sourceVerification: "NOT_VERIFIED", status: "DEPLOYMENT_STARTED",
  note: "The deployment receipt is awaited to FINALIZED and source is fetched back with the stable CLI before declaring byte match.",
};
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const deployArgs = ["--no-install", "genlayer", "deploy", "--contract", "contracts/truss_registry.py", "--rpc", RPC];
console.log(`\nDeploying final contract source to Studionet ${CHAIN_ID} (${RPC})`);
run("Reconfirm explicitly authorized active account immediately before signing", "npx", [
  "--no-install", "genlayer", "account", "use", deployAccountName,
]);
const finalAccountInfo = run("Verify active signer immediately before deployment", "npx", [
  "--no-install", "genlayer", "account", "show", "--account", deployAccountName, "--rpc", RPC,
]);
if (!finalAccountInfo.toLowerCase().includes(authorizedDeployAddress)
    || !/active:\s*true/i.test(finalAccountInfo)
    || !/status:\s*['"]unlocked['"]/i.test(finalAccountInfo)) {
  throw new Error("The explicitly authorized account is no longer active and unlocked immediately before deployment.");
}
const deployment = spawnSync("npx", deployArgs, { encoding: "utf8", shell: process.platform === "win32", stdio: ["inherit", "pipe", "pipe"] });
if (deployment.stdout) process.stdout.write(deployment.stdout);
if (deployment.stderr) process.stderr.write(deployment.stderr);
manifest.deploymentOutput = `${deployment.stdout ?? ""}${deployment.stderr ?? ""}`;
manifest.status = deployment.status === 0 && !deployment.error ? "DEPLOYMENT_COMMAND_COMPLETED_REVIEW_REQUIRED" : "DEPLOYMENT_COMMAND_FAILED_OR_INTERRUPTED_REVIEW_OUTPUT";
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
if (deployment.error) throw deployment.error;
if (deployment.status !== 0) throw new Error(`GenLayer deployment failed with exit code ${deployment.status}`);
if (!new RegExp(`sender:\\s*['"]?${authorizedDeployAddress}`, "i").test(manifest.deploymentOutput)) {
  throw new Error("Deployment output sender does not match the explicitly authorized deployment account.");
}

const txMatch = manifest.deploymentOutput.match(/Transaction Hash['"]?\s*:\s*['"]?(0x[0-9a-fA-F]{64})/i);
const addressMatch = manifest.deploymentOutput.match(/Contract Address['"]?\s*:\s*['"]?(0x[0-9a-fA-F]{40})/i);
if (!txMatch || !addressMatch) throw new Error(`Deployment returned without parseable transaction/address. Inspect ${MANIFEST}.`);
manifest.deploymentTransaction = txMatch[1];
manifest.contractAddress = addressMatch[1];

manifest.finalityOutput = run("Wait for finalized deployment", "npx", ["--no-install", "genlayer", "receipt", manifest.deploymentTransaction, "--status", "FINALIZED", "--rpc", RPC, "--retries", "360", "--interval", "5000"]);
if (!/status_name:\s*['"]FINALIZED['"]/.test(manifest.finalityOutput)
    || !/result_name:\s*['"]MAJORITY_AGREE['"]/.test(manifest.finalityOutput)) {
  manifest.status = "DEPLOYMENT_NOT_FINALIZED_SUCCESSFULLY";
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  throw new Error(`Deployment receipt is not finalized successfully. Inspect ${MANIFEST}.`);
}

const sourceResponse = await fetch(RPC, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "gen_getContractCode", params: [manifest.contractAddress] }),
});
if (!sourceResponse.ok) throw new Error(`Deployed source RPC returned HTTP ${sourceResponse.status}`);
const sourcePayload = await sourceResponse.json();
if (sourcePayload?.error || typeof sourcePayload?.result !== "string") {
  throw new Error(`Could not retrieve deployed source: ${JSON.stringify(sourcePayload?.error ?? sourcePayload)}`);
}
const deployedSource = Buffer.from(sourcePayload.result, "base64");
manifest.sourceVerificationOutput = `gen_getContractCode returned ${deployedSource.length} bytes`;
manifest.sourceByteMatch = deployedSource.equals(source);
manifest.deployedSourceSha256 = createHash("sha256").update(deployedSource).digest("hex");
manifest.sourceVerification = manifest.sourceByteMatch ? "BYTE_MATCH" : "MISMATCH_OR_UNPARSEABLE_OUTPUT";
manifest.status = manifest.sourceByteMatch ? "DEPLOYED_FINALIZED_BYTE_MATCH" : "DEPLOYED_FINALIZED_SOURCE_MISMATCH_REVIEW_REQUIRED";
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
const publicManifestPath = "deployment-manifest.public.json";
const publicManifest = JSON.parse(await readFile(publicManifestPath, "utf8"));
Object.assign(publicManifest, {
  contract: manifest.contractAddress,
  deploymentTransaction: manifest.deploymentTransaction,
  deploymentExplorerUrl: `${EXPLORER}/tx/${manifest.deploymentTransaction}`,
  repositorySourceSha256: sourceSha256,
  deployedSourceSha256: manifest.deployedSourceSha256,
  sourceCommit: manifest.sourceCommit,
  sourceVerification: manifest.sourceVerification,
  status: manifest.status,
});
await writeFile(publicManifestPath, `${JSON.stringify(publicManifest, null, 2)}\n`, "utf8");
if (!manifest.sourceByteMatch) throw new Error(`Deployed source did not byte-match repository source. Inspect ${MANIFEST}.`);
console.log(`Finalized deployment, receipt and deployed-source byte match recorded in ${MANIFEST}.`);
