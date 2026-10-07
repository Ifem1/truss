"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, GitCommitHorizontal, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CopyButton from "@/components/CopyButton";
import StatusBadge from "@/components/StatusBadge";
import { getAdmittedHead, getAdmittedHistory, getCandidate, getPolicy, listCandidateKeys, listPolicyKeys, type CandidateRecord, type PolicyRecord } from "@/lib/contracts";
import { CONTRACT_ADDRESS } from "@/lib/config";

export default function Home() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [policyKeys, candidateKeys] = await Promise.all([listPolicyKeys(), listCandidateKeys()]);
      const [allPolicies, allCandidates] = await Promise.all([Promise.all(policyKeys.map(getPolicy)), Promise.all(candidateKeys.map(getCandidate))]);
      const byLineage = new Map<string, PolicyRecord>();
      for (const policy of allPolicies) if (policy) { const old = byLineage.get(policy.lineage_key); if (!old || policy.version > old.version) byLineage.set(policy.lineage_key, policy); }
      setPolicies([...byLineage.values()]);
      setCandidates(allCandidates.filter((candidate): candidate is CandidateRecord => Boolean(candidate)));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <AppShell>
    <section className="home-intro">
      <div className="intro-orbit" aria-hidden="true"><span className="orbit orbit-outer"/><span className="orbit orbit-inner"/><span className="orbit-core"/><span className="orbit-node node-a"/><span className="orbit-node node-b"/><span className="orbit-node node-c"/></div>
      <div className="intro-copy">
        <div className="eyebrow"><span className="eyebrow-line"/> SOFTWARE RELEASE INTELLIGENCE <span className="network-tag">STUDIONET 61999</span></div>
        <h1>Every release<br/>has a <span>lineage.</span></h1>
        <p>Freeze the standard. Bind one exact commit. Let independent validators assess the evidence before the admitted line moves.</p>
        <div className="actions"><Link className="button" href="/policy/new">Create policy <ArrowUpRight size={16}/></Link><Link className="button secondary" href="/release/new">Evaluate release <ArrowUpRight size={16}/></Link></div>
        <div className="intro-foot"><span><i className="signal-dot"/> FINALIZED CONTRACT STATE</span><span>Every attempt stays on record</span></div>
      </div>
    </section>

    <section className="lineage-showcase" aria-labelledby="lineage-title">
      <div className="showcase-top"><div><span className="section-kicker">01 / RELEASE LINE</span><h2 id="lineage-title">Progress has a source.</h2></div><button className="icon-label-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""}/>Refresh state</button></div>
      {error ? <div className="error" role="alert">Could not read finalized contract state: {error}</div> : loading ? <div className="empty-state">Reading finalized policy and candidate records…</div> : policies.length ? policies.map(policy => <Lineage key={policy.policy_key} policy={policy}/>) : <div className="lineage-empty"><div className="empty-node"/><span>No admitted lineages yet</span><small>Publish an immutable policy to establish the first release line.</small><Link href="/policy/new">Create the first policy <ArrowUpRight size={14}/></Link></div>}
    </section>

    <section className="ledger-section">
      <div className="section-heading"><div><span className="section-kicker">02 / CONTRACT LEDGER</span><h2>State, directly from chain.</h2></div><div className="contract-label"><span>CONTRACT</span><code>{CONTRACT_ADDRESS}</code><CopyButton value={CONTRACT_ADDRESS}/></div></div>
      {error ? <div className="empty-state">Contract records are temporarily unavailable. Refresh to try again.</div> : loading ? <div className="empty-state">Loading final contract reads…</div> : policies.length ? <div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>Software / repository</th><th>Admitted head</th><th>Policy</th><th>Latest verdict</th><th/></tr></thead><tbody>{policies.map(p => <LedgerRow policy={p} candidates={candidates} key={p.policy_key}/>)}</tbody></table></div> : <div className="empty-state">The ledger will show frozen software policies after the first policy is finalized.</div>}
    </section>

    <section className="assessment-section"><div className="section-heading"><div><span className="section-kicker">03 / ASSESSMENT STREAM</span><h2>Recent candidate records.</h2></div><Link className="text-link" href="/release/new">Evaluate a release <ArrowUpRight size={14}/></Link></div>
      {candidates.length ? <div className="assessment-list">{[...candidates].reverse().slice(0, 7).map(candidate => <Link className="assessment-row" href={`/release/${encodeURIComponent(candidate.candidate_key)}`} key={candidate.candidate_key}>
        <span className="assessment-icon"><GitCommitHorizontal size={17}/></span><span className="assessment-version"><strong>{candidate.release_label}</strong><small>{candidate.repository_owner}/{candidate.repository_name}</small></span><code className="assessment-sha">{candidate.commit_sha.slice(0, 12)}…</code><StatusBadge value={candidate.status}/><ArrowUpRight size={15} className="row-arrow"/>
      </Link>)}</div> : <div className="empty-state">No candidates are recorded yet. Open a candidate to start an auditable assessment history.</div>}
    </section>
  </AppShell>;
}

