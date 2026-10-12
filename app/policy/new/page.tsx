"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import TxPanel from "@/components/TxPanel";
import { useWallet } from "@/components/WalletProvider";
import { createPolicy, createPolicyWithIssuers, createPolicyWithPublisher, createPolicyWithSignedManifest } from "@/lib/contracts";
import { waitFinalized } from "@/lib/genlayer";
import { validateGithubEvidenceScopes, type EvidenceAuthorities } from "@/lib/policy-scope";

type Criterion = { id: string; title: string; rule: string };
type Role = { id: string; label: string; host: string; path: string; issuer: string };
const roleOptions = [
  ["RELEASE_IDENTITY", "Release identity", "api.github.com", "/repos/"],
  ["TEST_STATUS", "Test status", "api.github.com", "/repos/"],
  ["SECURITY_STATUS", "Security status", "github.com", "/"],
  ["CHANGE_DISCLOSURE", "Change disclosure", "github.com", "/"],
  ["MIGRATION_GUIDE", "Migration guide", "github.com", "/"],
  ["PROVENANCE", "Provenance", "api.github.com", "/repos/"],
] as const;

export default function Page() {
  const { address, wrongNetwork } = useWallet();
  const [f, setF] = useState({ policyKey: "", lineageKey: "", softwareName: "", owner: "", repo: "", context: "", policy: "", predecessor: "", publisher: "" });
  const [criteria, setCriteria] = useState<Criterion[]>([{ id: "IDENTITY_BOUND", title: "Exact release identity", rule: "Official release evidence must bind the stated release to the exact candidate commit SHA." }, { id: "TESTS_PASS", title: "Required release checks", rule: "Admissible test evidence must materially show required release checks completed successfully for the exact candidate." }]);
  const [roles, setRoles] = useState<Role[]>([
    { id: "RELEASE_IDENTITY", label: "Release identity", host: "api.github.com", path: "/repos/", issuer: "" },
    { id: "TEST_STATUS", label: "Test status", host: "api.github.com", path: "/repos/", issuer: "" },
  ]);
  const [advanced, setAdvanced] = useState(false);
  const [criteriaJson, setCriteriaJson] = useState(""); const [rolesJson, setRolesJson] = useState(""); const [authoritiesJson, setAuthoritiesJson] = useState("");
  const [tagRefUrl, setTagRefUrl] = useState("https://api.github.com/repos/Ifem1/truss/git/ref/tags/v0.1.2-actions-proof");
  const [tagObjectUrl, setTagObjectUrl] = useState("https://api.github.com/repos/Ifem1/truss/git/tags/c10939d6449a107dfd84de2981d69dc8727d6822");
  const [actionsRunUrl, setActionsRunUrl] = useState("https://api.github.com/repos/Ifem1/truss/actions/runs/37973817856");
  const [policyReviewed, setPolicyReviewed] = useState(false);
  const [signedManifestMode, setSignedManifestMode] = useState(false);
  const [rsaModulusHex, setRsaModulusHex] = useState("");
  const [rsaExponentHex, setRsaExponentHex] = useState("010001");
  const [githubRepositoryId, setGithubRepositoryId] = useState("1407596595");
  const [tx, setTx] = useState(""); const [phase, setPhase] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const authorities = useMemo(() => Object.fromEntries(roles.map(role => [role.id, [`${role.host.trim()}|${role.path.trim()}`]])), [roles]);
  const issuers = useMemo(() => Object.fromEntries(roles.map(role => [role.id, role.issuer.trim()])), [roles]);
  const scopePreflight = useMemo(() => {
    try {
      const rolePayload = advanced && rolesJson.trim() ? JSON.parse(rolesJson) : roles.map(role => role.id);
      const authorityPayload = advanced && authoritiesJson.trim() ? JSON.parse(authoritiesJson) : authorities;
      if (!Array.isArray(rolePayload) || !rolePayload.includes("RELEASE_IDENTITY") || !(signedManifestMode ? rolePayload.includes("PROVENANCE") : rolePayload.includes("TEST_STATUS"))) {
        return { issues: [signedManifestMode ? "Signed-manifest policies require RELEASE_IDENTITY and PROVENANCE roles." : "Required roles must include RELEASE_IDENTITY and TEST_STATUS for tag and Actions evidence."], payloadError: "" };
      }
      if (!authorityPayload || typeof authorityPayload !== "object" || Array.isArray(authorityPayload)) {
        return { issues: ["Evidence authorities JSON must be an object keyed by evidence role."], payloadError: "" };
      }
      if (signedManifestMode) {
        const repoPath = `/${f.owner}/${f.repo}/releases/`;
        const roleScopes = (role: string) => Array.isArray(authorityPayload[role]) ? authorityPayload[role] as Array<{host?:string;path_prefix?:string}|string> : [];
        const hasScope = (role: string, expectedPath: string) => roleScopes(role).some(value => {
          const [scopeHost, scopePath] = typeof value === "string" ? [value.split("|")[0], value.split("|").slice(1).join("|")] : [value.host, value.path_prefix];
          return scopeHost?.toLowerCase()==="github.com" && scopePath?.toLowerCase().startsWith(expectedPath.toLowerCase());
        });
        const releaseScope = hasScope("RELEASE_IDENTITY", `${repoPath}tag/`);
        const manifestScope = hasScope("PROVENANCE", `${repoPath}download/`);
        return { issues: [!releaseScope ? "RELEASE_IDENTITY must include the canonical repository GitHub release-tag path." : "", !manifestScope ? "PROVENANCE must include the canonical repository GitHub release-download path." : ""].filter(Boolean), payloadError: "" };
      }
      return { issues: validateGithubEvidenceScopes(authorityPayload as EvidenceAuthorities, { releaseTagRefUrl: tagRefUrl, annotatedTagObjectUrl: tagObjectUrl, actionsRunUrl }, f.owner, f.repo), payloadError: "" };
    } catch (e) {
      return { issues: [], payloadError: e instanceof Error ? `Invalid Advanced JSON: ${e.message}` : "Invalid Advanced JSON." };
    }
  }, [advanced, rolesJson, authoritiesJson, authorities, roles, tagRefUrl, tagObjectUrl, actionsRunUrl, f.owner, f.repo, signedManifestMode]);
  const set = (key: keyof typeof f, value: string) => setF(old => ({ ...old, [key]: value }));
  function addRole(id: string) {
    const option = roleOptions.find(([key]) => key === id); if (!option || roles.some(role => role.id === id)) return;
    setRoles(old => [...old, { id: option[0], label: option[1], host: option[2], path: option[3], issuer: "" }]);
  }
  function toggleSignedManifest(enabled: boolean) {
    setSignedManifestMode(enabled);
    if (!enabled) return;
    setRoles(old => {
      const release = old.find(role => role.id === "RELEASE_IDENTITY") ?? { id: "RELEASE_IDENTITY", label: "Release identity", host: "github.com", path: `/Ifem1/truss/releases/tag/`, issuer: "" };
      const provenance = old.find(role => role.id === "PROVENANCE") ?? { id: "PROVENANCE", label: "Provenance", host: "github.com", path: `/Ifem1/truss/releases/download/`, issuer: "" };
      return [
        { ...release, host: "github.com", path: `/${f.owner || "Ifem1"}/${f.repo || "truss"}/releases/tag/` },
        { ...provenance, host: "github.com", path: `/${f.owner || "Ifem1"}/${f.repo || "truss"}/releases/download/` },
      ];
    });
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
      if (!Array.isArray(rolesPayload) || !rolesPayload.includes("RELEASE_IDENTITY") || !(signedManifestMode ? rolesPayload.includes("PROVENANCE") : rolesPayload.includes("TEST_STATUS"))) throw new Error(signedManifestMode ? "Signed-manifest policies require RELEASE_IDENTITY and PROVENANCE roles." : "Required roles must include RELEASE_IDENTITY and TEST_STATUS for tag and Actions evidence.");
      const scopeIssues = signedManifestMode ? scopePreflight.issues : validateGithubEvidenceScopes(authorityPayload as EvidenceAuthorities, { releaseTagRefUrl: tagRefUrl, annotatedTagObjectUrl: tagObjectUrl, actionsRunUrl }, f.owner, f.repo);
      if (scopeIssues.length) throw new Error(`Evidence scope preflight failed: ${scopeIssues.join("; ")}`);
      if (roles.some(role => !role.host.trim() || !role.path.startsWith("/"))) throw new Error("Each evidence authority needs a host and a path beginning with /.");
      const issuerMode = roles.some(role => role.issuer.trim());
      if (issuerMode && (!f.publisher.trim() || roles.some(role => !/^0x[0-9a-fA-F]{40}$/.test(role.issuer.trim())))) throw new Error("Issuer-bound policies need a separate publisher and one issuer wallet for every role.");
      if (signedManifestMode && (!f.publisher.trim() || rolesPayload.some(role => !/^0x[0-9a-fA-F]{40}$/.test(issuers[String(role)] ?? "")))) throw new Error("Signed-manifest policies need a separate publisher and one designated issuer wallet for every role.");
      if (signedManifestMode && (!/^[0-9a-fA-F]{512,1024}$/.test(rsaModulusHex.trim()) || rsaExponentHex.trim().toLowerCase() !== "010001" || !/^[0-9]{1,20}$/.test(githubRepositoryId.trim()))) throw new Error("Enter the policy-authorized 2048-4096 bit RSA modulus, exponent 65537 (010001), and numeric GitHub repository ID.");
      setBusy(true); setPhase("requesting wallet signature");
      const args = [f.policyKey, f.lineageKey, f.softwareName, f.owner, f.repo, f.context, f.policy, JSON.stringify(criteriaPayload), JSON.stringify(rolesPayload), JSON.stringify(authorityPayload), f.predecessor];
      const issuerPayload = Object.fromEntries((rolesPayload as string[]).map(role => [role, issuers[role] ?? ""]));
      const hash = signedManifestMode
        ? await createPolicyWithSignedManifest(address, [...args, f.publisher.trim(), JSON.stringify(issuerPayload), JSON.stringify({ modulus_hex: rsaModulusHex.trim().toLowerCase(), exponent_hex: rsaExponentHex.trim().toLowerCase() }), githubRepositoryId.trim()])
        : issuerMode ? await createPolicyWithIssuers(address, [...args, f.publisher.trim(), JSON.stringify(issuers)]) : f.publisher.trim() ? await createPolicyWithPublisher(address, [...args, f.publisher.trim()]) : await createPolicy(address, args);
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
        <label className="wide">Designated publisher wallet (optional)<input value={f.publisher} onChange={e=>set("publisher",e.target.value)} placeholder="0x…; leave blank to publish from this wallet"/><small>Only this wallet can open candidates under the frozen policy. A different address does not prove independent control.</small></label>
        <label className="wide">Usage context<textarea value={f.context} onChange={e=>set("context",e.target.value)} placeholder="Describe where and how this software will be used."/></label><label className="wide">Admission policy<textarea value={f.policy} onChange={e=>set("policy",e.target.value)} placeholder="State the admission boundary and what the assessment can conclude."/></label>
      </div></section>
      <section className="editor-section"><SectionTitle number="02" title="Admission criteria" note="Each rule receives a deterministic classification."/>
        <div className="criteria-editor">{criteria.map((criterion, index)=><article className="criterion-entry" key={index}><div className="criterion-entry-head"><span className="criterion-index">CRITERION {String(index+1).padStart(2,"0")}</span><button className="icon-button danger-icon" type="button" aria-label="Remove criterion" onClick={()=>setCriteria(old=>old.filter((_,i)=>i!==index))} disabled={criteria.length===1}><Trash2 size={15}/></button></div><div className="form-grid"><label>Criterion ID<input value={criterion.id} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,id:e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,"")}:x))} placeholder="TESTS_PASS"/></label><label>Title<input value={criterion.title} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,title:e.target.value}:x))} placeholder="Required release checks"/></label><label className="wide">Rule<textarea value={criterion.rule} onChange={e=>setCriteria(old=>old.map((x,i)=>i===index?{...x,rule:e.target.value}:x))} placeholder="Describe what evidence must establish."/></label></div></article>)}</div>
        <button className="add-row-button" type="button" onClick={()=>setCriteria(old=>[...old,{id:"",title:"",rule:""}])}><Plus size={15}/> Add criterion</button>
      </section>
      <section className="editor-section"><SectionTitle number="03" title="Evidence authorities" note="Freeze the roles and source scopes accepted for review."/>
        <div className="role-picker">{roleOptions.map(([id,label])=><button type="button" className={`role-chip${roles.some(role=>role.id===id)?" selected":""}`} key={id} onClick={()=>id==="RELEASE_IDENTITY"&&roles.some(role=>role.id===id)||signedManifestMode&&id==="PROVENANCE"&&roles.some(role=>role.id===id)?undefined:roles.some(role=>role.id===id)?setRoles(old=>old.filter(role=>role.id!==id)):addRole(id)} aria-pressed={roles.some(role=>role.id===id)} aria-label={id==="RELEASE_IDENTITY"||signedManifestMode&&id==="PROVENANCE"?`${label}, required`:label}>{roles.some(role=>role.id===id)?<span className="chip-check">✓</span>:<Plus size={13}/>} {label}{id==="RELEASE_IDENTITY"||signedManifestMode&&id==="PROVENANCE"?<span className="required-tag">required</span>:null}</button>)}</div>
        {roles.length?<div className="authority-list">{roles.map(role=><div className="authority-entry" key={role.id}><div className="authority-role"><span className="signal-dot"/><div><b>{role.label}</b><code>{role.id}</code></div></div><label>Host<input value={role.host} onChange={e=>setRoles(old=>old.map(x=>x.id===role.id?{...x,host:e.target.value}:x))} placeholder="api.github.com"/></label><label>Path prefix<input value={role.path} onChange={e=>setRoles(old=>old.map(x=>x.id===role.id?{...x,path:e.target.value}:x))} placeholder="/repos/owner/project/"/></label><label>Designated issuer wallet (optional)<input value={role.issuer} onChange={e=>setRoles(old=>old.map(x=>x.id===role.id?{...x,issuer:e.target.value}:x))} placeholder="0x…"/></label></div>)}</div>:<div className="empty-state">Select one or more evidence roles above.</div>}
        <p className="field-note">If any issuer is set, every selected role needs one. Issuers sign SHA-256 commitments for the exact candidate and evidence round. Policy selection of wallets does not prove independent ownership.</p>
      </section>
      <section className="editor-section"><SectionTitle number="04" title="GitHub evidence scope check" note="These exact canonical URLs must fit the frozen role scopes before a policy can be signed."/>
        <label className="review-confirm"><input type="checkbox" checked={signedManifestMode} onChange={e=>toggleSignedManifest(e.target.checked)}/> Use policy-authorized RSA-SHA256 signed release manifests</label>
        {signedManifestMode?<><div className="form-grid">
          <label className="wide">GitHub repository numeric ID<input inputMode="numeric" value={githubRepositoryId} onChange={e=>setGithubRepositoryId(e.target.value)} aria-label="GitHub repository numeric ID"/></label>
          <label className="wide">RSA public modulus (hex)<textarea className="code" value={rsaModulusHex} onChange={e=>setRsaModulusHex(e.target.value)} spellCheck={false} placeholder="2048–4096 bit public modulus from the authorized release signer"/></label>
          <label>RSA public exponent (hex)<input value={rsaExponentHex} onChange={e=>setRsaExponentHex(e.target.value)} spellCheck={false}/></label>
        </div><p className="field-note">The frozen RSA key fingerprint authenticates the manifest bytes and claims. The fingerprint alone does not prove the signer is a separate person or organization. GitHub Sigstore provenance remains supplementary; this contract verifies the RSA manifest, not Sigstore.</p></>:null}
        <div className="form-grid">
          <label className="wide">GitHub tag-reference API URL<input aria-label="GitHub tag-reference API URL" value={tagRefUrl} onChange={e=>setTagRefUrl(e.target.value)} spellCheck={false}/></label>
          <label className="wide">Annotated-tag object API URL<input aria-label="Annotated-tag object API URL" value={tagObjectUrl} onChange={e=>setTagObjectUrl(e.target.value)} spellCheck={false}/></label>
          <label className="wide">Canonical Actions-run API URL<input aria-label="Canonical Actions-run API URL" value={actionsRunUrl} onChange={e=>setActionsRunUrl(e.target.value)} spellCheck={false}/></label>
        </div>
        {scopePreflight.payloadError ? <div className="error" role="alert">{scopePreflight.payloadError}</div> : scopePreflight.issues.length ? <div className="error" role="alert"><b>Policy cannot be published yet.</b><ul>{scopePreflight.issues.map((issue,index)=><li key={index}>{issue}</li>)}</ul></div> : <div className="success" role="status">{signedManifestMode?"Signed-manifest release and download scopes match this repository.":"All three evidence URLs are covered by the configured role scopes."} The contract repeats its own validation.</div>}
        <p className="field-note">{signedManifestMode?"The signed manifest binds the release tag, commit, artifact digest, and CI claim; redirect delivery cannot change those bytes without invalidating the signature.":"The Actions URL must be on api.github.com and inside TEST_STATUS. Advanced JSON is checked with the same preflight before the wallet call."}</p>
      </section>
      <details className="advanced-editor" open={advanced} onToggle={e=>setAdvanced((e.currentTarget as HTMLDetailsElement).open)}><summary><span><ChevronDown size={16}/> Advanced JSON</span><small>Optional direct contract payload editing</small></summary><div className="form-grid"><label className="wide">Criteria JSON<textarea className="code tall" value={criteriaJson} onChange={e=>setCriteriaJson(e.target.value)} placeholder={JSON.stringify(criteria,null,2)}/></label><label>Required roles JSON<textarea className="code tall" value={rolesJson} onChange={e=>setRolesJson(e.target.value)} placeholder={JSON.stringify(roles.map(role=>role.id),null,2)}/></label><label>Evidence authorities JSON<textarea className="code tall" value={authoritiesJson} onChange={e=>setAuthoritiesJson(e.target.value)} placeholder={JSON.stringify(authorities,null,2)}/></label></div><p className="field-note">When a JSON field has content, it overrides the structured editor for that payload.</p></details>
    </div><aside className="editor-aside"><div className="aside-sticky"><span className="section-kicker">REVISION PREVIEW</span><h2>A policy<br/>takes shape.</h2><p>Finalized policy coordinates are immutable. A later revision uses a new key and points to its predecessor.</p><div className="revision-preview"><span className="revision-node"/><div><small>NEW REVISION</small><strong>{f.softwareName||"Software"}</strong><code>{f.owner||"owner"}/{f.repo||"repository"}</code></div><span className="revision-rule"/><div className="preview-meta"><span>CRITERIA <b>{advanced&&criteriaJson.trim()?"JSON":criteria.length}</b></span><span>ROLES <b>{advanced&&rolesJson.trim()?"JSON":roles.length}</b></span><span>LINEAGE <b>{f.lineageKey||"UNSET"}</b></span></div></div><div className="immutable-note"><span className="revision-stamp">REVISION</span><span>Every change publishes a new policy record. Existing policy terms stay inspectable.</span></div><div className="immutable-note"><span className="revision-stamp">SIGNATURE REVIEW</span><span>Issuer wallets: {roles.filter(role=>role.issuer.trim()).map(role=>`${role.id} ${role.issuer.trim()}`).join(" · ")||"none configured"}. Evidence scopes are listed above. The registry computes the exact policy digest during execution; it is available after finality. Policy creation is permanent.</span></div><div className="immutable-note"><span className="revision-stamp">INDEPENDENCE LIMIT</span><span>{signedManifestMode?"A valid RSA signature proves that the frozen key signed the exact manifest. It does not verify a human or organization identity, establish independence, or mean the contract verifies GitHub Sigstore.":"Distinct issuer wallets prove wallet control and content commitments only; they do not prove public identity or organizational independence."}</span></div></div></aside></div>
    {error?<div className="error" role="alert">{error}</div>:null}<TxPanel hash={tx} phase={phase}/><div className="submit-bar"><div><b>Ready to freeze the standard?</b><small>Wallet signature → FINALIZED → policy is immutable</small><label className="review-confirm"><input type="checkbox" checked={policyReviewed} onChange={e=>setPolicyReviewed(e.target.checked)}/> I reviewed the frozen roles, issuer wallets, scopes and permanence.</label></div><button className="button" disabled={busy||!address||wrongNetwork||!f.policyKey||!f.lineageKey||!f.owner||!f.repo||roles.length===0||scopePreflight.issues.length>0||Boolean(scopePreflight.payloadError)||!policyReviewed} onClick={()=>void submit()}>{busy?"Waiting for finalized result…":"Publish immutable policy"}</button></div>
  </AppShell>;
}

function SectionTitle({number,title,note}:{number:string;title:string;note:string}){return <div className="editor-title"><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></div>}
