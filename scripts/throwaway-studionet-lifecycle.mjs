import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";

const rpc = "https://studio.genlayer.com/api";
const registry = "0x20193443d1E429e4984B118FF54DC77547b0fBCB";
const explorer = "https://explorer-studio.genlayer.com/tx/";
const lineage = "truss-test-lifecycle-20261011";
const policyKey = "truss-test-lifecycle-policy-20261011";
const candidateKey = "truss-test-lifecycle-v012-candidate";
const releaseLabel = "v0.1.2-actions-proof";
const commit = "52aca980fe74147efee7b79c3e19652dc2d3bfa7";
const evidence = [
  { role: "RELEASE_IDENTITY", url: "https://api.github.com/repos/Ifem1/truss/git/ref/tags/v0.1.2-actions-proof", digest: "6802868ecd310226c319848178bcbf9b7a054ba4f8554cc49d7320be21369faa" },
  { role: "RELEASE_IDENTITY", url: "https://api.github.com/repos/Ifem1/truss/git/tags/c10939d6449a107dfd84de2981d69dc8727d6822", digest: "ee9b1cfe368d74405d16b57f6f212933d57f7f4a7095168ece122b603a495f72" },
  { role: "TEST_STATUS", url: "https://api.github.com/repos/Ifem1/truss/actions/runs/37973817856", digest: "83cf037524760922a46a365f45c311114da504ee41a6a2efea04646fb39b8567" },
];
const expected = {
  owner: "0x39680bd423437c0eaa18493629652821ec672c61",
  publisher: "0x77e2edbb43277bf772e207c517dde731935ffba5",
  issuer: "0x6b476bf35c4968f3f1775c0ca2110591b4b5fcbe",
};
const keys = Object.fromEntries(["owner", "publisher", "issuer"].map((role) => {
  const value = process.env[`TRUSS_${role.toUpperCase()}_KEY`];
  if (!value) throw new Error(`Missing in-memory signer variable TRUSS_${role.toUpperCase()}_KEY`);
  const account = privateKeyToAccount(value);
  if (account.address.toLowerCase() !== expected[role]) throw new Error(`Unexpected ${role} signer address`);
  return [role, account];
}));
const publicClient = createClient({ chain: studionet, endpoint: rpc });
const clients = Object.fromEntries(Object.entries(keys).map(([role, account]) => [role, createClient({ chain: studionet, endpoint: rpc, account })]));

const print = (x) => console.log(JSON.stringify(x, (_, value) => typeof value === "bigint" ? value.toString() : value));
const read = (address, functionName, args = []) => publicClient.readContract({ address, functionName, args, transactionHashVariant: "LATEST_FINAL" });
const waitFinal = async (hash) => {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, status: "FINALIZED", retries: 360, interval: 5000 });
  const status = receipt.statusName ?? receipt.status_name;
  if (status !== "FINALIZED") throw new Error(`Not finalized: ${hash}; ${JSON.stringify(receipt)}`);
  const consensus = receipt.resultName ?? receipt.result_name;
  const executions = receipt.leader_receipt ?? receipt.consensus_data?.leader_receipt ?? [];
  const leader = executions.find((x) => x.mode === "leader");
  if (consensus !== "MAJORITY_AGREE" || leader?.execution_result !== "SUCCESS") {
    throw new Error(`Finalized transaction lacks successful majority execution: ${hash}; consensus=${consensus}; leader=${leader?.execution_result ?? "missing"}`);
  }
  return receipt;
};
const write = async (role, address, functionName, args) => {
  const hash = await clients[role].writeContract({ address, functionName, args, value: 0n });
  print({ stage: functionName, hash, explorer: explorer + hash, submittedBy: keys[role].address });
  const receipt = await waitFinal(hash);
  print({ stage: `${functionName}:receipt`, hash, status: receipt.statusName ?? receipt.status_name, consensus: receipt.resultName ?? receipt.result_name, executionRecords: (receipt.leader_receipt ?? receipt.consensus_data?.leader_receipt ?? []).map((x) => ({ mode: x.mode, result: x.execution_result, vote: x.vote, errorCode: x.genvm_result?.error_code })) });
  return { hash, receipt };
};
const hashBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");

