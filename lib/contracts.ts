"use client";
import { ACTIVATION_GATE_ADDRESS, CONTRACT_ADDRESS } from "@/lib/config";
import { readContract, writeContract } from "@/lib/genlayer";

export type PolicyRecord = { policy_key:string; lineage_key:string; owner:string; publisher?:string; evidence_issuers?:Record<string,string>; software_name:string; repository_owner:string; repository_name:string; usage_context:string; admission_policy:string; criteria:Array<{id:string;title:string;rule:string}>; required_roles:string[]; evidence_authorities:Record<string,Array<{host:string;path_prefix:string}>>; predecessor_policy_key:string; version:number; policy_digest:string };
export type CandidateRecord = { candidate_key:string; policy_key:string; policy_digest:string; lineage_key:string; owner:string; publisher?:string; repository_owner:string; repository_name:string; release_label:string; commit_sha:string; predecessor_candidate_key:string; coordinate_digest:string; opened_at:number; abandoned_at?:number; abandoned_by?:string; status:string; evidence_rounds:Array<{round:number;submitted_at:number;evidence_round_digest:string;evidence:Array<{role:string;url:string}>}>; sealed_evidence_rounds?:number[]; evidence_attestations?:Array<{round:number;role:string;url:string;content_digest:string;issuer:string;policy_digest:string;coordinate_digest:string}>; assessment_attempts:Array<Record<string,any>> };
function parseJson<T>(raw: unknown): T | null { if (typeof raw !== "string" || !raw) return null; try { return JSON.parse(raw) as T; } catch { return null; } }
export async function listPolicyKeys(){ return readContract<string[]>(CONTRACT_ADDRESS,"list_policy_keys"); }
export async function listCandidateKeys(){ return readContract<string[]>(CONTRACT_ADDRESS,"list_candidate_keys"); }
export async function getPolicy(key:string){ return parseJson<PolicyRecord>(await readContract<string>(CONTRACT_ADDRESS,"get_policy_json",[key])); }
export async function getCandidate(key:string){ return parseJson<CandidateRecord>(await readContract<string>(CONTRACT_ADDRESS,"get_candidate_json",[key])); }
export async function getAdmittedHead(lineage:string){ return readContract<string>(CONTRACT_ADDRESS,"get_admitted_head",[lineage]); }
export async function getAdmittedHistory(lineage:string){ const raw=await readContract<string>(CONTRACT_ADDRESS,"get_admitted_history_json",[lineage]); return parseJson<Array<Record<string,unknown>>>(raw)??[]; }
export function createPolicy(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"create_policy",args); }
export function createPolicyWithPublisher(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"create_policy_with_publisher",args); }
export function createPolicyWithIssuers(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"create_policy_with_issuers",args); }
export function openCandidate(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"open_candidate",args); }
export function appendEvidenceRound(a:`0x${string}`,key:string,evidence:string){ return writeContract(a,CONTRACT_ADDRESS,"append_evidence_round",[key,evidence]); }
export function assessCandidate(a:`0x${string}`,key:string){ return writeContract(a,CONTRACT_ADDRESS,"assess_candidate",[key]); }
export function abandonCandidate(a:`0x${string}`,key:string){ return writeContract(a,CONTRACT_ADDRESS,"abandon_candidate",[key]); }
export function attestEvidence(a:`0x${string}`,key:string,role:string,url:string,digest:string){ return writeContract(a,CONTRACT_ADDRESS,"attest_evidence",[key,role,url,digest]); }
export function sealCandidate(a:`0x${string}`,key:string){ return writeContract(a,CONTRACT_ADDRESS,"seal_candidate",[key]); }
export type ActivationGateConfig = {registry_address:string;operator:string;lineage_key:string;policy_digest:string;repository_owner:string;repository_name:string};
export async function getActivationGateConfig(){ return parseJson<ActivationGateConfig>(await readContract<string>(ACTIVATION_GATE_ADDRESS,"get_configuration_json")); }
export function getActiveRelease(){ return readContract<string>(ACTIVATION_GATE_ADDRESS,"get_active_candidate"); }
export async function getActivationHistory(){ return parseJson<Array<{candidate_key:string;policy_digest:string;commit_sha:string;assessment_digest:string}>>(await readContract<string>(ACTIVATION_GATE_ADDRESS,"get_activation_history_json"))??[]; }
export function activateRelease(a:`0x${string}`,key:string){ return writeContract(a,ACTIVATION_GATE_ADDRESS,"activate_release",[key]); }