function Lineage({ policy }: { policy: PolicyRecord }) {
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]); const [head, setHead] = useState(""); const [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([getAdmittedHistory(policy.lineage_key), getAdmittedHead(policy.lineage_key)]).then(([entries, current]) => { if (active) { setHistory(entries); setHead(current); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : String(e)); }); return () => { active = false; }; }, [policy.lineage_key]);
  return <article className="lineage-block">
    <div className="lineage-meta"><div><span className="repo-mark">{policy.repository_owner.slice(0,1).toUpperCase()}</span><div><Link href={`/policy/${encodeURIComponent(policy.policy_key)}`} className="software-name">{policy.software_name}</Link><small>{policy.repository_owner}/{policy.repository_name} <span>·</span> lineage {policy.lineage_key}</small></div></div><Link className="quiet-link" href={`/release/new?policy=${encodeURIComponent(policy.policy_key)}`}>Evaluate next <ArrowUpRight size={14}/></Link></div>
    {error ? <p className="error">Finalized lineage read failed: {error}</p> : history.length ? <div className="release-track" aria-label={`Admitted release history for ${policy.software_name}`}>
      {history.map((entry, i) => { const label = String(entry.release_label ?? entry.candidate_key ?? "release"); const key = String(entry.candidate_key ?? i); return <div className={`release-track-item${String(entry.candidate_key ?? "") === head ? " current" : ""}`} key={key}><span className="release-track-node"><i/></span><div className="release-track-data"><strong>{label}</strong><code>{String(entry.commit_sha ?? "").slice(0, 12)}…</code><small>{String(entry.candidate_key ?? "") === head ? "CURRENT HEAD" : "ADMITTED"}</small></div></div>; })}
      <div className="release-track-tail"><span className="tail-node"/><span>next release</span><ArrowDownRight size={15}/></div>
    </div> : <div className="lineage-empty compact"><div className="empty-node"/><span>Lineage established · awaiting first admission</span><small>Policy v{policy.version} is frozen. No candidate has advanced the head yet.</small></div>}
    <div className="lineage-bottom"><span><i className="signal-dot"/> HEAD <b>{head || "GENESIS"}</b></span><span>POLICY v{policy.version}</span><span>FINALIZED READ</span></div>
  </article>;
}

function LedgerRow({ policy, candidates }: { policy: PolicyRecord; candidates: CandidateRecord[] }) {
  const [headKey, setHeadKey] = useState("");
  useEffect(() => { let active = true; getAdmittedHead(policy.lineage_key).then(value => { if (active) setHeadKey(value); }).catch(() => { if (active) setHeadKey(""); }); return () => { active = false; }; }, [policy.lineage_key]);
  const head = candidates.find(item => item.candidate_key === headKey);
  const latest = [...candidates].reverse().find(item => item.lineage_key === policy.lineage_key);
  return <tr><td><strong>{policy.software_name}</strong><small>{policy.repository_owner}/{policy.repository_name}</small></td><td><code>{head ? `${head.release_label} · ${head.commit_sha.slice(0,8)}…` : "No admitted release"}</code></td><td><Link href={`/policy/${encodeURIComponent(policy.policy_key)}`}>v{policy.version} · {policy.policy_key}</Link></td><td>{latest ? <StatusBadge value={latest.status}/> : <span className="quiet-text">No assessment</span>}</td><td><Link className="table-arrow" href={`/policy/${encodeURIComponent(policy.policy_key)}`} aria-label={`Open ${policy.software_name} policy`}><ArrowUpRight size={15}/></Link></td></tr>;
}