const activePolicy = await read(registry, "get_active_policy_key", [lineage]);
if (activePolicy && activePolicy !== policyKey) throw new Error(`Unexpected active policy for test lineage: ${activePolicy}`);
let rawPolicy = await read(registry, "get_policy_json", [policyKey]);
if (!rawPolicy) {
  const criteria = [{
    id: "TAG_AND_CI_MATCH",
    title: "GitHub release tag and CI agree",
    rule: "The exact annotated GitHub tag must resolve to the candidate commit. The designated GitHub Actions run must be completed successfully for that exact commit, repository, CI workflow, and push event.",
  }];
  const authorities = {
    RELEASE_IDENTITY: [
      "api.github.com|/repos/Ifem1/truss/git/ref/tags/",
      "api.github.com|/repos/Ifem1/truss/git/tags/",
    ],
    TEST_STATUS: ["api.github.com|/repos/Ifem1/truss/actions/runs/"],
  };
  const assurance = "Throwaway Studionet lifecycle policy. Designated issuer attestations bind exact fetched bytes; this does not independently establish issuer organizational independence or GitHub Actions execution authenticity.";
  const admission = `${assurance} Admit only when the canonical repository tag resolves to the candidate commit and the pinned GitHub Actions run reports completed success for the same commit and repository.`;
  await write("owner", registry, "create_policy_with_issuers", [
    policyKey, lineage, "TRUSS test lifecycle", "Ifem1", "truss",
    "Throwaway live lifecycle validation on Studionet; not a production policy.", admission,
    JSON.stringify(criteria), JSON.stringify(["RELEASE_IDENTITY", "TEST_STATUS"]),
    JSON.stringify(authorities), "", keys.publisher.address,
    JSON.stringify({ RELEASE_IDENTITY: keys.issuer.address, TEST_STATUS: keys.issuer.address }),
  ]);
  rawPolicy = await read(registry, "get_policy_json", [policyKey]);
}
if (!rawPolicy) throw new Error("Policy creation did not appear in canonical state");
const policy = JSON.parse(rawPolicy);
if (policy.owner.toLowerCase() !== keys.owner.address.toLowerCase()
    || policy.publisher.toLowerCase() !== keys.publisher.address.toLowerCase()
    || policy.evidence_issuers.RELEASE_IDENTITY.toLowerCase() !== keys.issuer.address.toLowerCase()
    || policy.evidence_issuers.TEST_STATUS.toLowerCase() !== keys.issuer.address.toLowerCase()) {
  throw new Error("Canonical policy signer binding does not match the authorized test wallet roles");
}
print({ stage: "policy-canonical-read", lineage, policyKey, policyDigest: policy.policy_digest, owner: policy.owner, publisher: policy.publisher, evidenceIssuers: policy.evidence_issuers, status: "THROWAWAY_TEST_ONLY" });

const configuredGate = await read(registry, "get_activation_gate", [policyKey]).catch(() => "");
let gate = process.env.TRUSS_TEST_GATE_ADDRESS || configuredGate || "";
if (!gate) {
  const gateSource = await readFile("contracts/release_activation_gate.py");
  const sourceHash = hashBytes(gateSource);
  const hash = await clients.owner.deployContract({
    code: gateSource.toString("utf8"),
    args: [registry, keys.publisher.address, lineage, policy.policy_digest, "Ifem1", "truss"],
  });
  print({ stage: "gate-deployment-submitted", hash, explorer: explorer + hash, sourceHash, sourceBytes: gateSource.length });
  const receipt = await waitFinal(hash);
  print({ stage: "gate-deployment-receipt", hash, status: receipt.status_name, consensus: receipt.result_name, leaderExecution: receipt.leader_receipt?.map((x) => x.execution_result) });
  gate = receipt.contract_address ?? receipt.contractAddress ?? receipt.data?.contract_address ?? "";
}
if (!gate) throw new Error("No gate address available after deployment/configuration");
const gateSource = await readFile("contracts/release_activation_gate.py");
const sourceHash = hashBytes(gateSource);
const deployed = await fetch(rpc, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "gen_getContractCode", params: [gate] }),
});
const sourcePayload = await deployed.json();
if (!deployed.ok || sourcePayload.error || typeof sourcePayload.result !== "string") throw new Error(`Gate source read failed: ${JSON.stringify(sourcePayload.error ?? sourcePayload)}`);
const deployedBytes = Buffer.from(sourcePayload.result, "base64");
if (!deployedBytes.equals(gateSource)) throw new Error(`Gate source mismatch: local ${sourceHash}, deployed ${hashBytes(deployedBytes)}`);
print({ stage: "gate-source-byte-verification", gate, sourceHash, deployedSourceHash: hashBytes(deployedBytes), byteMatch: true });
if (!configuredGate && process.env.TRUSS_GATE_CONFIGURED !== "true") await write("owner", registry, "configure_activation_gate", [policyKey, gate]);
print({ stage: "gate-config-canonical-read", gate, frozenPolicyDigest: policy.policy_digest, configurationWritten: Boolean(configuredGate) || process.env.TRUSS_GATE_CONFIGURED === "true" || !process.env.TRUSS_TEST_GATE_ADDRESS });

