import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";

const rpc = "https://studio.genlayer.com/api";
const address = "0xEf2aF888D4e764678d97a1EC38e7519047440fFb";
const policyKey = "truss-final-20261006-policy";
const lineage = "truss-final-20261006-lineage";
const liveKey = process.env.TRUSS_LIVE_CYCLE_PRIVATE_KEY;
const deployKey = process.env.TRUSS_DEPLOYER_PRIVATE_KEY;
if (!liveKey || !deployKey) throw new Error("Explicit live-cycle and deployer keys are required in process environment.");
const owner = privateKeyToAccount(liveKey);
const other = privateKeyToAccount(deployKey);
if (owner.address.toLowerCase() !== "0xa49c51d759790116d451f256654dd9f0549d341f" || other.address.toLowerCase() !== "0x39680bd423437c0eaa18493629652821ec672c61") throw new Error("Explicit signer address verification failed.");
const client = createClient({ chain: studionet, endpoint: rpc });
const signer = createClient({ chain: studionet, endpoint: rpc, account: owner });
const otherSigner = createClient({ chain: studionet, endpoint: rpc, account: other });
const candidate = async (key) => JSON.parse(await client.readContract({ address, functionName: "get_candidate_json", args: [key], transactionHashVariant: "LATEST_FINAL" }));
const head = async () => client.readContract({ address, functionName: "get_admitted_head", args: [lineage], transactionHashVariant: "LATEST_FINAL" });
const wait = async (hash) => {
  const r = await client.waitForTransactionReceipt({ hash, status: "FINALIZED", retries: 360, interval: 5000 });
  if ((r.statusName ?? r.status_name) !== "FINALIZED") throw new Error(`Transaction ${hash} did not reach FINALIZED: ${JSON.stringify(r)}`);
  return r;
};
const write = async (functionName, args) => {
  const hash = await signer.writeContract({ address, functionName, args, value: 0n });
  const r = await wait(hash);
  console.log(JSON.stringify({ functionName, hash, status: r.statusName, result: r.txExecutionResultName ?? r.result_name ?? r.result }));
  return hash;
};
const evidence = (role, url) => ({ role, url });
const api = "https://api.github.com/repos/Ifem1/truss/commits/c5e6690b3d85200de83b5edb7ecf761db477d747";
const raw = "https://raw.githubusercontent.com/Ifem1/truss/c5e6690b3d85200de83b5edb7ecf761db477d747/package.json";
const evGood = JSON.stringify([evidence("RELEASE_IDENTITY", api), evidence("RELEASE_IDENTITY", raw)]);
const evMissing = JSON.stringify([evidence("RELEASE_IDENTITY", "https://api.github.com/repos/Ifem1/truss/commits/0000000000000000000000000000000000000000"), evidence("RELEASE_IDENTITY", "https://raw.githubusercontent.com/Ifem1/truss/0000000000000000000000000000000000000000/package.json")]);
const commit = "c5e6690b3d85200de83b5edb7ecf761db477d747";
const open = async (key, label, sha, predecessor, ev) => {
  const existing = await client.readContract({ address, functionName: "get_candidate_json", args: [key], transactionHashVariant: "LATEST_FINAL" });
  if (existing) { console.log(JSON.stringify({ candidate: key, open: "already finalized" })); return null; }
  return write("open_candidate", [key, policyKey, label, sha, predecessor, ev]);
};
const assess = async (key) => {
  const c = await candidate(key);
  if (!c || c.status !== "OPEN") { console.log(JSON.stringify({ candidate: key, assessment: "not open; no submission" })); return null; }
  return write("assess_candidate", [key]);
};
const report = async (key) => {
  const c = await candidate(key);
  if (!c) { console.log(JSON.stringify({ candidate: key, status: "not stored", head: await head() })); return null; }
  console.log(JSON.stringify({ candidate: key, status: c.status, rounds: c.evidence_rounds.length, attempts: c.assessment_attempts.map(x => x.verdict), head: await head() }));
  return c;
};

// Rejected label/package mismatch, with the admitted head held constant.
const admittedHead = await head();
await open("truss-final-20261006-reject", "9.9.9", commit, admittedHead, evGood);
await assess("truss-final-20261006-reject");
await report("truss-final-20261006-reject");

