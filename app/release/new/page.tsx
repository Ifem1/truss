"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import TxPanel from "@/components/TxPanel";
import { useWallet } from "@/components/WalletProvider";
import { getAdmittedHead, getPolicy, openCandidate, type PolicyRecord } from "@/lib/contracts";
import { waitFinalized } from "@/lib/genlayer";
import { Check, GitCommitHorizontal } from "lucide-react";

export default function Page() {
  return <Suspense fallback={<AppShell><div className="empty-state">Loading the frozen policy…</div></AppShell>}><NewReleaseForm /></Suspense>;
}

function NewReleaseForm() {
  const { address, wrongNetwork } = useWallet();
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
  const scopeFeedback = (role: string, rawUrl: string) => {
    if (!rawUrl.trim() || !policy) return "";
    try {
      const url = new URL(rawUrl);
      const allowed = (policy.evidence_authorities[role] ?? []).some((scope) => url.protocol === "https:" && url.hostname.toLowerCase() === scope.host.toLowerCase() && url.pathname.startsWith(scope.path_prefix));
      return allowed ? "Scope matches the frozen policy" : "This URL appears outside the frozen authority scope. Contract validation remains authoritative.";
    } catch { return "Enter a complete https:// URL"; }
  };

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
    if (wrongNetwork) { setError("Switch the connected wallet to Studionet 61999 before opening a candidate."); return; }
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
    <div className="page-head page-head-editorial">
      <div className="eyebrow"><span className="eyebrow-line"/> RELEASE CANDIDATE <span className="network-tag">EXACT COORDINATE</span></div>
      <h1>Bind a release<br/>to <span>one commit.</span></h1>
      <p>Choose the frozen policy, identify the exact release and provide one public source for every required evidence role.</p>
    </div>
    <div className="candidate-layout"><div className="candidate-main">
      <section className="editor-section"><div className="editor-title"><span>01</span><div><h2>Release coordinate</h2><p>Repository, release label and exact commit are frozen together.</p></div></div>
        <div className="form-grid"><label className="wide">Policy key<input value={policyKey} onChange={(e) => void selectPolicy(e.target.value)} aria-describedby="policy-help" placeholder="Choose an existing policy key" /></label><small id="policy-help" className="wide field-note">Use the active policy for this lineage. TRUSS checks the predecessor again when validators assess the candidate.</small>
          <label>Candidate key<input value={candidateKey} onChange={(e) => setCandidateKey(e.target.value)} placeholder="project-release-2-8-0" /></label><label>Release label<input value={releaseLabel} onChange={(e) => setReleaseLabel(e.target.value)} placeholder="v2.8.0" /></label>
          <label className="wide commit-field">Exact commit SHA<div className="commit-input-wrap"><GitCommitHorizontal size={18}/><input aria-label="Exact commit SHA" value={commitSha} onChange={(e) => setCommitSha(e.target.value)} maxLength={40} spellCheck={false} placeholder="40 hexadecimal characters"/><span className={/^[0-9a-fA-F]{40}$/.test(commitSha)?"commit-valid":"commit-count"}>{/^[0-9a-fA-F]{40}$/.test(commitSha)?<Check size={14}/>:`${commitSha.length}/40`}</span></div></label>
        </div>
      </section>
      {policy ? <section className="editor-section"><div className="editor-title"><span>02</span><div><h2>Evidence sources</h2><p>One independently reviewable source for every required role.</p></div></div>
        <div className="evidence-modules">{policy.required_roles.map((role,index) => {const scopes=policy.evidence_authorities[role]??[];const feedback=scopeFeedback(role,sources[role]??"");return <article className="evidence-module" key={role}>
          <div className="evidence-module-head"><span className="module-index">SIGNAL {String(index+1).padStart(2,"0")}</span><span className="module-live"><i/> REQUIRED</span></div><label>{role.replaceAll("_"," ")}<input type="url" placeholder="https://public-source.example/path" value={sources[role]??""} onChange={(e)=>setSources(old=>({...old,[role]:e.target.value}))}/></label>
          <div className="scope-line"><span>FROZEN SCOPE</span>{scopes.map(scope=><code key={scope.host+scope.path_prefix}>{scope.host}{scope.path_prefix}</code>)}</div>{feedback?<p className={`scope-feedback${feedback.startsWith("Scope matches")?" scope-ok":" scope-warning"}`}>{feedback}</p>:null}
        </article>;})}</div>
      </section>:<div className="empty-state">Load a policy to see its frozen evidence roles, accepted authority scopes and current admitted predecessor.</div>}
    </div><aside className="candidate-aside"><div className="aside-sticky"><span className="section-kicker">LINEAGE CHECKPOINT</span><h2>Next in line.</h2>{policy?<><div className="predecessor-flow"><div className="flow-entry"><span className="flow-dot current-dot"/><small>CURRENT ADMITTED HEAD</small><strong>{head?head.slice(0,16)+"…":"Genesis"}</strong></div><div className="flow-stem"/><div className="flow-entry candidate-entry"><span className="flow-dot candidate-dot"/><small>PROPOSED CANDIDATE</small><strong>{releaseLabel||"Release label"}</strong><code>{commitSha?commitSha.slice(0,12)+"…":"commit SHA pending"}</code></div></div><div className="candidate-policy"><small>FROZEN POLICY</small><b>{policy.software_name}</b><code>{policy.policy_digest.slice(0,22)}…</code></div></>:<div className="empty-state">Select a policy to read its current admitted head.</div>}<p className="field-note">Only a finalized ADMITTED assessment can advance the lineage. Opening this candidate does not move the head.</p></div></aside></div>
    {error ? <div className="error" role="alert">{error}</div> : null}
    <TxPanel hash={tx} phase={phase} />
    <div className="submit-bar"><div><b>Freeze this release coordinate?</b><small>{wrongNetwork?"Switch to Studionet 61999 before signing.":"Opening the candidate does not change the admitted head."}</small></div><button className="button" disabled={busy || !address || wrongNetwork || !policy || !candidateKey || !releaseLabel || !/^[0-9a-fA-F]{40}$/.test(commitSha)} onClick={() => void submit()}>{busy ? "Waiting for finalized result…" : "Open release candidate"}</button></div>
  </AppShell>;
}