let prior = await read(registry, "get_candidate_json", [candidateKey]);
const evidenceJson = JSON.stringify(evidence.map(({ role, url }) => ({ role, url })));
if (!prior) {
  await write("publisher", registry, "open_candidate", [candidateKey, policyKey, releaseLabel, commit, "", evidenceJson]);
  prior = await read(registry, "get_candidate_json", [candidateKey]);
}
let opened = JSON.parse(prior);
if (opened.status !== "OPEN") throw new Error(`Candidate is no longer open for attestation: ${opened.status}`);
const roundNumber = opened.evidence_rounds.length;
const roundItems = opened.evidence_rounds.at(-1)?.evidence ?? [];
for (const item of evidence) {
  if (!roundItems.some((x) => x.role === item.role && x.url === item.url)) throw new Error(`Evidence item is not in current on-chain round: ${item.url}`);
  if (!opened.evidence_attestations.some((x) => x.round === roundNumber && x.role === item.role && x.url === item.url && x.content_digest === item.digest)) {
    await write("issuer", registry, "attest_evidence", [candidateKey, item.role, item.url, item.digest]);
    opened = JSON.parse(await read(registry, "get_candidate_json", [candidateKey]));
  }
}
if (!opened.sealed_evidence_rounds.includes(roundNumber)) await write("publisher", registry, "seal_candidate", [candidateKey]);
let candidate = await read(registry, "get_candidate_json", [candidateKey]);
if (!candidate) throw new Error("Candidate missing from canonical registry state");
candidate = JSON.parse(candidate);
print({ stage: "candidate-preassessment-canonical-read", candidateKey, status: candidate.status, evidenceRounds: candidate.evidence_rounds.length, sealedRounds: candidate.sealed_evidence_rounds });
if (candidate.status === "OPEN") {
  await write("publisher", registry, "assess_candidate", [candidateKey]);
}
candidate = JSON.parse(await read(registry, "get_candidate_json", [candidateKey]));
print({ stage: "candidate-postassessment-canonical-read", candidateKey, status: candidate.status, attempts: candidate.assessment_attempts, admittedHead: await read(registry, "get_admitted_head", [lineage]), pendingRegistryActivation: await read(registry, "get_pending_activation_json", [lineage]) });
if (candidate.status !== "ADMITTED") throw new Error(`Candidate was not admitted; stopping before activation. Verdict=${candidate.assessment_attempts.at(-1)?.verdict ?? "unknown"}`);

const poll = async (fn, label) => {
  for (let i = 0; i < 72; i++) {
    const value = await fn();
    if (value && value !== "{}") return value;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error(`Timed out waiting for finalized ${label} message; no follow-on write submitted`);
};
const pendingGate = await poll(() => read(gate, "get_pending_admission_json"), "registry-to-gate admission");
print({ stage: "gate-admission-canonical-read", gate, pendingAdmission: pendingGate });
const gatePending = JSON.parse(pendingGate);
if (gatePending.candidate_key !== candidateKey || gatePending.policy_digest !== policy.policy_digest) throw new Error("Finalized gate admission does not match the frozen candidate/policy");
const activeBefore = await read(gate, "get_active_candidate");
if (activeBefore) throw new Error(`Throwaway gate unexpectedly active before activation: ${activeBefore}`);
const activation = await write("publisher", gate, "activate_release", [candidateKey]);
const activeAfter = await poll(() => read(gate, "get_active_candidate"), "gate activation state");
const gateHistory = await read(gate, "get_activation_history_json");
const pendingAck = await read(gate, "get_pending_acknowledgment_json");
print({ stage: "gate-postactivation-canonical-read", gate, activeCandidate: activeAfter, activationHistory: gateHistory, pendingAcknowledgment: pendingAck, activationTx: activation.hash });
const ackHistory = await poll(() => read(registry, "get_activation_ack_history_json", [lineage]), "finalized activation acknowledgment");
const registryHead = await read(registry, "get_admitted_head", [lineage]);
const pendingRegistry = await read(registry, "get_pending_activation_json", [lineage]);
print({ stage: "lifecycle-final-canonical-reread", registry, gate, registryHead, gateActiveCandidate: activeAfter, registryActivationAckHistory: ackHistory, pendingRegistryActivation: pendingRegistry, gateActivationHistory: gateHistory, gatePendingAcknowledgment: pendingAck, successfulActivationTx: activation.hash, status: "LIVE_STATE_REQUIRES_RECEIPT_REVIEW" });
