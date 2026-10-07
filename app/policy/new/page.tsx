"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import TxPanel from "@/components/TxPanel";
import { useWallet } from "@/components/WalletProvider";
import { createPolicy } from "@/lib/contracts";
import { waitFinalized } from "@/lib/genlayer";

type Criterion = { id: string; title: string; rule: string };
type Role = { id: string; label: string; host: string; path: string };
const roleOptions = [
  ["RELEASE_IDENTITY", "Release identity", "api.github.com", "/repos/"],
  ["TEST_STATUS", "Test status", "github.com", "/"],
  ["SECURITY_STATUS", "Security status", "github.com", "/"],
  ["CHANGE_DISCLOSURE", "Change disclosure", "github.com", "/"],
  ["MIGRATION_GUIDE", "Migration guide", "github.com", "/"],
  ["PROVENANCE", "Provenance", "api.github.com", "/repos/"],
] as const;

export default function Page() {
  const { address, wrongNetwork } = useWallet();
  const [f, setF] = useState({ policyKey: "", lineageKey: "", softwareName: "", owner: "", repo: "", context: "", policy: "", predecessor: "" });
  const [criteria, setCriteria] = useState<Criterion[]>([{ id: "IDENTITY_BOUND", title: "Exact release identity", rule: "Official release evidence must bind the stated release to the exact candidate commit SHA." }, { id: "TESTS_PASS", title: "Required release checks", rule: "Admissible test evidence must materially show required release checks completed successfully for the exact candidate." }]);
  const [roles, setRoles] = useState<Role[]>([
    { id: "RELEASE_IDENTITY", label: "Release identity", host: "api.github.com", path: "/repos/" },
    { id: "TEST_STATUS", label: "Test status", host: "github.com", path: "/" },
  ]);
  const [advanced, setAdvanced] = useState(false);
  const [criteriaJson, setCriteriaJson] = useState(""); const [rolesJson, setRolesJson] = useState(""); const [authoritiesJson, setAuthoritiesJson] = useState("");
  const [tx, setTx] = useState(""); const [phase, setPhase] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const authorities = useMemo(() => Object.fromEntries(roles.map(role => [role.id, [`${role.host.trim()}|${role.path.trim()}`]])), [roles]);
  const set = (key: keyof typeof f, value: string) => setF(old => ({ ...old, [key]: value }));
  function addRole(id: string) {
    const option = roleOptions.find(([key]) => key === id); if (!option || roles.some(role => role.id === id)) return;
    setRoles(old => [...old, { id: option[0], label: option[1], host: option[2], path: option[3] }]);
  }
  async function submit() {
    if (!address) { setError("Connect the policy-owner wallet first."); return; }
    if (wrongNetwork) { setError("Switch the connected wallet to Studionet 61999 before publishing."); return; }
    if (busy) return;
    try {
      setError("");
      const criteriaPayload = advanced && criteriaJson.trim() ? JSON.parse(criteriaJson) : criteria;
      const rolesPayload = advanced && rolesJson.trim() ? JSON.parse(rolesJson) : roles.map(role => role.id);
      const authorityPayload = advanced && authoritiesJson.trim() ? JSON.parse(authoritiesJson) : authorities;
      if (!Array.isArray(criteriaPayload) || !criteriaPayload.length) throw new Error("Add at least one criterion.");
      if (!Array.isArray(rolesPayload) || !rolesPayload.length) throw new Error("Select at least one required evidence role.");
      if (roles.some(role => !role.host.trim() || !role.path.startsWith("/"))) throw new Error("Each evidence authority needs a host and a path beginning with /.");
      setBusy(true); setPhase("requesting wallet signature");
      const hash = await createPolicy(address, [f.policyKey, f.lineageKey, f.softwareName, f.owner, f.repo, f.context, f.policy, JSON.stringify(criteriaPayload), JSON.stringify(rolesPayload), JSON.stringify(authorityPayload), f.predecessor]);
      setTx(hash); setPhase("submitted · waiting for FINALIZED"); await waitFinalized(hash); setPhase("policy finalized · immutable revision published");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase(/reject|denied/i.test(String(e)) ? "wallet signature rejected" : "transaction or policy validation failed"); }
    finally { setBusy(false); }
  }
  return <AppShell>
    <div className="page-head page-head-editorial"><div className="eyebrow"><span className="eyebrow-line"/> POLICY STUDIO <span className="network-tag">REVISION · {roles.length} EVIDENCE ROLES</span></div><h1>Set the standard<br/>before the release.</h1><p>Define the repository, usage context and evidence that validators will use. Once finalized, this revision becomes part of the public policy lineage.</p></div>
    <div className="editor-layout"><div className="editor-main">
      <section className="editor-section"><SectionTitle number="01" title="Software identity" note="The lineage this policy governs."/><div className="form-grid">
        <label>Policy key<input value={f.policyKey} onChange={e=>set("policyKey",e.target.value)} placeholder="truss-policy-v1"/></label><label>Lineage key<input value={f.lineageKey} onChange={e=>set("lineageKey",e.target.value)} placeholder="truss-release-line"/></label>
        <label>Software name<input value={f.softwareName} onChange={e=>set("softwareName",e.target.value)} placeholder="TRUSS"/></label><label>Predecessor policy key<input value={f.predecessor} onChange={e=>set("predecessor",e.target.value)} placeholder="Leave blank for a new lineage"/></label>
        <label>Repository owner<input value={f.owner} onChange={e=>set("owner",e.target.value)} placeholder="Ifem1"/></label><label>Repository name<input value={f.repo} onChange={e=>set("repo",e.target.value)} placeholder="truss"/></label>
        <label className="wide">Usage context<textarea value={f.context} onChange={e=>set("context",e.target.value)} placeholder="Describe where and how this software will be used."/></label><label className="wide">Admission policy<textarea value={f.policy} onChange={e=>set("policy",e.target.value)} placeholder="State the admission boundary and what the assessment can conclude."/></label>
      </div></section>
      <section className="editor-section"><SectionTitle number="02" title="Admission criteria" note="Each rule receives a deterministic classification."/>
        <div className="criteria-editor">{criteria.map((criterion, index)=><article className="criterion-entry" key={index}><div className="criterion-entry-head"><span className="criterion-index">CRITERION {String(index+1).padStart(2,"0")}</span><button className="icon-button danger-icon" type="button" aria-label="Remove criterion" onClick={()=>setCriteria(old=>old.filter((_,i)=>i!==index))} disabled={criteria.length===1}><Trash2 size={15}/></button></div><div className="form-grid"><label>Criterion ID<input value={criterion.id} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,id:e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,"")}:x))} placeholder="TESTS_PASS"/></label><label>Title<input value={criterion.title} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,title:e.target.value}:x))} placeholder="Required release checks"/></label><label className="wide">Rule<textarea value={criterion.rule} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,rule:e.target.value}:x))} placeholder="Describe what evidence must establish."/></label></div></article>)}</div>
        <button className="add-row-button" type="button" onClick={()=>setCriteria(old=>[...old,{id:"",title:"",rule:""}])}><Plus size={15}/> Add criterion</button>
      </section>
      <section className="editor-section"><SectionTitle number="03" title="Evidence authorities" note="Freeze the roles and source scopes accepted for review."/>
        <div className="role-picker">{roleOptions.map(([id,label])=><button type="button" className={`role-chip${roles.some(role=>role.id===id)?" selected":""}`} key={id} onClick={()=>id==="RELEASE_IDENTITY"&&roles.some(role=>role.id===id)?undefined:roles.some(role=>role.id===id)?setRoles(old=>old.filter(role=>role.id!==id)):addRole(id)} aria-pressed={roles.some(role=>role.id===id)} aria-label={id==="RELEASE_IDENTITY"?`${label}, required`:label}>{roles.some(role=>role.id===id)?<span className="chip-check">✓</span>:<Plus size={13}/>} {label}{id==="RELEASE_IDENTITY"?<span className="required-tag">required</span>:null}</button>)}</div>
        {roles.length?<div className="authority-list">{roles.map(role=><div className="authority-entry" key={role.id}><div className="authority-role"><span className="signal-dot"/><div><b>{role.label}</b><code>{role.id}</code></div></div><label>Host<input value={role.host} onChange={e=>setRoles(old=>old.map(x=>x.id===role.id?{...x,host:e.target.value}:x))} placeholder="api.github.com"/></label><label>Path prefix<input value={role.path} onChange={e=>setRoles(old=>old.map(x=>x.id===role.id?{...x,path:e.target.value}:x))} placeholder="/repos/owner/project/"/></label></div>)}</div>:<div className="empty-state">Select one or more evidence roles above.</div>}
      </section>
      <details className="advanced-editor" open={advanced} onToggle={e=>setAdvanced((e.currentTarget as HTMLDetailsElement).open)}><summary><span><ChevronDown size={16}/> Advanced JSON</span><small>Optional direct contract payload editing</small></summary><div className="form-grid"><label className="wide">Criteria JSON<textarea className="code tall" value={criteriaJson} onChange={e=>setCriteriaJson(e.target.value)} placeholder={JSON.stringify(criteria,null,2)}/></label><label>Required roles JSON<textarea className="code tall" value={rolesJson} onChange={e=>setRolesJson(e.target.value)} placeholder={JSON.stringify(roles.map(role=>role.id),null,2)}/></label><label>Evidence authorities JSON<textarea className="code tall" value={authoritiesJson} onChange={e=>setAuthoritiesJson(e.target.value)} placeholder={JSON.stringify(authorities,null,2)}/></label></div><p className="field-note">When a JSON field has content, it overrides the structured editor for that payload.</p></details>
    </div><aside className="editor-aside"><div className="aside-sticky"><span className="section-kicker">REVISION PREVIEW</span><h2>A policy<br/>takes shape.</h2><p>Finalized policy coordinates are immutable. A later revision uses a new key and points to its predecessor.</p><div className="revision-preview"><span className="revision-node"/><div><small>NEW REVISION</small><strong>{f.softwareName||"Software"}</strong><code>{f.owner||"owner"}/{f.repo||"repository"}</code></div><span className="revision-rule"/><div className="preview-meta"><span>CRITERIA <b>{advanced&&criteriaJson.trim()?"JSON":criteria.length}</b></span><span>ROLES <b>{advanced&&rolesJson.trim()?"JSON":roles.length}</b></span><span>LINEAGE <b>{f.lineageKey||"UNSET"}</b></span></div></div><div className="immutable-note"><span className="revision-stamp">REVISION</span><span>Every change publishes a new policy record. Existing policy terms stay inspectable.</span></div></div></aside></div>
    {error?<div className="error" role="alert">{error}</div>:null}<TxPanel hash={tx} phase={phase}/><div className="submit-bar"><div><b>Ready to freeze the standard?</b><small>Wallet signature → FINALIZED → policy is immutable</small></div><button className="button" disabled={busy||!address||wrongNetwork||!f.policyKey||!f.lineageKey||!f.owner||!f.repo||roles.length===0} onClick={()=>void submit()}>{busy?"Waiting for finalized result…":"Publish immutable policy"}</button></div>
  </AppShell>;
}

function SectionTitle({number,title,note}:{number:string;title:string;note:string}){return <div className="editor-title"><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></div>}