// Retryable unavailable evidence followed by a distinct appended evidence round.
await open("truss-final-20261006-retry", "0.1.1", commit, admittedHead, evMissing);
await assess("truss-final-20261006-retry");
let retry = await report("truss-final-20261006-retry");
if (retry && ["INSUFFICIENT_EVIDENCE", "CONFLICTING_EVIDENCE"].includes(retry.status) && retry.evidence_rounds.length === 1) {
  await write("append_evidence_round", ["truss-final-20261006-retry", evGood]);
  await assess("truss-final-20261006-retry");
  retry = await report("truss-final-20261006-retry");
}

// Duplicate coordinate and malformed evidence-scope attacks must finalize as rejected writes.
for (const [label, args] of [
  ["duplicate", ["truss-final-20261006-duplicate", policyKey, "0.1.0", commit, "", evGood]],
  ["invalid-scope", ["truss-final-20261006-invalidscope", policyKey, "0.2.0", "b".repeat(40), admittedHead, JSON.stringify([evidence("RELEASE_IDENTITY", "https://api.github.com.evil.invalid/repos/Ifem1/truss/commits/x")])]],
]) {
  const hash = await write("open_candidate", args);
  const after = await client.readContract({ address, functionName: "get_candidate_json", args: [args[0]], transactionHashVariant: "LATEST_FINAL" });
  console.log(JSON.stringify({ attack: label, hash, rejected: !after, stored: Boolean(after) }));
}

// Non-owner policy successor must be rejected; prove frozen active policy is unchanged.
const successorArgs = ["truss-final-20261006-policy-unauthorized", lineage, "TRUSS synthetic live cycle", "Ifem1", "truss", "Synthetic fixture for live lifecycle checks only; this is not real-world release evidence.", "A synthetic fixture policy used only to verify that policy mutation requires the frozen lineage owner and that validator judgment is required before a release can advance.", JSON.stringify([{ id: "VERSION_MATCH", title: "Version matches", rule: "The release label must match the package version fetched from the exact pinned commit." }]), JSON.stringify(["RELEASE_IDENTITY", "TEST_STATUS"]), JSON.stringify({ RELEASE_IDENTITY: ["api.github.com|/repos/Ifem1/truss/commits/"], TEST_STATUS: ["raw.githubusercontent.com|/Ifem1/truss/"] }), policyKey];
try { const hash = await otherSigner.writeContract({ address, functionName: "create_policy", args: successorArgs, value: 0n }); const r = await wait(hash); console.log(JSON.stringify({ attack: "unauthorized-policy-mutation", hash, result: r.txExecutionResultName ?? r.result_name ?? r.result })); }
catch (e) { console.log(JSON.stringify({ attack: "unauthorized-policy-mutation", rejected: true, error: String(e).slice(0, 240) })); }
console.log(JSON.stringify({ finalPolicyKey: await client.readContract({ address, functionName: "get_active_policy_key", args: [lineage], transactionHashVariant: "LATEST_FINAL" }), finalHead: await head() }));

// Race two children against one finalized head; open both before either can move it.
const currentHead = await head();
const parent = "c5e6690b3d85200de83b5edb7ecf761db477d747";
const parentApi = "https://api.github.com/repos/Ifem1/truss/commits/c5e6690b3d85200de83b5edb7ecf761db477d747";
// Use distinct exact commits from the same public repository so coordinates differ.
const commits = [parent, "a40145063f28544dab62dfde0453b5b7729b1739"];
const urls = commits.map(x => JSON.stringify([evidence("RELEASE_IDENTITY", `https://api.github.com/repos/Ifem1/truss/commits/${x}`), evidence("RELEASE_IDENTITY", `https://raw.githubusercontent.com/Ifem1/truss/${x}/package.json`)]));
await open("truss-final-20261006-race-a", "0.1.0", commits[0], currentHead, urls[0]);
await open("truss-final-20261006-race-b", "0.1.0", commits[1], currentHead, urls[1]);
await assess("truss-final-20261006-race-a");
await report("truss-final-20261006-race-a");
await assess("truss-final-20261006-race-b");
await report("truss-final-20261006-race-b");
