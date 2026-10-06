"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import TxPanel from "@/components/TxPanel";
import { useWallet } from "@/components/WalletProvider";
import { getAdmittedHead, getPolicy, openCandidate, type PolicyRecord } from "@/lib/contracts";
import { waitFinalized } from "@/lib/genlayer";

export default function Page() {
  return <Suspense fallback={<AppShell><div className="empty-state">Loading the frozen policy…</div></AppShell>}><NewReleaseForm /></Suspense>;
}

function NewReleaseForm() {
  const { address } = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const [policyKey, setPolicyKey] = useState("");
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [head, setHead] = useState("");
  const [candidateKey, setCandidateKey] = useState("");
  const [releaseLabel, setReleaseLabel] = useState("");
  const [commitSha, setCommitSha] = useState("");
  const [sources, setSources] = useState<Record<string, string>>({});
  const [tx, setTx] = useState("");
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const selected = params.get("policy") ?? "";
    setPolicyKey(selected);
    if (!selected) { setPolicy(null); setHead(""); return; }
    let current = true;
    setPolicy(null);
    setError("");
    getPolicy(selected)
      .then(async (record) => [record, record ? await getAdmittedHead(record.lineage_key) : ""] as const)
      .then(([record, admittedHead]) => { if (current) { setPolicy(record); setHead(admittedHead); } })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : String(e)); });
    return () => { current = false; };
  }, [params]);

  async function selectPolicy(key: string) {
    setPolicyKey(key);
    setPolicy(null);
    setHead("");
    setError("");
    if (!key) return;
    try {
      const record = await getPolicy(key);
      setPolicy(record);
      setHead(record ? await getAdmittedHead(record.lineage_key) : "");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function submit() {
    if (!address) { setError("Connect the policy-owner wallet first."); return; }
    if (!policy) { setError("Load a valid policy before opening a candidate."); return; }
    if (!/^[0-9a-fA-F]{40}$/.test(commitSha)) { setError("Enter the exact 40-hex commit SHA."); return; }
    const evidence = policy.required_roles.map((role) => ({ role, url: (sources[role] ?? "").trim() }));
    if (evidence.some((item) => !item.url)) { setError("Add one public source URL for each required evidence role."); return; }
    if (busy) return;
    setBusy(true);
    try {
      setError("");
      setPhase("requesting wallet signature");
      const hash = await openCandidate(address, [candidateKey, policyKey, releaseLabel, commitSha, head, JSON.stringify(evidence)]);
      setTx(hash);
      setPhase("submitted · waiting for FINALIZED");
      await waitFinalized(hash);
      setPhase("FINALIZED · opening release dossier");
      router.push(`/release/${encodeURIComponent(candidateKey)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase(/reject|denied/i.test(String(e)) ? "wallet signature rejected" : "transaction or consensus failed");
    } finally { setBusy(false); }
  }

  return <AppShell>
    <div className="page-head">
      <span className="eyebrow">RELEASE CANDIDATE · FROZEN COORDINATE</span>
      <h1>Freeze the exact thing being judged.</h1>
      <p>TRUSS binds one release label and exact commit to the current admitted predecessor and the policy digest.</p>
    </div>
    {policy ? <div className="metrics">
      <div><small>frozen policy</small><b>{policy.software_name}</b><code>{policy.repository_owner}/{policy.repository_name}</code></div>
      <div><small>policy digest</small><code>{policy.policy_digest}</code></div>
      <div><small>current admitted predecessor</small><b>{head || "genesis · no admitted release"}</b></div>
    </div> : null}
    <div className="form-grid">
      <label className="wide">Policy key<input value={policyKey} onChange={(e) => void selectPolicy(e.target.value)} aria-describedby="policy-help" /></label>
      <small id="policy-help" className="wide">Use the policy that is active for this lineage. TRUSS checks the predecessor again when validators assess the candidate.</small>
      <label>Candidate key<input value={candidateKey} onChange={(e) => setCandidateKey(e.target.value)} /></label>
      <label>Release label<input value={releaseLabel} onChange={(e) => setReleaseLabel(e.target.value)} /></label>
      <label className="wide">Exact commit SHA<input value={commitSha} onChange={(e) => setCommitSha(e.target.value)} maxLength={40} spellCheck={false} /></label>
    </div>
    {policy ? <section className="panel"><span className="section-kicker">ROLE-BOUND EVIDENCE</span><h2>Give each required role a public source</h2>
      <div className="form-grid">{policy.required_roles.map((role) => <label className="wide" key={role}>{role}<input type="url" placeholder="https://…" value={sources[role] ?? ""} onChange={(e) => setSources((old) => ({ ...old, [role]: e.target.value }))} />
        <small>Allowed scopes: {(policy.evidence_authorities[role] ?? []).map((scope) => `${scope.host}${scope.path_prefix}`).join(" · ")}</small>
      </label>)}</div>
    </section> : <div className="empty-state">Load a policy to see its frozen roles, authority scopes and current admitted predecessor.</div>}
    {error ? <div className="error" role="alert">{error}</div> : null}
    <TxPanel hash={tx} phase={phase} />
    <button className="button" disabled={busy || !address || !policy || !candidateKey || !releaseLabel || !/^[0-9a-fA-F]{40}$/.test(commitSha)} onClick={() => void submit()}>{busy ? "waiting for finalized result…" : "open release candidate"}</button>
  </AppShell>;
}
