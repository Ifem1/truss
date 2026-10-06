"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { getAdmittedHead, getAdmittedHistory, getCandidate, getPolicy, listCandidateKeys, listPolicyKeys, type CandidateRecord, type PolicyRecord } from "@/lib/contracts";

export default function Home() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [policyKeys, candidateKeys] = await Promise.all([listPolicyKeys(), listCandidateKeys()]);
      const [allPolicies, allCandidates] = await Promise.all([
        Promise.all(policyKeys.map(getPolicy)),
        Promise.all(candidateKeys.map(getCandidate)),
      ]);
      const latestByLineage = new Map<string, PolicyRecord>();
      for (const policy of allPolicies) {
        if (!policy) continue;
        const previous = latestByLineage.get(policy.lineage_key);
        if (!previous || policy.version > previous.version) latestByLineage.set(policy.lineage_key, policy);
      }
      setPolicies([...latestByLineage.values()]);
      setCandidates(allCandidates.filter((candidate): candidate is CandidateRecord => Boolean(candidate)));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <AppShell>
    <section className="hero">
      <div>
        <span className="eyebrow">GENLAYER · STUDIONET 61999</span>
        <h1>Software changes.<br/><em>Admission should leave a trail.</em></h1>
        <p>Freeze the rule before the release. Bind a candidate to one exact commit. Let validators inspect the evidence independently. Advance the release line only when the judgment is finalized.</p>
        <div className="actions">
          <Link className="button" href="/policy/new">create admission policy</Link>
          <Link className="button secondary" href="/release/new">evaluate a release</Link>
        </div>
      </div>
      <div className="rail-card">
        <small>RELEASE ADMISSION</small>
        <div className="release-rail">
          <div className="release-node"><span className="section-kicker">01 / POLICY</span><strong>Freeze</strong><small>criteria + evidence roles</small></div>
          <div className="release-edge"/>
          <div className="release-node"><span className="section-kicker">02 / RELEASE</span><strong>Bind</strong><small>label + exact commit</small></div>
          <div className="release-edge"/>
          <div className="release-node"><span className="section-kicker">03 / VERDICT</span><strong>Finalize</strong><small>only admission moves head</small></div>
        </div>
        <p>Every attempt stays in the public record. Uncertainty can be answered with a new evidence round.</p>
      </div>
    </section>

    <section className="panel">
      <div className="refresh-row"><div><span className="section-kicker">CONTRACT STATE</span><h2>Admitted release lines</h2></div>
        <button className="button secondary" onClick={() => void refresh()} disabled={loading}>refresh state</button></div>
      {error ? <div className="error" role="alert">Could not read TRUSS contract state: {error}</div>
        : loading ? <div className="empty-state">Reconstructing public policy and release state from the contract…</div>
        : policies.length ? policies.map((policy) => <Lineage key={policy.policy_key} policy={policy}/> )
        : <div className="empty-state">No policy lineages are registered yet. Connect a wallet and publish the first immutable policy to begin.</div>}
    </section>

    <section className="triptych">
      <article><b>01</b><h2>freeze the standard</h2><p>Policies define context, criteria and role-specific evidence authorities before judgment.</p></article>
      <article><b>02</b><h2>bind the release</h2><p>Every candidate fixes repository, label, exact commit SHA and predecessor.</p></article>
      <article><b>03</b><h2>preserve every attempt</h2><p>Insufficient or conflicting evidence creates an append-only next round.</p></article>
    </section>

    <section className="panel">
      <span className="section-kicker">RECENT DOSSIERS</span><h2>Assessment history</h2>
      {candidates.length ? candidates.slice(-6).reverse().map((candidate) => <Link className="history-step" key={candidate.candidate_key} href={`/release/${encodeURIComponent(candidate.candidate_key)}`}>
        <code>{candidate.candidate_key}</code><strong>{candidate.release_label} · {candidate.repository_owner}/{candidate.repository_name}</strong><StatusBadge value={candidate.status}/>
      </Link>) : <p className="empty-state">Candidate history appears here after release coordinates are frozen on chain.</p>}
    </section>
  </AppShell>;
}

function Lineage({ policy }: { policy: PolicyRecord }) {
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [head, setHead] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    Promise.all([getAdmittedHistory(policy.lineage_key), getAdmittedHead(policy.lineage_key)])
      .then(([entries, admittedHead]) => { if (current) { setHistory(entries); setHead(admittedHead); } })
      .catch((e) => { if (current) setError(e instanceof Error ? e.message : String(e)); });
    return () => { current = false; };
  }, [policy.lineage_key]);

  return <article className="lineage-card">
    <div className="refresh-row"><div><Link href={`/policy/${encodeURIComponent(policy.policy_key)}`}><h3>{policy.software_name}</h3></Link>
      <code>{policy.repository_owner}/{policy.repository_name} · lineage {policy.lineage_key}</code></div>
      <Link className="button secondary" href={`/release/new?policy=${encodeURIComponent(policy.policy_key)}`}>evaluate next release</Link>
    </div>
    {error ? <p className="error">Could not read admitted history: {error}</p> : <div className="lineage-row">
      {history.length ? history.map((entry, i) => <div className="lineage-release" key={String(entry.candidate_key ?? i)}>
        <strong>{String(entry.release_label ?? "release")}</strong><code>{String(entry.commit_sha ?? "").slice(0, 12)}…</code>
      </div>) : <div className="empty-state">No release has been admitted under this policy yet.</div>}
    </div>}
    <small>current head: <code>{head || "none"}</code> · policy v{policy.version}</small>
  </article>;
}
