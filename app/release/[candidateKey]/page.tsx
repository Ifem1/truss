"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, GitCommitHorizontal } from "lucide-react";
import AppShell from "@/components/AppShell";
import CopyButton from "@/components/CopyButton";
import StatusBadge from "@/components/StatusBadge";
import TxPanel from "@/components/TxPanel";
import { useWallet } from "@/components/WalletProvider";
import { appendEvidenceRound, assessCandidate, getCandidate, getPolicy, type CandidateRecord, type PolicyRecord } from "@/lib/contracts";
import { waitFinalized, explorerTx } from "@/lib/genlayer";

export default function Page() {
  const { candidateKey } = useParams<{ candidateKey: string }>(); const key = decodeURIComponent(candidateKey); const { address, wrongNetwork } = useWallet();
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null); const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [tx, setTx] = useState(""); const [phase, setPhase] = useState(""); const [error, setError] = useState(""); const [newEvidence, setNewEvidence] = useState("[]"); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  async function load() { setLoading(true); setError(""); try { const record = await getCandidate(key); setCandidate(record); setPolicy(record ? await getPolicy(record.policy_key) : null); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, [key]);
  async function act(kind: "assess" | "append") {
    if (!address) { setError("Connect the candidate-owner wallet first."); return; } if (wrongNetwork) { setError("Switch the connected wallet to Studionet 61999 before signing."); return; } if (busy) return; setBusy(true);
    try { setError(""); setPhase(kind === "assess" ? "requesting assessment signature" : "requesting evidence-round signature"); const hash = kind === "assess" ? await assessCandidate(address, key) : await appendEvidenceRound(address, key, newEvidence); setTx(hash); setPhase("submitted · waiting for FINALIZED"); await waitFinalized(hash); setPhase(kind === "assess" ? "assessment FINALIZED · rereading contract state" : "evidence round FINALIZED · rereading contract state"); await load(); setPhase("FINALIZED · authoritative contract state reloaded"); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase(/reject|denied/i.test(String(e)) ? "wallet signature rejected" : "transaction or consensus failed"); }
    finally { setBusy(false); }
  }
  if (loading) return <AppShell><div className="empty-state">Reading the finalized release dossier…</div></AppShell>;
  if (error && !candidate) return <AppShell><div className="error" role="alert">Could not load this dossier: {error}</div></AppShell>;
  if (!candidate) return <AppShell><div className="empty-state">No candidate with key <code>{key}</code> exists in finalized contract state.</div></AppShell>;
  const latestAttempt = candidate.assessment_attempts.at(-1);
  return <AppShell>
    <div className="dossier-overline"><Link href="/">Lineages</Link><span>/</span><Link href={`/policy/${encodeURIComponent(candidate.policy_key)}`}>{candidate.repository_owner}/{candidate.repository_name}</Link><span>/</span><span>Release dossier</span></div>
    <section className="dossier-hero"><div className="dossier-release-mark"><GitCommitHorizontal size={22}/><span>RELEASE</span></div><div className="dossier-title"><div className="eyebrow"><span className="eyebrow-line"/> FROZEN RELEASE COORDINATE</div><h1>{candidate.release_label}</h1><div className="dossier-repo">{candidate.repository_owner}/{candidate.repository_name}<span>·</span><span>policy {candidate.policy_key}</span></div></div><div className="dossier-state"><span className="section-kicker">CURRENT STATE</span><StatusBadge value={candidate.status}/><small>from finalized contract read</small></div></section>
    {phase ? <TxPanel hash={tx} phase={phase}/> : null}{error ? <div role="alert" className="error">{error}</div> : null}
    <section className="dossier-coordinate"><div className="coordinate-main"><span className="section-kicker">EXACT COMMIT</span><code>{candidate.commit_sha}</code><CopyButton value={candidate.commit_sha}/></div><div className="coordinate-meta"><div><small>PREDECESSOR</small><b>{candidate.predecessor_candidate_key || "Genesis"}</b></div><div><small>FROZEN POLICY DIGEST</small><code>{candidate.policy_digest}</code><CopyButton value={candidate.policy_digest}/></div><div><small>ASSESSMENTS</small><b>{candidate.assessment_attempts.length} {candidate.assessment_attempts.length === 1 ? "attempt" : "attempts"}</b></div></div></section>
    <div className="dossier-actions">{candidate.status === "OPEN" ? <button className="button" disabled={busy || !address || wrongNetwork} onClick={() => void act("assess")}>Request validator assessment <ArrowUpRight size={15}/></button> : null}<button className="button secondary" onClick={() => void load()}>Re-read finalized state</button><Link className="quiet-link" href={`/policy/${encodeURIComponent(candidate.policy_key)}`}>View frozen policy <ArrowUpRight size={14}/></Link></div>

    <section className="dossier-section"><div className="section-heading"><div><span className="section-kicker">01 / ROLE-BOUND EVIDENCE</span><h2>Evidence matrix.</h2></div><span className="section-side-note">Every round and retrieval stays inspectable.</span></div>
      {candidate.evidence_rounds.map(round => { const attempt = candidate.assessment_attempts.find(item => Number(item.evidence_round) === round.round); return <div className="dossier-round" key={round.round}><div className="round-heading"><div><span>ROUND {String(round.round).padStart(2,"0")}</span><small>{round.evidence.length} {round.evidence.length===1?"source":"sources"}</small></div><div><code>{round.evidence_round_digest}</code><CopyButton value={round.evidence_round_digest}/></div></div>
        <div className="evidence-matrix">{round.evidence.map((evidence,index) => { const item = (attempt?.evidence_states as Array<Record<string,unknown>>|undefined)?.find(value=>value.url===evidence.url); return <article className="evidence-matrix-row" key={`${evidence.url}-${index}`}>
          <div className="matrix-signal"><span className="matrix-index">{String(index+1).padStart(2,"0")}</span><div><b>{evidence.role.replaceAll("_"," ")}</b><small>{item?`HTTP ${String(item.http_status??"—")}`:"Not fetched yet"}</small></div></div>
          <div className="matrix-source"><a href={evidence.url} target="_blank" rel="noreferrer"><code>{evidence.url}</code><ArrowUpRight size={13}/></a><small>FROZEN SOURCE URL</small></div>
          <div className="matrix-finding"><p>{String(item?.finding??"Awaiting a finalized assessment of this source.")}</p>{item?.content_digest?<div className="digest-line"><code>{String(item.content_digest)}</code><CopyButton value={String(item.content_digest)}/></div>:null}</div>
          <div className="matrix-state">{item?<StatusBadge value={String(item.state??"UNAVAILABLE")}/>:<span className="quiet-text">Pending</span>}</div>
        </article>;})}</div></div>;})}
    </section>

    <section className="dossier-section"><div className="section-heading"><div><span className="section-kicker">02 / FROZEN STANDARD</span><h2>Criterion classifications.</h2></div><Link className="text-link" href={`/policy/${encodeURIComponent(candidate.policy_key)}`}>Policy details <ArrowUpRight size={14}/></Link></div>
      {policy ? <div className="criterion-matrix">{policy.criteria.map((criterion,index) => { const classified=(latestAttempt?.criteria as Array<Record<string,unknown>>|undefined)?.find(item=>item.id===criterion.id);return <article className="criterion-matrix-row" key={criterion.id}><span className="matrix-index">{String(index+1).padStart(2,"0")}</span><div><code>{criterion.id}</code><h3>{criterion.title}</h3><p>{criterion.rule}</p></div><div className="criterion-result"><p>{String(classified?.finding??"Not classified yet")}</p><StatusBadge value={String(classified?.state??"UNKNOWN")}/></div></article>;})}</div>:<div className="empty-state">Policy details could not be loaded; the frozen policy digest remains visible above.</div>}
    </section>

    <section className="dossier-section history-section"><div className="section-heading"><div><span className="section-kicker">03 / APPEND-ONLY RECORD</span><h2>Assessment history.</h2></div><span className="section-side-note">No attempt is overwritten.</span></div>
      {candidate.assessment_attempts.length ? <div className="attempt-timeline">{candidate.assessment_attempts.map((attempt,index) => <article className="timeline-attempt" key={String(attempt.assessment_digest??index)}><div className="timeline-marker"><span>{String(attempt.attempt??index+1).padStart(2,"0")}</span><i/></div><div className="timeline-content"><div className="attempt-heading"><div><span>ATTEMPT {String(attempt.attempt??index+1).padStart(2,"0")}</span><small>Evidence round {String(attempt.evidence_round??"?")}</small></div><StatusBadge value={String(attempt.verdict??"UNKNOWN")}/></div><p className="attempt-summary">{String(attempt.summary??"No summary stored.")}</p>{attempt.identity_finding?<p className="attempt-identity">Identity · {String(attempt.identity_finding)}</p>:null}{Array.isArray(attempt.material_findings)&&attempt.material_findings.length?<div className="material-findings">{(attempt.material_findings as unknown[]).map((finding,i)=><p key={i}>{String(finding)}</p>)}</div>:null}<div className="attempt-digests"><div><small>ASSESSMENT DIGEST</small><code>{String(attempt.assessment_digest??"")}</code><CopyButton value={String(attempt.assessment_digest??"")}/></div><div><small>EVIDENCE COMMITMENT</small><code>{String(attempt.evidence_commitment_digest??"")}</code><CopyButton value={String(attempt.evidence_commitment_digest??"")}/></div></div></div></article>)}</div>:<div className="empty-state">No finalized assessment attempt is stored. An open candidate has no verdict yet.</div>}
    </section>

    {candidate.status === "INSUFFICIENT_EVIDENCE" || candidate.status === "CONFLICTING_EVIDENCE" ? <section className="retry-panel"><div><span className="section-kicker">NEXT EVIDENCE ROUND</span><h2>Answer the open question.</h2><p>The previous evidence set and assessment remain unchanged. Submit a separately committed round for a new attempt.</p></div><label>Role-bound evidence JSON<textarea className="code tall" value={newEvidence} onChange={e=>setNewEvidence(e.target.value)}/></label><button className="button" disabled={busy||!address||wrongNetwork} onClick={()=>void act("append")}>Append evidence round</button></section>:null}
    <div className="dossier-footer"><span>Candidate key</span><code>{candidate.candidate_key}</code><CopyButton value={candidate.candidate_key}/>{tx?<a href={explorerTx(tx)} target="_blank" rel="noreferrer">Latest transaction <ArrowUpRight size={14}/></a>:null}</div>
  </AppShell>;
}
